import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { generateBuyOutsideNotePdf } from '../services/pdfService.js';
import { pool } from '../config/db.js';

const router = express.Router();

router.use(authenticate);

// 1. GET /api/admin/medicines - List/Search Medicine Catalog with Stock Info
router.get('/', async (req, res) => {
  try {
    const { query, status, category_id } = req.query;
    let sql = `
      SELECT m.*, mc.name as category_name 
      FROM medicines m
      LEFT JOIN medicine_categories mc ON m.category_id = mc.id
      WHERE 1=1
    `;
    const params = [];

    if (query && query.trim()) {
      params.push(`%${query.trim()}%`);
      sql += ` AND (m.name ILIKE $${params.length} OR m.unit ILIKE $${params.length})`;
    }

    if (status && status.trim() && status !== 'all') {
      params.push(status.trim().toUpperCase());
      sql += ` AND m.status = $${params.length}`;
    }

    if (category_id && category_id.trim() && category_id !== 'all') {
      params.push(parseInt(category_id, 10));
      sql += ` AND m.category_id = $${params.length}`;
    }

    sql += ` ORDER BY m.name ASC`;

    const result = await pool.query(sql, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching medicine catalog:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch medicine catalog.' });
  }
});

// 2. POST /api/admin/medicines - Add New Medicine (No direct stock editing allowed here)
router.post('/', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { name, unit_price, unit, reorder_level, status, category_id } = req.body;

    if (!name || !name.trim() || unit_price === undefined) {
      return res.status(400).json({ success: false, error: 'Medicine name and unit price are required.' });
    }

    const price = parseFloat(unit_price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, error: 'Invalid unit price.' });
    }

    const result = await pool.query(
      `INSERT INTO medicines (hospital_id, name, unit_price, unit, current_stock, reorder_level, status, category_id)
       VALUES ('GJS-HOSP-01', $1, $2, $3, 0, $4, $5, $6)
       RETURNING *`,
      [
        name.trim(),
        price,
        unit || 'tablet',
        parseInt(reorder_level || 10, 10),
        (status || 'ACTIVE').toUpperCase(),
        category_id ? parseInt(category_id, 10) : null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Medicine added to catalog successfully!',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding medicine:', err);
    res.status(500).json({ success: false, error: 'Failed to add medicine to catalog.' });
  }
});

// 3. PUT /api/admin/medicines/:id - Update Medicine Details
router.put('/:id', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit_price, unit, reorder_level, status, category_id } = req.body;

    const exist = await pool.query(`SELECT * FROM medicines WHERE id = $1`, [id]);
    if (exist.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Medicine not found.' });
    }

    const current = exist.rows[0];
    const newName = name !== undefined ? name.trim() : current.name;
    const newPrice = unit_price !== undefined ? parseFloat(unit_price) : parseFloat(current.unit_price);
    const newUnit = unit !== undefined ? unit : current.unit;
    const newReorder = reorder_level !== undefined ? parseInt(reorder_level, 10) : current.reorder_level;
    const newStatus = status !== undefined ? status.toUpperCase() : current.status;
    const newCategory = category_id !== undefined ? (category_id ? parseInt(category_id, 10) : null) : current.category_id;

    const result = await pool.query(
      `UPDATE medicines
       SET name = $1, unit_price = $2, unit = $3, reorder_level = $4, status = $5, category_id = $6
       WHERE id = $7
       RETURNING *`,
      [newName, newPrice, newUnit, newReorder, newStatus, newCategory, id]
    );

    res.json({
      success: true,
      message: 'Medicine details updated successfully!',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating medicine:', err);
    res.status(500).json({ success: false, error: 'Failed to update medicine.' });
  }
});

// 4. POST /api/admin/medicines/stock-in - Record Received Stock (PURCHASE_IN movement)
router.post('/stock-in', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { medicine_id, quantity, reference, batch_number, expiry_date } = req.body;

    if (!medicine_id || !quantity || parseInt(quantity, 10) <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Medicine ID and positive quantity are required.' });
    }

    const qty = parseInt(quantity, 10);

    // Update medicine stock
    const medRes = await client.query(
      `UPDATE medicines SET current_stock = current_stock + $1 WHERE id = $2 RETURNING *`,
      [qty, medicine_id]
    );

    if (medRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Medicine not found.' });
    }

    const updatedMed = medRes.rows[0];

    // Log StockMovement with batch & expiry
    const movRes = await client.query(
      `INSERT INTO stock_movements (hospital_id, medicine_id, type, quantity, reference, created_by, batch_number, expiry_date)
       VALUES ('GJS-HOSP-01', $1, 'PURCHASE_IN', $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        medicine_id,
        qty,
        reference || 'Supplier Stock Receipt',
        req.user.userId,
        batch_number || null,
        expiry_date ? expiry_date : null
      ]
    );

    // Recalculate nearest expiry date of active stock (future expiry dates only)
    const minExpRes = await client.query(
      `SELECT MIN(expiry_date) as nearest_expiry FROM stock_movements 
       WHERE medicine_id = $1 AND expiry_date >= CURRENT_DATE`,
      [medicine_id]
    );
    const nearestExpiry = minExpRes.rows[0]?.nearest_expiry || null;
    
    // Update the medicine's expiry_date to the nearest one
    await client.query(
      `UPDATE medicines SET expiry_date = $1 WHERE id = $2`,
      [nearestExpiry, medicine_id]
    );

    // Refresh return object with updated expiry date
    const finalMedRes = await client.query(`SELECT * FROM medicines WHERE id = $1`, [medicine_id]);

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Successfully added +${qty} units of ${updatedMed.name} to stock!`,
      medicine: finalMedRes.rows[0],
      movement: movRes.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error recording stock-in:', err);
    res.status(500).json({ success: false, error: 'Failed to record stock-in.' });
  } finally {
    client.release();
  }
});

// 5. GET /api/admin/medicines/stock-movements - Ledger Log of Stock Movements
router.get('/stock-movements', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { medicine_id } = req.query;
    let sql = `
      SELECT sm.*, m.name as medicine_name, m.unit, u.name as user_name
      FROM stock_movements sm
      LEFT JOIN medicines m ON sm.medicine_id = m.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (medicine_id) {
      params.push(medicine_id);
      sql += ` AND sm.medicine_id = $${params.length}`;
    }

    sql += ` ORDER BY sm.created_at DESC LIMIT 50`;

    const result = await pool.query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Error fetching stock movements:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stock movements log.' });
  }
});

// 6. POST /api/admin/pharmacy/dispense - Dispense Medicine from Stock & Bill Patient
router.post('/dispense', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { prescription_medicine_id, medicine_id, bill_id, quantity, prescribed_quantity } = req.body;

    if (!medicine_id || !bill_id || !quantity || parseInt(quantity, 10) <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Medicine ID, Bill ID, and positive quantity required.' });
    }

    const qty = parseInt(quantity, 10);
    const prescribedQty = parseInt(prescribed_quantity || qty, 10);

    // Check if the target bill is already PAID
    const billCheck = await client.query(`SELECT status FROM bills WHERE id = $1`, [bill_id]);
    if (billCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Bill not found.' });
    }
    if (billCheck.rows[0].status === 'PAID') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'This bill has already been PAID. Please create a new standalone bill for any new purchases.' });
    }

    // 1. Check medicine stock
    const medRes = await client.query(`SELECT * FROM medicines WHERE id = $1 FOR UPDATE`, [medicine_id]);
    if (medRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Medicine not found in catalog.' });
    }

    const med = medRes.rows[0];
    if (med.current_stock < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Insufficient stock for ${med.name}! Available stock: ${med.current_stock}, Requested: ${qty}. Please mark 'Buy Outside' if unavailable.`
      });
    }

    // 2. Deduct stock & create DISPENSED_OUT movement
    const newStock = med.current_stock - qty;
    await client.query(`UPDATE medicines SET current_stock = $1 WHERE id = $2`, [newStock, medicine_id]);

    await client.query(
      `INSERT INTO stock_movements (hospital_id, medicine_id, type, quantity, reference, created_by)
       VALUES ('GJS-HOSP-01', $1, 'DISPENSED_OUT', $2, $3, $4)`,
      [medicine_id, -qty, `Dispensed on Bill #${bill_id}`, req.user.userId]
    );

    // 3. Add PHARMACY line item to patient's bill
    const unitPrice = parseFloat(med.unit_price);
    const lineAmount = unitPrice * qty;

    await client.query(
      `INSERT INTO bill_items (bill_id, category, description, amount, quantity, is_confirmed)
       VALUES ($1, 'PHARMACY', $2, $3, $4, FALSE)`,
      [bill_id, `Pharmacy: ${med.name} (${med.unit || 'unit'})`, unitPrice, qty]
    );

    // Recalculate bill total (only sum confirmed items)
    const totRes = await client.query(`SELECT COALESCE(SUM(amount * quantity), 0.00) as total FROM bill_items WHERE bill_id = $1 AND is_confirmed = TRUE`, [bill_id]);
    const newTotal = parseFloat(totRes.rows[0].total);
    await client.query(`UPDATE bills SET total_amount = $1 WHERE id = $2`, [newTotal, bill_id]);

    // 4. Update prescription_medicines status
    const status = qty >= prescribedQty ? 'DISPENSED' : 'PARTIALLY_DISPENSED';
    if (prescription_medicine_id) {
      await client.query(
        `UPDATE prescription_medicines SET dispensed_status = $1, dispensed_quantity = $2, medicine_id = $3 WHERE id = $4`,
        [status, qty, medicine_id, prescription_medicine_id]
      );
    }

    // 5. Check Low Stock Notification
    let lowStockAlert = null;
    if (newStock < med.reorder_level) {
      lowStockAlert = `⚠️ Alert: ${med.name} is low on stock (${newStock} remaining, reorder level: ${med.reorder_level}).`;
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Dispensed ${qty}x ${med.name} successfully! (Added ₹${lineAmount.toFixed(2)} to bill)`,
      dispensedStatus: status,
      remainingStock: newStock,
      lowStockAlert
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error dispensing medicine:', err);
    res.status(500).json({ success: false, error: 'Failed to dispense medicine.' });
  } finally {
    client.release();
  }
});

// 7. POST /api/admin/pharmacy/buy-outside - Mark Medicine as NOT_DISPENSED (Buy Outside)
router.post('/buy-outside', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { prescription_medicine_id, note } = req.body;

    if (!prescription_medicine_id) {
      return res.status(400).json({ success: false, error: 'Prescription Medicine ID is required.' });
    }

    const result = await pool.query(
      `UPDATE prescription_medicines
       SET dispensed_status = 'NOT_DISPENSED',
           dispensed_note = $1
       WHERE id = $2
       RETURNING *`,
      [note || 'Out of stock / Patient opted to buy outside', prescription_medicine_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prescription medicine row not found.' });
    }

    res.json({
      success: true,
      message: 'Marked medicine as Buy Outside (NOT_DISPENSED). Excluded from hospital bill.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error marking buy outside:', err);
    res.status(500).json({ success: false, error: 'Failed to mark medicine as Buy Outside.' });
  }
});

// 8. GET /api/admin/pharmacy/buy-outside-pdf/:prescriptionId - Generate Printed Buy Outside Note PDF
router.get('/buy-outside-pdf/:prescriptionId', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescRes = await pool.query(`SELECT * FROM prescriptions WHERE id = $1`, [prescriptionId]);
    if (prescRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prescription not found.' });
    }

    const prescription = prescRes.rows[0];

    const medRes = await pool.query(
      `SELECT * FROM prescription_medicines WHERE prescription_id = $1 AND dispensed_status = 'NOT_DISPENSED'`,
      [prescriptionId]
    );

    if (medRes.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No "Buy Outside" medicines found for this prescription.' });
    }

    const ptRes = await pool.query(`SELECT name, uhid FROM patients WHERE id = $1`, [prescription.patient_id]);
    const patientInfo = ptRes.rows[0] || { name: 'Patient', uhid: 'N/A' };

    const pdfUrl = await generateBuyOutsideNotePdf(prescription, medRes.rows, patientInfo);
    res.json({ success: true, pdfUrl });
  } catch (err) {
    console.error('Error generating buy outside note PDF:', err);
    res.status(500).json({ success: false, error: 'Failed to generate Buy Outside Note PDF.' });
  }
});

// 9. GET /api/admin/medicines/prescription/by-appointment/:appointmentId
// Fetch prescription + medicines for a given appointment (used by Pharmacy Dispensing screen)
router.get('/prescription/by-appointment/:appointmentId', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST', 'RECEPTIONIST', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const prescRes = await pool.query(
      `SELECT p.*, a.patient_name, a.doctor_name, a.department_name
       FROM prescriptions p
       LEFT JOIN appointments a ON a.id = p.appointment_id
       WHERE p.appointment_id = $1`,
      [appointmentId]
    );

    if (prescRes.rows.length === 0) {
      return res.json({ success: false, data: null, message: 'No prescription found for this appointment.' });
    }

    const prescription = prescRes.rows[0];

    const medRes = await pool.query(
      `SELECT pm.*, m.current_stock, m.unit_price, m.id as catalog_medicine_id
       FROM prescription_medicines pm
       LEFT JOIN medicines m ON (LOWER(m.name) = LOWER(pm.name) OR pm.medicine_id = m.id)
       WHERE pm.prescription_id = $1
       ORDER BY pm.id ASC`,
      [prescription.id]
    );

    res.json({
      success: true,
      data: {
        ...prescription,
        medicines: medRes.rows
      }
    });
  } catch (err) {
    console.error('Error fetching prescription by appointment:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch prescription.' });
  }
});

// A. GET /api/admin/medicines/categories - List all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicine_categories ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
});

// B. POST /api/admin/medicines/categories - Create Category
router.post('/categories', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }
    const result = await pool.query(
      'INSERT INTO medicine_categories (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json({ success: true, message: 'Category created successfully!', data: result.rows[0] });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ success: false, error: 'Category name must be unique.' });
  }
});

// C. PUT /api/admin/medicines/categories/:id - Update Category
router.put('/categories/:id', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }
    const result = await pool.query(
      'UPDATE medicine_categories SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category updated successfully!', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ success: false, error: 'Failed to update category.' });
  }
});

// D. DELETE /api/admin/medicines/categories/:id - Delete Category
router.delete('/categories/:id', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM medicine_categories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }
    res.json({ success: true, message: 'Category deleted successfully!' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ success: false, error: 'Failed to delete category.' });
  }
});

// E. GET /api/admin/medicines/settings - Get settings
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pharmacy_settings WHERE id = 1');
    if (result.rows.length === 0) {
      return res.json({ success: true, data: { default_reorder_level: 10, expiry_alert_threshold: 30 } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch settings.' });
  }
});

// F. PUT /api/admin/medicines/settings - Save settings (Hospital Admin only)
router.put('/settings', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { default_reorder_level, expiry_alert_threshold } = req.body;
    const reorder = parseInt(default_reorder_level || 10, 10);
    const alertDays = parseInt(expiry_alert_threshold || 30, 10);

    const result = await pool.query(
      `INSERT INTO pharmacy_settings (id, default_reorder_level, expiry_alert_threshold)
       VALUES (1, $1, $2)
       ON CONFLICT (id) DO UPDATE 
       SET default_reorder_level = EXCLUDED.default_reorder_level,
           expiry_alert_threshold = EXCLUDED.expiry_alert_threshold
       RETURNING *`,
      [reorder, alertDays]
    );

    res.json({ success: true, message: 'Pharmacy settings updated successfully!', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ success: false, error: 'Failed to update pharmacy settings.' });
  }
});

// G. GET /api/admin/medicines/alerts - Low Stock & Batch Expiry Warnings
router.get('/alerts', async (req, res) => {
  try {
    // 1. Get settings for alert days
    const setRes = await pool.query('SELECT expiry_alert_threshold FROM pharmacy_settings WHERE id = 1');
    const alertDays = setRes.rows.length > 0 ? parseInt(setRes.rows[0].expiry_alert_threshold, 10) : 30;

    const alerts = [];

    // 2. Fetch Low Stock medicines
    const lowStockRes = await pool.query(
      `SELECT name, current_stock, reorder_level FROM medicines 
       WHERE current_stock < reorder_level AND status = 'ACTIVE'
       ORDER BY current_stock ASC`
    );
    lowStockRes.rows.forEach((m, idx) => {
      alerts.push({
        id: `low-${idx}`,
        type: 'warning',
        text: `Medicine "${m.name}" is low in stock (${m.current_stock} remaining, limit is ${m.reorder_level})`,
        time: 'Just now'
      });
    });

    // 3. Fetch Expiring medicines
    const expiringRes = await pool.query(
      `SELECT name, expiry_date FROM medicines 
       WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '1 day' * $1 AND status = 'ACTIVE'
       ORDER BY expiry_date ASC`,
      [alertDays]
    );
    expiringRes.rows.forEach((m, idx) => {
      const isExpired = new Date(m.expiry_date) <= new Date();
      alerts.push({
        id: `exp-${idx}`,
        type: 'error',
        text: isExpired 
          ? `⚠️ Medicine "${m.name}" batch EXPIRED on ${new Date(m.expiry_date).toLocaleDateString()}`
          : `⚠️ Medicine "${m.name}" batch expires soon on ${new Date(m.expiry_date).toLocaleDateString()}`,
        time: 'Expiry Alert'
      });
    });

    res.json({ success: true, data: alerts });
  } catch (err) {
    console.error('Error generating alerts:', err);
    res.status(500).json({ success: false, error: 'Failed to generate alerts.' });
  }
});

// H. GET /api/admin/medicines/dashboard-stats - Pharmacy KPI Overview Metrics
router.get('/dashboard-stats', async (req, res) => {
  try {
    // 1. Total active medicines count
    const totalMedRes = await pool.query("SELECT COUNT(*) FROM medicines WHERE status = 'ACTIVE'");
    const totalMedicines = parseInt(totalMedRes.rows[0].count, 10);

    // 2. Total categories count
    const totalCatRes = await pool.query('SELECT COUNT(*) FROM medicine_categories');
    const totalCategories = parseInt(totalCatRes.rows[0].count, 10);

    // 3. Total stock (sum of currentStock)
    const totalStockRes = await pool.query("SELECT COALESCE(SUM(current_stock), 0) FROM medicines WHERE status = 'ACTIVE'");
    const totalStock = parseInt(totalStockRes.rows[0].coalesce, 10);

    // 4. Low Stock count
    const lowStockRes = await pool.query("SELECT COUNT(*) FROM medicines WHERE current_stock < reorder_level AND status = 'ACTIVE'");
    const lowStockCount = parseInt(lowStockRes.rows[0].count, 10);

    // 5. Out of stock count
    const outOfStockRes = await pool.query("SELECT COUNT(*) FROM medicines WHERE current_stock = 0 AND status = 'ACTIVE'");
    const outOfStockCount = parseInt(outOfStockRes.rows[0].count, 10);

    // 6. Expiring count (within settings threshold, e.g. 30 days)
    const setRes = await pool.query('SELECT expiry_alert_threshold FROM pharmacy_settings WHERE id = 1');
    const alertDays = setRes.rows.length > 0 ? parseInt(setRes.rows[0].expiry_alert_threshold, 10) : 30;

    const expiringRes = await pool.query(
      `SELECT COUNT(*) FROM medicines 
       WHERE expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '1 day' * $1 AND status = 'ACTIVE'`,
      [alertDays]
    );
    const expiringCount = parseInt(expiringRes.rows[0].count, 10);

    // 7. Today's sales
    const salesRes = await pool.query(
      `SELECT COALESCE(SUM(bi.amount * bi.quantity), 0.00) as sales
       FROM bill_items bi
       JOIN bills b ON bi.bill_id = b.id
       WHERE b.status = 'PAID' 
         AND b.created_at::date = CURRENT_DATE 
         AND bi.category = 'PHARMACY'
         AND bi.is_confirmed = TRUE`
    );
    const todaySales = parseFloat(salesRes.rows[0].sales);

    // 8. Monthly Revenue (PHARMACY category, current month)
    const monthlyRes = await pool.query(
      `SELECT COALESCE(SUM(bi.amount * bi.quantity), 0.00) as revenue
       FROM bill_items bi
       JOIN bills b ON bi.bill_id = b.id
       WHERE b.status = 'PAID' 
         AND date_trunc('month', b.created_at) = date_trunc('month', CURRENT_DATE)
         AND bi.category = 'PHARMACY'
         AND bi.is_confirmed = TRUE`
    );
    const monthlyRevenue = parseFloat(monthlyRes.rows[0].revenue);

    // 9. Pending Prescriptions count
    const pendingRxRes = await pool.query(
      `SELECT COUNT(DISTINCT pm.prescription_id) 
       FROM prescription_medicines pm
       WHERE pm.dispensed_status = 'PENDING'`
    );
    const pendingPrescriptions = parseInt(pendingRxRes.rows[0].count, 10);

    res.json({
      success: true,
      stats: {
        totalMedicines,
        totalCategories,
        totalStock,
        lowStockCount,
        outOfStockCount,
        expiringCount,
        todaySales,
        monthlyRevenue,
        pendingPrescriptions
      }
    });
  } catch (err) {
    console.error('Error generating dashboard stats:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats.' });
  }
});

export default router;
