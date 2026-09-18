import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { generateDischargeSummaryPdf } from '../services/ipdPdfService.js';
import { findOrCreatePatient } from '../services/patientService.js';

const router = express.Router();
router.use(authenticate);

// ---------------------------------------------------------
// WARD MANAGEMENT
// ---------------------------------------------------------
router.get('/wards', authorize('HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'), async (req, res) => {
  try {
    const query = `
      SELECT w.*, 
             (SELECT COUNT(*) FROM beds WHERE ward_id = w.id AND status = 'AVAILABLE') as available_beds,
             (SELECT COUNT(*) FROM beds WHERE ward_id = w.id AND status = 'OCCUPIED') as occupied_beds
      FROM wards w
      ORDER BY w.name;
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/wards', authorize('HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { name, room_type, daily_rate, total_beds } = req.body;
    const result = await pool.query(
      'INSERT INTO wards (name, room_type, daily_rate, total_beds) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, room_type, daily_rate, total_beds || 0]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/wards/:id', authorize('HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { name, room_type, daily_rate, total_beds } = req.body;
    const result = await pool.query(
      'UPDATE wards SET name = $1, room_type = $2, daily_rate = $3, total_beds = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [name, room_type, daily_rate, total_beds, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/wards/:id', authorize('HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const checkBeds = await pool.query("SELECT COUNT(*) FROM beds WHERE ward_id = $1 AND status = 'OCCUPIED'", [req.params.id]);
    if (parseInt(checkBeds.rows[0].count) > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete ward with occupied beds' });
    }
    await pool.query('DELETE FROM wards WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ---------------------------------------------------------
// BED MANAGEMENT
// ---------------------------------------------------------
router.get('/beds', authorize('HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'), async (req, res) => {
  try {
    const { wardId, status } = req.query;
    let query = `
      SELECT b.*, w.name as ward_name, w.room_type 
      FROM beds b 
      JOIN wards w ON b.ward_id = w.id 
      WHERE 1=1
    `;
    const values = [];
    if (wardId) {
      values.push(wardId);
      query += ` AND b.ward_id = $${values.length}`;
    }
    if (status) {
      values.push(status);
      query += ` AND b.status = $${values.length}`;
    }
    query += ' ORDER BY b.bed_number';
    
    const result = await pool.query(query, values);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/beds', authorize('HOSPITAL_ADMIN'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { ward_id, bed_number } = req.body;
    
    const bedResult = await client.query(
      'INSERT INTO beds (ward_id, bed_number, status) VALUES ($1, $2, $3) RETURNING *',
      [ward_id, bed_number, 'AVAILABLE']
    );
    
    await client.query('UPDATE wards SET total_beds = total_beds + 1 WHERE id = $1', [ward_id]);
    
    await client.query('COMMIT');
    res.json({ success: true, data: bedResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

router.put('/beds/:id', authorize('HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { bed_number, status } = req.body;
    const result = await pool.query(
      'UPDATE beds SET bed_number = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [bed_number, status, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/beds/:id', authorize('HOSPITAL_ADMIN'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const bedInfo = await client.query('SELECT * FROM beds WHERE id = $1', [req.params.id]);
    if (bedInfo.rows.length === 0) throw new Error('Bed not found');
    if (bedInfo.rows[0].status === 'OCCUPIED') throw new Error('Cannot delete occupied bed');
    
    await client.query('DELETE FROM beds WHERE id = $1', [req.params.id]);
    await client.query('UPDATE wards SET total_beds = total_beds - 1 WHERE id = $1', [bedInfo.rows[0].ward_id]);
    
    await client.query('COMMIT');
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});


// ---------------------------------------------------------
// ADMISSIONS
// ---------------------------------------------------------
router.get('/admissions', authorize('HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'), async (req, res) => {
  try {
    const { status, wardId, search } = req.query;
    let query = `
      SELECT a.*, p.name as patient_name, p.uhid, p.mobile, d.name as doctor_name, 
             b.bed_number, w.name as ward_name, w.id as ward_id
      FROM admissions a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN beds b ON a.bed_id = b.id
      JOIN wards w ON b.ward_id = w.id
      WHERE 1=1
    `;
    const values = [];
    
    if (req.user.role === 'DOCTOR') {
      const docRes = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.userId]);
      if (docRes.rows.length > 0) {
        values.push(docRes.rows[0].id);
        query += ` AND a.doctor_id = $${values.length}`;
      }
    }
    
    if (status) {
      values.push(status);
      query += ` AND a.status = $${values.length}`;
    }
    if (wardId) {
      values.push(wardId);
      query += ` AND w.id = $${values.length}`;
    }
    if (search) {
      values.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${values.length} OR p.uhid ILIKE $${values.length} OR p.mobile ILIKE $${values.length})`;
    }
    
    query += ' ORDER BY a.admission_date DESC';
    
    const result = await pool.query(query, values);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/admissions/:id', authorize('HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'), async (req, res) => {
  try {
    const query = `
      SELECT a.*, p.name as patient_name, p.uhid, p.age, p.gender, p.mobile,
             d.name as doctor_name, d.specialty,
             b.bed_number, w.name as ward_name, w.daily_rate,
             bill.bill_number, bill.total_amount
      FROM admissions a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN beds b ON a.bed_id = b.id
      JOIN wards w ON b.ward_id = w.id
      LEFT JOIN bills bill ON a.bill_id = bill.id
      WHERE a.id = $1
    `;
    const result = await pool.query(query, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    
    const notesRes = await pool.query('SELECT * FROM nursing_notes WHERE admission_id = $1 ORDER BY recorded_at DESC', [req.params.id]);
    result.rows[0].nursing_notes = notesRes.rows;
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/admissions/patient/:patientId', authorize('HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, d.name as doctor_name, b.bed_number, w.name as ward_name
      FROM admissions a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN beds b ON a.bed_id = b.id
      JOIN wards w ON b.ward_id = w.id
      WHERE a.patient_id = $1
      ORDER BY a.admission_date DESC
    `, [req.params.patientId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admissions', authorize('HOSPITAL_ADMIN', 'RECEPTIONIST'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { patient_id, doctor_id, bed_id, admission_reason, expected_discharge_date, name, mobile } = req.body;
    
    let finalPatientId = patient_id;
    if (!finalPatientId || finalPatientId === '') {
      // Find or create patient inline using the existing helper
      const patient = await findOrCreatePatient('GJS-HOSP-01', { name, mobile });
      finalPatientId = patient.id;
    }

    // 1. Verify bed is available & 2. Get ward info
    const bedRes = await client.query(`
      SELECT b.*, w.daily_rate, w.name as ward_name 
      FROM beds b JOIN wards w ON b.ward_id = w.id 
      WHERE b.id = $1 FOR UPDATE
    `, [bed_id]);
    if (bedRes.rows.length === 0 || bedRes.rows[0].status !== 'AVAILABLE') {
      throw new Error('Bed is not available');
    }
    const wardName = bedRes.rows[0].ward_name;
    const dailyRate = bedRes.rows[0].daily_rate;
    
    // 3. Create admission
    const admRes = await client.query(`
      INSERT INTO admissions (patient_id, doctor_id, bed_id, admission_reason, expected_discharge_date, status)
      VALUES ($1, $2, $3, $4, $5, 'ADMITTED') RETURNING *
    `, [finalPatientId, doctor_id, bed_id, admission_reason, expected_discharge_date]);
    const admissionId = admRes.rows[0].id;
    
    // 4. Update bed status
    await client.query("UPDATE beds SET status = 'OCCUPIED' WHERE id = $1", [bed_id]);
    
    // 5. Create a new bill
    const billNum = 'INV-GJS-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
    const billRes = await client.query(`
      INSERT INTO bills (hospital_id, patient_id, bill_number, total_amount, paid_amount, status, admission_id)
      VALUES ('GJS-HOSP-01', $1, $2, 0.00, 0.00, 'PENDING', $3) RETURNING id
    `, [finalPatientId, billNum, admissionId]);
    const billId = billRes.rows[0].id;
    
    // 6. Add first ROOM_CHARGE
    await client.query(`
      INSERT INTO bill_items (bill_id, category, description, amount, quantity, is_confirmed)
      VALUES ($1, 'ROOM_CHARGE', $2, $3, 1, true)
    `, [billId, 'Room Charge - ' + wardName + ' (Day 1)', dailyRate]);
    
    // 7. Update bill total
    await client.query(`
      UPDATE bills SET total_amount = (SELECT COALESCE(SUM(amount * quantity), 0) FROM bill_items WHERE bill_id = $1 AND is_confirmed = true)
      WHERE id = $1
    `, [billId]);
    
    // 8. Update admission bill_id
    await client.query('UPDATE admissions SET bill_id = $1 WHERE id = $2', [billId, admissionId]);
    
    await client.query('COMMIT');
    res.json({ success: true, data: { ...admRes.rows[0], bill_id: billId } });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------
// NURSING NOTES
// ---------------------------------------------------------
router.get('/admissions/:id/notes', authorize('HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM nursing_notes WHERE admission_id = $1 ORDER BY recorded_at DESC', [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admissions/:id/notes', authorize('HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'), async (req, res) => {
  try {
    const { note_type, vitals, note } = req.body;
    if (req.user.role === 'DOCTOR' && note_type !== 'DOCTOR_ROUND') {
      return res.status(403).json({ success: false, error: 'Doctors can only add DOCTOR_ROUND notes' });
    }
    const result = await pool.query(`
      INSERT INTO nursing_notes (admission_id, recorded_by, note_type, vitals, note)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [req.params.id, req.user.userId, note_type, vitals, note]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------
// DISCHARGE
// ---------------------------------------------------------
router.post('/admissions/:id/discharge', authorize('HOSPITAL_ADMIN', 'DOCTOR'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { diagnosis, treatment_summary, discharge_instructions, follow_up_date, discharged_by_doctor_id } = req.body;
    
    // 1. Verify admission status
    const admRes = await client.query(`
      SELECT a.*, p.name as patient_name, p.uhid, p.age, p.gender, p.mobile,
             d.name as doctor_name, d.specialty, b.bed_number, w.name as ward_name
      FROM admissions a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN beds b ON a.bed_id = b.id
      JOIN wards w ON b.ward_id = w.id
      WHERE a.id = $1
    `, [req.params.id]);
    if (admRes.rows.length === 0 || admRes.rows[0].status !== 'ADMITTED') {
      throw new Error('Valid active admission not found');
    }
    const admission = admRes.rows[0];
    
    // 2. Create discharge summary
    const summaryRes = await client.query(`
      INSERT INTO discharge_summaries (admission_id, diagnosis, treatment_summary, discharge_instructions, follow_up_date, discharged_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [req.params.id, diagnosis, treatment_summary, discharge_instructions, follow_up_date, discharged_by_doctor_id || admission.doctor_id]);
    const dischargeSummary = summaryRes.rows[0];
    
    // 3. Update admission status & 4. Release bed
    await client.query("UPDATE admissions SET status = 'DISCHARGED', actual_discharge_date = NOW() WHERE id = $1", [req.params.id]);
    await client.query("UPDATE beds SET status = 'AVAILABLE' WHERE id = $1", [admission.bed_id]);
    
    // 5. Generate PDF
    const patient = { name: admission.patient_name, uhid: admission.uhid, age: admission.age, gender: admission.gender, mobile: admission.mobile };
    const doctor = { name: admission.doctor_name, specialty: admission.specialty };
    const pdfUrl = await generateDischargeSummaryPdf(admission, dischargeSummary, patient, doctor, admission.ward_name);
    
    await client.query("UPDATE discharge_summaries SET pdf_url = $1 WHERE id = $2", [pdfUrl, dischargeSummary.id]);
    dischargeSummary.pdf_url = pdfUrl;
    
    await client.query('COMMIT');
    res.json({ success: true, data: dischargeSummary });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});


// ---------------------------------------------------------
// DAILY CHARGES (Manual Trigger)
// ---------------------------------------------------------
router.post('/daily-charges', authorize('HOSPITAL_ADMIN'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resAdmissions = await client.query(`
      SELECT a.id as admission_id, a.bill_id, a.admission_date, w.daily_rate, w.name as ward_name
      FROM admissions a
      JOIN beds b ON a.bed_id = b.id
      JOIN wards w ON b.ward_id = w.id
      WHERE a.status = 'ADMITTED'
    `);
    
    for (const adm of resAdmissions.rows) {
      const today = new Date();
      const admDate = new Date(adm.admission_date);
      const diffTime = Math.abs(today - admDate);
      const dayNum = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to make day 1 on first cron run
      
      await client.query(`
        INSERT INTO bill_items (bill_id, category, description, amount, quantity, is_confirmed)
        VALUES ($1, 'ROOM_CHARGE', $2, $3, 1, true)
      `, [adm.bill_id, 'Room Charge - ' + adm.ward_name + ' (Day ' + dayNum + ')', adm.daily_rate]);
      
      await client.query(`
        UPDATE bills
        SET total_amount = (SELECT COALESCE(SUM(amount * quantity), 0) FROM bill_items WHERE bill_id = $1 AND is_confirmed = true)
        WHERE id = $1
      `, [adm.bill_id]);
    }
    
    await client.query('COMMIT');
    res.json({ success: true, count: resAdmissions.rowCount });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------
// IPD CONSOLIDATED BILLING
// ---------------------------------------------------------
router.get('/admissions/:id/bill', authorize('HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'), async (req, res) => {
  try {
    const billRes = await pool.query('SELECT * FROM bills WHERE admission_id = $1', [req.params.id]);
    if (billRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bill not found for this admission' });
    }
    const bill = billRes.rows[0];
    const itemsRes = await pool.query('SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY id ASC', [bill.id]);
    res.json({ success: true, bill, items: itemsRes.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admissions/:id/bill-items', authorize('HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { category, description, amount, quantity } = req.body;
    const billRes = await client.query('SELECT id FROM bills WHERE admission_id = $1', [req.params.id]);
    if (billRes.rows.length === 0) {
      throw new Error('Bill not found');
    }
    const billId = billRes.rows[0].id;
    const qtyInt = parseInt(quantity || 1, 10);
    const amtFloat = parseFloat(amount);

    // Check if the same item category and description already exists on the SAME calendar date for this bill
    const existingRes = await client.query(`
      SELECT id, quantity, amount FROM bill_items 
      WHERE bill_id = $1 
        AND category = $2 
        AND description = $3 
        AND DATE(created_at) = CURRENT_DATE
    `, [billId, category.toUpperCase(), description]);

    if (existingRes.rows.length > 0) {
      // Merging: update existing row's quantity and ensure rate matches
      const existingItem = existingRes.rows[0];
      await client.query(`
        UPDATE bill_items 
        SET quantity = quantity + $1, amount = $2
        WHERE id = $3
      `, [qtyInt, amtFloat, existingItem.id]);
    } else {
      // Storing separate row for new day or different medicine/service
      await client.query(`
        INSERT INTO bill_items (bill_id, category, description, amount, quantity, is_confirmed)
        VALUES ($1, $2, $3, $4, $5, true)
      `, [billId, category.toUpperCase(), description, amtFloat, qtyInt]);
    }

    await client.query(`
      UPDATE bills 
      SET total_amount = (SELECT COALESCE(SUM(amount * quantity), 0) FROM bill_items WHERE bill_id = $1 AND is_confirmed = true)
      WHERE id = $1
    `, [billId]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 1. DELETE /api/admin/ipd/admissions/:id/bill-items/:itemId - Remove IPD bill item
router.delete('/admissions/:id/bill-items/:itemId', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id, itemId } = req.params;

    // Verify bill exists
    const billRes = await client.query('SELECT id FROM bills WHERE admission_id = $1', [id]);
    if (billRes.rows.length === 0) {
      throw new Error('Bill not found');
    }
    const billId = billRes.rows[0].id;

    // Delete item
    await client.query('DELETE FROM bill_items WHERE id = $1 AND bill_id = $2', [itemId, billId]);

    // Recalculate bill total
    await client.query(`
      UPDATE bills 
      SET total_amount = (SELECT COALESCE(SUM(amount * quantity), 0) FROM bill_items WHERE bill_id = $1 AND is_confirmed = true)
      WHERE id = $1
    `, [billId]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Line item deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 2. PUT /api/admin/ipd/admissions/:id/bill-items/:itemId - Edit IPD bill item details (description, amount, quantity)
router.put('/admissions/:id/bill-items/:itemId', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id, itemId } = req.params;
    const { description, amount, quantity } = req.body;

    // Verify bill exists
    const billRes = await client.query('SELECT id FROM bills WHERE admission_id = $1', [id]);
    if (billRes.rows.length === 0) {
      throw new Error('Bill not found');
    }
    const billId = billRes.rows[0].id;

    const qtyInt = parseInt(quantity, 10);
    const amtFloat = parseFloat(amount);

    await client.query(`
      UPDATE bill_items 
      SET description = $1, amount = $2, quantity = $3
      WHERE id = $4 AND bill_id = $5
    `, [description, amtFloat, qtyInt, itemId, billId]);

    // Recalculate bill total
    await client.query(`
      UPDATE bills 
      SET total_amount = (SELECT COALESCE(SUM(amount * quantity), 0) FROM bill_items WHERE bill_id = $1 AND is_confirmed = true)
      WHERE id = $1
    `, [billId]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Line item updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

export default router;
