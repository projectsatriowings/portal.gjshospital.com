import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { pool } from '../config/db.js';

const router = express.Router();

// Helper middleware to resolve doctorId from logged in req.user.userId
const resolveDoctorId = async (req, res, next) => {
  try {
    const userRes = await pool.query(
      `SELECT id, name FROM doctors WHERE user_id = $1`,
      [req.user.userId]
    );

    if (userRes.rows.length > 0) {
      req.doctor = userRes.rows[0];
    } else if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'HOSPITAL_ADMIN') {
      const firstDoc = await pool.query(`SELECT id, name FROM doctors ORDER BY id ASC LIMIT 1`);
      req.doctor = firstDoc.rows[0] || { id: 1, name: 'Hospital Doctor' };
    } else {
      return res.status(403).json({
        success: false,
        error: 'No doctor profile is linked to your user account. Please contact administrator.'
      });
    }

    next();
  } catch (err) {
    console.error('Error resolving doctorId:', err);
    res.status(500).json({ success: false, error: 'Failed to resolve doctor account.' });
  }
};

// Apply authentication & authorization to doctor dashboard routes
router.use(authenticate);
router.use(authorize('DOCTOR', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'));
router.use(resolveDoctorId);

// 1. GET /api/doctor/stats (Doctor Dashboard Summary)
router.get('/stats', async (req, res) => {
  try {
    const doctorId = req.doctor.id;

    // Today's appointments count
    const todayRes = await pool.query(
      `SELECT COUNT(*) FROM appointments 
       WHERE doctor_id = $1 AND (preferred_date::text LIKE $2 OR appointment_date::text LIKE $2)`,
      [doctorId, `%${new Date().toISOString().split('T')[0]}%`]
    );

    // Total appointments count
    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM appointments WHERE doctor_id = $1`,
      [doctorId]
    );

    // Pending appointments count
    const pendingRes = await pool.query(
      `SELECT COUNT(*) FROM appointments WHERE doctor_id = $1 AND status LIKE '%Pending%'`,
      [doctorId]
    );

    // Unique patients count
    const patientsRes = await pool.query(
      `SELECT COUNT(DISTINCT mobile) FROM appointments WHERE doctor_id = $1`,
      [doctorId]
    );

    res.json({
      success: true,
      stats: {
        todayCount: parseInt(todayRes.rows[0].count, 10),
        totalCount: parseInt(totalRes.rows[0].count, 10),
        pendingCount: parseInt(pendingRes.rows[0].count, 10),
        patientCount: parseInt(patientsRes.rows[0].count, 10)
      }
    });
  } catch (err) {
    console.error('Error fetching doctor stats:', err);
    res.status(500).json({ success: false, error: 'Server error fetching doctor stats.' });
  }
});

// 2. GET /api/doctor/appointments (Strict Query-Level Filtered Appointments)
router.get('/appointments', async (req, res) => {
  try {
    const doctorId = req.doctor.id;

    // Filter out unconfirmed Pending Confirmation bookings so Doctor Dashboard ONLY receives appointments AFTER Receptionist confirms them!
    const result = await pool.query(
      `SELECT a.*, p.uhid as patient_uhid 
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       WHERE a.doctor_id = $1 AND (a.status IS NULL OR a.status NOT LIKE '%Pending%')
       ORDER BY a.created_at DESC`,
      [doctorId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    res.status(500).json({ success: false, error: 'Server error fetching doctor appointments.' });
  }
});

import { generatePrescriptionPdf, generateInvoicePdf } from '../services/pdfService.js';

// Helper to generate unique Bill Number
async function generateBillNumber(client) {
  const countRes = await client.query(`SELECT COUNT(*) FROM bills`);
  const count = parseInt(countRes.rows[0].count, 10) + 1;
  const seq = String(count).padStart(6, '0');
  const year = new Date().getFullYear();
  return `INV-GJS-${year}-${seq}`;
}

// 3. PUT /api/doctor/appointments/:id/status (Doctor updates appointment status & auto-creates draft bill on COMPLETED)
router.put('/appointments/:id/status', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const doctorId = req.doctor.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Status is required.' });
    }

    const appRes = await client.query(
      `SELECT * FROM appointments WHERE id = $1 AND doctor_id = $2 FOR UPDATE`,
      [id, doctorId]
    );

    if (appRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Appointment not found or not assigned to you.' });
    }

    const appointment = appRes.rows[0];

    const updateRes = await client.query(
      `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    const updatedApp = updateRes.rows[0];

    // If status is COMPLETED, automatically create draft bill in SAME transaction
    let createdBill = null;
    if (status.toUpperCase() === 'COMPLETED') {
      const existingBill = await client.query(`SELECT * FROM bills WHERE appointment_id = $1`, [id]);
      if (existingBill.rows.length === 0) {
        // Fetch doctor's consultation fee from doctors table
        const docRes = await client.query(`SELECT consultation_fee, name, specialty FROM doctors WHERE id = $1`, [doctorId]);
        const fee = parseFloat(docRes.rows[0]?.consultation_fee || 500.00);

        const billNumber = await generateBillNumber(client);

        // Check if doctor wrote prescription and fetch medicines
        const prescRes = await client.query(`SELECT * FROM prescriptions WHERE appointment_id = $1`, [id]);
        let totalBillAmount = fee;
        const initialItems = [];

        const billRes = await client.query(
          `INSERT INTO bills (hospital_id, patient_id, appointment_id, bill_number, status, total_amount, paid_amount)
           VALUES ($1, $2, $3, $4, 'PENDING', $5, 0.00)
           RETURNING *`,
          ['GJS-HOSP-01', appointment.patient_id, id, billNumber, fee]
        );

        createdBill = billRes.rows[0];

        const itemRes = await client.query(
          `INSERT INTO bill_items (bill_id, category, description, amount, quantity)
           VALUES ($1, 'CONSULTATION', $2, $3, 1)
           RETURNING *`,
          [createdBill.id, `OPD Consultation Fee - Dr. ${docRes.rows[0]?.name || appointment.doctor_name || 'Specialist'}`, fee]
        );
        initialItems.push(itemRes.rows[0]);


        if (prescRes.rows.length > 0) {
          const medRes = await client.query(`SELECT * FROM prescription_medicines WHERE prescription_id = $1`, [prescRes.rows[0].id]);
          for (let med of medRes.rows) {
            const medDesc = `Pharmacy: ${med.name} (${med.dosage || 'Standard'} - ${med.duration || '5 days'})`;
            // Find unit price from catalog
            const catalogRes = await client.query(`SELECT unit_price FROM medicines WHERE LOWER(name) LIKE $1 LIMIT 1`, [`%${med.name.toLowerCase()}%`]);
            const price = catalogRes.rows.length > 0 ? parseFloat(catalogRes.rows[0].unit_price) : 35.00;
            const qty = 1;

            const medItem = await client.query(
              `INSERT INTO bill_items (bill_id, category, description, amount, quantity)
               VALUES ($1, 'PHARMACY', $2, $3, $4) RETURNING *`,
              [createdBill.id, medDesc, price, qty]
            );
            initialItems.push(medItem.rows[0]);
            totalBillAmount += price;
          }
          await client.query(`UPDATE bills SET total_amount = $1 WHERE id = $2`, [totalBillAmount, createdBill.id]);
          createdBill.total_amount = totalBillAmount;
        }

        // Generate Invoice PDF
        const patientRes = await client.query(`SELECT name, mobile, uhid FROM patients WHERE id = $1`, [appointment.patient_id]);
        const pdfUrl = await generateInvoicePdf(createdBill, initialItems, patientRes.rows[0] || {});
        await client.query(`UPDATE bills SET pdf_url = $1 WHERE id = $2`, [pdfUrl, createdBill.id]);
        createdBill.pdf_url = pdfUrl;
      } else {
        createdBill = existingBill.rows[0];
      }
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Appointment status updated to '${status}' successfully!`,
      data: updatedApp,
      bill: createdBill
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating appointment status:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to update appointment status.' });
  } finally {
    client.release();
  }
});

// 3b. POST /api/doctor/appointments/:id/prescription (Write Prescription for appointment)
router.post('/appointments/:id/prescription', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const doctorId = req.doctor.id;
    const { id } = req.params;
    const { diagnosis, notes, followUpDate, medicines } = req.body;

    // Verify appointment belongs to logged-in doctor
    const appRes = await client.query(
      `SELECT a.*, p.name as patient_name, p.age, p.gender, p.uhid
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       WHERE a.id = $1`,
      [id]
    );

    if (appRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Appointment not found.' });
    }

    const appointment = appRes.rows[0];

    // IMPORTANT: Verify doctor identity against appointment.doctor_id (Admins bypass this check)
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'HOSPITAL_ADMIN') {
      if (appointment.doctor_id && parseInt(appointment.doctor_id, 10) !== parseInt(doctorId, 10)) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only prescribe for appointments assigned to you.'
        });
      }
    }

    const derivedPatientId = appointment.patient_id;

    // Insert or update prescription record
    const descRes = await client.query(
      `INSERT INTO prescriptions (hospital_id, appointment_id, patient_id, doctor_id, diagnosis, notes, follow_up_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (appointment_id) DO UPDATE 
       SET diagnosis = EXCLUDED.diagnosis, notes = EXCLUDED.notes, follow_up_date = EXCLUDED.follow_up_date
       RETURNING *`,
      ['GJS-HOSP-01', id, derivedPatientId, doctorId, diagnosis || 'OPD Consultation', notes || '', followUpDate || null]
    );

    const prescription = descRes.rows[0];

    // Delete existing prescription medicines if updating, then re-insert
    await client.query(`DELETE FROM prescription_medicines WHERE prescription_id = $1`, [prescription.id]);

    const insertedMedicines = [];
    if (Array.isArray(medicines) && medicines.length > 0) {
      for (let med of medicines) {
        if (med.name && med.name.trim()) {
          const medRes = await client.query(
            `INSERT INTO prescription_medicines (prescription_id, name, dosage, duration, instructions)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [prescription.id, med.name.trim(), med.dosage || '1-0-1', med.duration || '5 days', med.instructions || 'After food']
          );
          insertedMedicines.push(medRes.rows[0]);
        }
      }
    }

    // Fetch doctor info for PDF & Bill
    const docRes = await client.query(`SELECT name, specialty, consultation_fee FROM doctors WHERE id = $1`, [doctorId]);

    // AUTOMATIC BILL SYNC: Find existing bill for this appointment, or create new if none exists
    let billCheck = await client.query(`SELECT * FROM bills WHERE appointment_id = $1 ORDER BY id DESC LIMIT 1`, [id]);
    let activeBill = billCheck.rows[0];

    const fee = parseFloat(docRes.rows[0]?.consultation_fee || 500.00);

    if (!activeBill) {
      const billNumber = await generateBillNumber(client);
      const newBillRes = await client.query(
        `INSERT INTO bills (hospital_id, patient_id, appointment_id, bill_number, status, total_amount, paid_amount)
         VALUES ($1, $2, $3, $4, 'PENDING', $5, 0.00) RETURNING *`,
        ['GJS-HOSP-01', derivedPatientId, id, billNumber, fee]
      );
      activeBill = newBillRes.rows[0];

      await client.query(
        `INSERT INTO bill_items (bill_id, category, description, amount, quantity)
         VALUES ($1, 'CONSULTATION', $2, $3, 1)`,
        [activeBill.id, `OPD Consultation Fee (${docRes.rows[0]?.name || 'Doctor'})`, fee]
      );
    }

    // Clear previous auto-synced PHARMACY items on this bill before re-adding updated medicines
    await client.query(`DELETE FROM bill_items WHERE bill_id = $1 AND category = 'PHARMACY'`, [activeBill.id]);

    for (let m of insertedMedicines) {
      // Find unit price from catalog
      const catalogRes = await client.query(`SELECT unit_price FROM medicines WHERE LOWER(name) LIKE $1 LIMIT 1`, [`%${m.name.toLowerCase()}%`]);
      const price = catalogRes.rows.length > 0 ? parseFloat(catalogRes.rows[0].unit_price) : 35.00;
      const qty = 1;

      await client.query(
        `INSERT INTO bill_items (bill_id, category, description, amount, quantity)
         VALUES ($1, 'PHARMACY', $2, $3, $4)`,
        [activeBill.id, `Pharmacy: ${m.name}`, price, qty]
      );
    }

    // Recalculate bill total amount
    const totRes = await client.query(
      `SELECT COALESCE(SUM(amount * quantity), 0.00) as total FROM bill_items WHERE bill_id = $1`,
      [activeBill.id]
    );
    const newTotal = parseFloat(totRes.rows[0].total);
    await client.query(`UPDATE bills SET total_amount = $1 WHERE id = $2`, [newTotal, activeBill.id]);

    // Generate PDF
    const pdfUrl = await generatePrescriptionPdf(
      prescription,
      insertedMedicines,
      { name: appointment.patient_name, age: appointment.age, gender: appointment.gender, uhid: appointment.uhid },
      { name: docRes.rows[0]?.name || appointment.doctor_name, specialty: docRes.rows[0]?.specialty || appointment.department_name }
    );

    await client.query(`UPDATE prescriptions SET pdf_url = $1 WHERE id = $2`, [pdfUrl, prescription.id]);
    prescription.pdf_url = pdfUrl;

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Prescription saved & PDF generated successfully!',
      data: {
        ...prescription,
        medicines: insertedMedicines
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving prescription:', err);
    res.status(500).json({ success: false, error: 'Failed to save prescription.' });
  } finally {
    client.release();
  }
});

// 4. GET /api/doctor/patients/:id (Read-only Patient View - Restricted to Doctor's Patients)
router.get('/patients/:id', async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const { id } = req.params;

    // Check if patient exists
    const patientRes = await pool.query(`SELECT * FROM patients WHERE id = $1`, [id]);
    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found.' });
    }

    const patient = patientRes.rows[0];

    // Check if doctor has at least 1 appointment with this patient
    const checkRes = await pool.query(
      `SELECT id FROM appointments 
       WHERE doctor_id = $1 AND (patient_id = $2 OR mobile = $3)`,
      [doctorId, id, patient.mobile]
    );

    if (checkRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view profiles for patients who have booked appointments with you.'
      });
    }

    // Fetch appointments with this doctor
    const appRes = await pool.query(
      `SELECT * FROM appointments 
       WHERE doctor_id = $1 AND (patient_id = $2 OR mobile = $3)
       ORDER BY created_at DESC`,
      [doctorId, id, patient.mobile]
    );

    res.json({
      success: true,
      patient,
      appointments: appRes.rows
    });

  } catch (err) {
    console.error('Error fetching patient profile for doctor:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch patient profile.' });
  }
});

// 5. POST /api/doctor/availability (Block dates/time slots for leave/unavailability)
router.post('/availability', async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const { blocked_date, blocked_time_slot, reason } = req.body;

    if (!blocked_date) {
      return res.status(400).json({ success: false, error: 'Blocked date is required.' });
    }

    const result = await pool.query(
      `INSERT INTO doctor_unavailability (doctor_id, blocked_date, blocked_time_slot, reason)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [doctorId, blocked_date, blocked_time_slot || null, reason || 'Leave']
    );

    res.json({
      success: true,
      message: 'Unavailability slot saved successfully!',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding doctor unavailability:', err);
    res.status(500).json({ success: false, error: 'Failed to save unavailability slot.' });
  }
});

// 6. GET /api/doctor/availability (Get doctor blocked dates)
router.get('/availability', async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const result = await pool.query(
      `SELECT * FROM doctor_unavailability WHERE doctor_id = $1 ORDER BY blocked_date ASC`,
      [doctorId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching unavailability slots:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch unavailability slots.' });
  }
});

// 7. DELETE /api/doctor/availability/:id (Unblock date/slot)
router.delete('/availability/:id', async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const { id } = req.params;
    await pool.query(
      `DELETE FROM doctor_unavailability WHERE id = $1 AND doctor_id = $2`,
      [id, doctorId]
    );
    res.json({ success: true, message: 'Unavailability slot removed.' });
  } catch (err) {
    console.error('Error deleting unavailability slot:', err);
    res.status(500).json({ success: false, error: 'Failed to remove unavailability slot.' });
  }
});

// 8. GET /api/doctor/medicines/search?q= (Doctor Medicine Autocomplete + Availability Indicator)
// STRICT PRIVACY ENFORCEMENT: Returns ONLY id, name, unit, and boolean isAvailable.
// NEVER exposes currentStock, reorderLevel, unitPrice, or stockMovements data to Doctor roles!
router.get('/medicines/search', async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `SELECT id, name, unit, (current_stock > 0) as "isAvailable" FROM medicines WHERE status = 'ACTIVE'`;
    const params = [];

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      sql += ` AND name ILIKE $${params.length}`;
    }

    sql += ` ORDER BY name ASC LIMIT 20`;

    const result = await pool.query(sql, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(r => ({
        id: r.id,
        name: r.name,
        unit: r.unit,
        isAvailable: Boolean(r.isAvailable)
      }))
    });
  } catch (err) {
    console.error('Error in doctor medicine search:', err);
    res.status(500).json({ success: false, error: 'Failed to search medicines.' });
  }
});

export default router;
