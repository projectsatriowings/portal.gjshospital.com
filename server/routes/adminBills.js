import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { generateInvoicePdf } from '../services/pdfService.js';

const router = express.Router();

// Restrict access to SUPER_ADMIN, HOSPITAL_ADMIN, ACCOUNTANT, RECEPTIONIST, and PHARMACIST.
// Doctors are STRICTLY DENIED access to billing routes.
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'PHARMACIST'));

// Allow administrators and receptionists to manage billing
function denyAdminBilling(req, res, next) {
  next();
}

// Helper to calculate total & update bill status
async function recalculateBill(client, billId) {
  const itemsRes = await client.query(`SELECT * FROM bill_items WHERE bill_id = $1`, [billId]);
  const items = itemsRes.rows;
  
  // Only sum items that are confirmed (is_confirmed is true)
  const confirmedItems = items.filter(item => item.is_confirmed !== false);
  const total = confirmedItems.reduce((sum, item) => sum + (parseFloat(item.amount) * parseInt(item.quantity || 1)), 0);

  const billRes = await client.query(`SELECT paid_amount, appointment_id FROM bills WHERE id = $1`, [billId]);
  const paid = parseFloat(billRes.rows[0]?.paid_amount || 0);
  const appointmentId = billRes.rows[0]?.appointment_id;

  let status = 'PENDING';
  if (paid >= total && total > 0) {
    status = 'PAID';
  } else if (paid > 0) {
    status = 'PARTIALLY_PAID';
  }

  const updateRes = await client.query(
    `UPDATE bills SET total_amount = $1, status = $2 WHERE id = $3 RETURNING *`,
    [total, status, billId]
  );

  const updatedBill = updateRes.rows[0];

  // Fetch Buy Outside medicines if any
  let buyOutsideMeds = [];
  if (appointmentId) {
    const rxRes = await client.query(`SELECT id FROM prescriptions WHERE appointment_id = $1`, [appointmentId]);
    if (rxRes.rows.length > 0) {
      const boRes = await client.query(
        `SELECT name, dosage, duration, dispensed_note FROM prescription_medicines WHERE prescription_id = $1 AND dispensed_status = 'NOT_DISPENSED'`,
        [rxRes.rows[0].id]
      );
      buyOutsideMeds = boRes.rows;
    }
  }

  const patientRes = await client.query(`SELECT name, mobile, uhid FROM patients WHERE id = $1`, [updatedBill.patient_id]);
  const pdfUrl = await generateInvoicePdf(updatedBill, confirmedItems, patientRes.rows[0] || {}, buyOutsideMeds);

  await client.query(`UPDATE bills SET pdf_url = $1 WHERE id = $2`, [pdfUrl, billId]);
  return { ...updatedBill, pdf_url: pdfUrl, items };
}

// 1. GET /api/admin/bills - List & Filter Bills
router.get('/', async (req, res) => {
  try {
    const { status, patientId, query, startDate, endDate } = req.query;

    let sql = `
      SELECT b.*, p.name as patient_name, p.mobile, p.uhid as patient_uhid
      FROM bills b
      LEFT JOIN patients p ON b.patient_id = p.id
      LEFT JOIN admissions adm ON adm.bill_id = b.id
      WHERE 1=1 AND (adm.id IS NULL OR adm.status != 'ADMITTED')
    `;
    const params = [];

    if (status && status !== 'all') {
      params.push(status.toUpperCase());
      sql += ` AND UPPER(b.status) = $${params.length}`;
    }

    if (patientId) {
      params.push(parseInt(patientId, 10));
      sql += ` AND b.patient_id = $${params.length}`;
    }

    if (query) {
      params.push(`%${query.trim()}%`);
      const idx = params.length;
      sql += ` AND (p.name ILIKE $${idx} OR p.mobile ILIKE $${idx} OR b.bill_number ILIKE $${idx})`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND b.created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND b.created_at <= $${params.length}`;
    }

    sql += ` ORDER BY b.created_at DESC`;

    const result = await pool.query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Error fetching bills:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch bills list' });
  }
});

// 2a. GET /api/admin/bills/active-visit/:patientId — Find today's open bill for a patient
// MUST be declared before /:id to avoid route conflict
router.get('/active-visit/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    // Find the most recent PENDING or PARTIALLY_PAID bill for this patient (today or all-time latest open)
    const result = await pool.query(
      `SELECT b.*, p.name as patient_name, p.mobile, p.uhid as patient_uhid
       FROM bills b
       LEFT JOIN patients p ON b.patient_id = p.id
       WHERE b.patient_id = $1 AND b.status IN ('PENDING', 'PARTIALLY_PAID')
       ORDER BY b.created_at DESC LIMIT 1`,
      [patientId]
    );

    // Fetch previous paid bills
    const prevRes = await pool.query(
      `SELECT b.*, p.name as patient_name, p.mobile, p.uhid as patient_uhid
       FROM bills b
       LEFT JOIN patients p ON b.patient_id = p.id
       WHERE b.patient_id = $1 AND b.status = 'PAID'
       ORDER BY b.created_at DESC`,
      [patientId]
    );

    let activeBill = null;
    if (result.rows.length > 0) {
      const bill = result.rows[0];
      const itemsRes = await pool.query(`SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY id ASC`, [bill.id]);
      
      let items = itemsRes.rows;
      // Pharmacists and Admins see all items (including unconfirmed drafts)
      // Receptionists and Accountants only see confirmed items
      if (req.user.role !== 'PHARMACIST' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'HOSPITAL_ADMIN') {
        items = items.filter(item => item.is_confirmed === true);
      }
      activeBill = { ...bill, items };
    }

    res.json({
      success: true,
      activeBill,
      previousBills: prevRes.rows
    });
  } catch (err) {
    console.error('Error fetching active visit bill:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch active visit bill.' });
  }
});

// 2b. POST /api/admin/bills/create-standalone — alias for /standalone (used by PharmacyDispensing)
router.post('/create-standalone', denyAdminBilling, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { patient_id, appointment_id, force_new } = req.body;

    if (!patient_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Patient ID is required.' });
    }

    // Return existing open bill unless force_new
    if (!force_new) {
      const exist = await client.query(
        `SELECT * FROM bills WHERE patient_id = $1 AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1`,
        [patient_id]
      );
      if (exist.rows.length > 0) {
        const items = await client.query(`SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY id ASC`, [exist.rows[0].id]);
        await client.query('COMMIT');
        return res.json({ success: true, message: 'Existing open bill found.', data: { ...exist.rows[0], items: items.rows } });
      }
    }

    // Generate Bill Number
    const countRes = await client.query(`SELECT COUNT(*) FROM bills`);
    const nextSeq = parseInt(countRes.rows[0].count, 10) + 1;
    const year = new Date().getFullYear();
    const billNumber = `INV-GJS-${year}-${String(nextSeq).padStart(6, '0')}`;

    const billRes = await client.query(
      `INSERT INTO bills (hospital_id, patient_id, appointment_id, bill_number, status, total_amount, paid_amount)
       VALUES ('GJS-HOSP-01', $1, $2, $3, 'PENDING', 0.00, 0.00)
       RETURNING *`,
      [patient_id, appointment_id || null, billNumber]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Pharmacy bill created successfully.', data: billRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating standalone bill:', err);
    res.status(500).json({ success: false, error: 'Failed to create pharmacy bill.' });
  } finally {
    client.release();
  }
});

// 2. GET /api/admin/bills/:id - Full Itemized Detail View
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const billRes = await pool.query(
      `SELECT b.*, p.name as patient_name, p.mobile, p.email, p.uhid as patient_uhid, a.preferred_date, a.doctor_name
       FROM bills b
       LEFT JOIN patients p ON b.patient_id = p.id
       LEFT JOIN appointments a ON b.appointment_id = a.id
       WHERE b.id = $1`,
      [id]
    );

    if (billRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    const bill = billRes.rows[0];
    const itemsRes = await pool.query(`SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY id ASC`, [id]);

    let items = itemsRes.rows;
    if (req.user.role !== 'PHARMACIST' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'HOSPITAL_ADMIN') {
      items = items.filter(item => item.is_confirmed === true);
    }

    res.json({
      success: true,
      data: {
        ...bill,
        items
      }
    });
  } catch (err) {
    console.error('Error fetching bill detail:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch bill detail' });
  }
});

// 2b. POST /api/admin/bills/standalone - Create Standalone Bill for Patient Walk-in (without appointment)
router.post('/standalone', denyAdminBilling, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { patient_id, force_new } = req.body;

    if (!patient_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Patient ID is required.' });
    }

    // Check if open bill already exists for today unless force_new is true
    if (!force_new) {
      const exist = await client.query(
        `SELECT * FROM bills WHERE patient_id = $1 AND status = 'PENDING' AND DATE(created_at) = CURRENT_DATE ORDER BY created_at DESC LIMIT 1`,
        [patient_id]
      );

      if (exist.rows.length > 0) {
        await client.query('COMMIT');
        return res.json({ success: true, message: 'Active open bill found.', data: exist.rows[0] });
      }
    }

    // Generate Bill Number
    const countRes = await client.query(`SELECT COUNT(*) FROM bills`);
    const nextSeq = parseInt(countRes.rows[0].count, 10) + 1;
    const year = new Date().getFullYear();
    const billNumber = `INV-GJS-${year}-${String(nextSeq).padStart(6, '0')}`;

    const billRes = await client.query(
      `INSERT INTO bills (hospital_id, patient_id, appointment_id, bill_number, status, total_amount, paid_amount)
       VALUES ('GJS-HOSP-01', $1, NULL, $2, 'PENDING', 0.00, 0.00)
       RETURNING *`,
      [patient_id, billNumber]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Standalone bill created successfully.', data: billRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating standalone bill:', err);
    res.status(500).json({ success: false, error: 'Failed to create standalone bill.' });
  } finally {
    client.release();
  }
});

// 3. POST /api/admin/bills/:id/items - Add Manual Line Item (Lab/Pharmacy/Other)
router.post('/:id/items', denyAdminBilling, async (req, res) => {
  const { id } = req.params;
  const { category, description, amount, quantity } = req.body;

  if (!category || !description || amount === undefined) {
    return res.status(400).json({ success: false, error: 'Category, description, and amount are required' });
  }

  // PHARMACIST Role Guardrail: Can only add PHARMACY category items
  if (req.user.role === 'PHARMACIST' && category.toUpperCase() !== 'PHARMACY') {
    return res.status(403).json({ success: false, error: 'Pharmacists can only add PHARMACY category items.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Reject additions to PAID bills
    const billCheck = await client.query(`SELECT status FROM bills WHERE id = $1`, [id]);
    if (billCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    if (billCheck.rows[0].status === 'PAID') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'This bill is already PAID. Please create a new standalone bill for additional purchases.' });
    }

    const isPharmacy = category.toUpperCase() === 'PHARMACY';
    await client.query(
      `INSERT INTO bill_items (bill_id, category, description, amount, quantity, is_confirmed)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, category.toUpperCase(), description, parseFloat(amount), parseInt(quantity || 1, 10), !isPharmacy]
    );

    const updated = await recalculateBill(client, id);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Line item added successfully', data: updated });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding bill item:', err);
    res.status(500).json({ success: false, error: 'Failed to add line item' });
  } finally {
    client.release();
  }
});

// 3b. POST /api/admin/bills/:id/import-prescription - Auto-Import Prescribed Medicines into Bill
router.post('/:id/import-prescription', denyAdminBilling, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const billRes = await client.query(`SELECT * FROM bills WHERE id = $1`, [id]);
    if (billRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    const bill = billRes.rows[0];
    if (!bill.appointment_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No appointment linked to this bill.' });
    }

    // Find prescription for this appointment
    const prescRes = await client.query(`SELECT * FROM prescriptions WHERE appointment_id = $1`, [bill.appointment_id]);
    if (prescRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'No prescription found for this appointment.' });
    }

    const prescription = prescRes.rows[0];
    const medRes = await client.query(`SELECT * FROM prescription_medicines WHERE prescription_id = $1`, [prescription.id]);
    
    if (medRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Prescription has no medicines listed.' });
    }

    let addedCount = 0;
    for (let med of medRes.rows) {
      const desc = `Pharmacy: ${med.name} (${med.dosage || 'Standard'} - ${med.duration || '5 days'})`;
      // Check if already added
      const exist = await client.query(
        `SELECT id FROM bill_items WHERE bill_id = $1 AND description = $2`,
        [id, desc]
      );
      if (exist.rows.length === 0) {
        await client.query(
          `INSERT INTO bill_items (bill_id, category, description, amount, quantity)
           VALUES ($1, 'PHARMACY', $2, 60.00, 1)`,
          [id, desc]
        );
        addedCount++;
      }
    }

    const updated = await recalculateBill(client, id);
    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully imported ${addedCount} prescribed medicines into bill!`,
      data: updated
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error importing prescription to bill:', err);
    res.status(500).json({ success: false, error: 'Failed to import prescription medicines.' });
  } finally {
    client.release();
  }
});


// 3c. PUT /api/admin/bills/:id/items/:itemId - Update Line Item Quantity
router.put('/:id/items/:itemId', denyAdminBilling, async (req, res) => {
  const { id, itemId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || parseInt(quantity, 10) <= 0) {
    return res.status(400).json({ success: false, error: 'Valid quantity is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch the item to check category & role constraint
    const itemCheck = await client.query(`SELECT category FROM bill_items WHERE id = $1 AND bill_id = $2`, [itemId, id]);
    if (itemCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Line item not found' });
    }

    if (req.user.role === 'PHARMACIST' && itemCheck.rows[0].category !== 'PHARMACY') {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Pharmacists can only modify PHARMACY category items.' });
    }

    await client.query(
      `UPDATE bill_items SET quantity = $1 WHERE id = $2 AND bill_id = $3`,
      [parseInt(quantity, 10), itemId, id]
    );

    const updated = await recalculateBill(client, id);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Line item quantity updated successfully', data: updated });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating bill item quantity:', err);
    res.status(500).json({ success: false, error: 'Failed to update line item quantity' });
  } finally {
    client.release();
  }
});

// 4. DELETE /api/admin/bills/:id/items/:itemId - Remove Line Item
router.delete('/:id/items/:itemId', denyAdminBilling, async (req, res) => {
  const { id, itemId } = req.params;

  if (req.user.role === 'PHARMACIST') {
    const itemCheck = await pool.query(`SELECT category FROM bill_items WHERE id = $1 AND bill_id = $2`, [itemId, id]);
    if (itemCheck.rows.length > 0 && itemCheck.rows[0].category !== 'PHARMACY') {
      return res.status(403).json({ success: false, error: 'Pharmacists can only delete PHARMACY category items.' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`DELETE FROM bill_items WHERE id = $1 AND bill_id = $2`, [itemId, id]);

    const updated = await recalculateBill(client, id);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Line item removed', data: updated });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting bill item:', err);
    res.status(500).json({ success: false, error: 'Failed to delete line item' });
  } finally {
    client.release();
  }
});

// 5. POST & PUT /api/admin/bills/:id/pay - Record Payment
const handleRecordPayment = async (req, res) => {
  const { id } = req.params;
  const amount = req.body.amount;
  const paymentMethod = req.body.payment_method || req.body.paymentMethod || 'CASH';

  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(`SELECT * FROM bills WHERE id = $1 FOR UPDATE`, [id]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    const bill = checkRes.rows[0];
    const newPaidAmount = parseFloat(bill.paid_amount || 0) + parseFloat(amount);
    const total = parseFloat(bill.total_amount || 0);

    let status = 'PENDING';
    if (newPaidAmount >= total && total > 0) {
      status = 'PAID';
    } else if (newPaidAmount > 0) {
      status = 'PARTIALLY_PAID';
    }

    const updateRes = await client.query(
      `UPDATE bills 
       SET paid_amount = $1, status = $2, payment_method = $3 
       WHERE id = $4 
       RETURNING *`,
      [newPaidAmount, status, paymentMethod, id]
    );

    const updatedBill = updateRes.rows[0];
    const itemsRes = await client.query(`SELECT * FROM bill_items WHERE bill_id = $1`, [id]);
    const patientRes = await client.query(`SELECT name, mobile, uhid FROM patients WHERE id = $1`, [updatedBill.patient_id]);

    // Fetch Buy Outside medicines if any
    let buyOutsideMeds = [];
    if (updatedBill.appointment_id) {
      const rxRes = await client.query(`SELECT id FROM prescriptions WHERE appointment_id = $1`, [updatedBill.appointment_id]);
      if (rxRes.rows.length > 0) {
        const boRes = await client.query(
          `SELECT name, dosage, duration, dispensed_note FROM prescription_medicines WHERE prescription_id = $1 AND dispensed_status = 'NOT_DISPENSED'`,
          [rxRes.rows[0].id]
        );
        buyOutsideMeds = boRes.rows;
      }
    }

    const pdfUrl = await generateInvoicePdf(updatedBill, itemsRes.rows, patientRes.rows[0] || {}, buyOutsideMeds);
    await client.query(`UPDATE bills SET pdf_url = $1 WHERE id = $2`, [pdfUrl, id]);

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Payment of ₹${parseFloat(amount).toFixed(2)} recorded successfully!`,
      data: { ...updatedBill, pdf_url: pdfUrl, items: itemsRes.rows }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error recording bill payment:', err);
    res.status(500).json({ success: false, error: 'Failed to record payment' });
  } finally {
    client.release();
  }
};

router.post('/:id/pay', handleRecordPayment);
router.put('/:id/pay', handleRecordPayment);

// 6. GET /api/admin/bills/:id/pdf - Return PDF Invoice Download Link
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const billRes = await pool.query(`SELECT * FROM bills WHERE id = $1`, [id]);
    if (billRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    const bill = billRes.rows[0];
    if (bill.pdf_url) {
      return res.json({ success: true, pdfUrl: bill.pdf_url });
    }

    const itemsRes = await pool.query(`SELECT * FROM bill_items WHERE bill_id = $1`, [id]);
    const patientRes = await pool.query(`SELECT name, mobile, uhid FROM patients WHERE id = $1`, [bill.patient_id]);

    // Fetch Buy Outside medicines if any
    let buyOutsideMeds = [];
    if (bill.appointment_id) {
      const rxRes = await pool.query(`SELECT id FROM prescriptions WHERE appointment_id = $1`, [bill.appointment_id]);
      if (rxRes.rows.length > 0) {
        const boRes = await pool.query(
          `SELECT name, dosage, duration, dispensed_note FROM prescription_medicines WHERE prescription_id = $1 AND dispensed_status = 'NOT_DISPENSED'`,
          [rxRes.rows[0].id]
        );
        buyOutsideMeds = boRes.rows;
      }
    }

    const pdfUrl = await generateInvoicePdf(bill, itemsRes.rows, patientRes.rows[0] || {}, buyOutsideMeds);

    await pool.query(`UPDATE bills SET pdf_url = $1 WHERE id = $2`, [pdfUrl, id]);
    res.json({ success: true, pdfUrl });
  } catch (err) {
    console.error('Error generating bill PDF:', err);
    res.status(500).json({ success: false, error: 'Failed to generate invoice PDF' });
  }
});

// 5b. POST /api/admin/bills/:id/confirm-pharmacy - Confirm Pharmacy Items & Push to Billing Center
router.post('/:id/confirm-pharmacy', denyAdminBilling, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify bill exists
    const billRes = await client.query(`SELECT status FROM bills WHERE id = $1`, [id]);
    if (billRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    if (billRes.rows[0].status === 'PAID') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'This bill is already PAID.' });
    }

    // 2. Set all PHARMACY items to is_confirmed = TRUE
    await client.query(
      `UPDATE bill_items SET is_confirmed = TRUE WHERE bill_id = $1 AND category = 'PHARMACY'`,
      [id]
    );

    // 3. Recalculate bill
    const updated = await recalculateBill(client, id);

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Pharmacy items confirmed and sent to billing center successfully!',
      data: updated
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error confirming pharmacy items:', err);
    res.status(500).json({ success: false, error: 'Failed to confirm pharmacy items.' });
  } finally {
    client.release();
  }
});

export default router;
