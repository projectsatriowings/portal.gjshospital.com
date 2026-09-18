import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { findOrCreatePatient } from '../services/patientService.js';
import { pool } from '../config/db.js';

const router = express.Router();

// Protect all admin patient routes
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'PHARMACIST'));

// 1. GET /api/admin/patients (Search & Paginated List)
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let queryStr = `SELECT * FROM patients WHERE hospital_id = $1`;
    let countStr = `SELECT COUNT(*) FROM patients WHERE hospital_id = $1`;
    const params = [req.user.hospitalId || 'GJS-HOSP-01'];

    if (search.trim()) {
      queryStr += ` AND (LOWER(name) LIKE $2 OR mobile LIKE $2 OR LOWER(uhid) LIKE $2 OR LOWER(email) LIKE $2)`;
      countStr += ` AND (LOWER(name) LIKE $2 OR mobile LIKE $2 OR LOWER(uhid) LIKE $2 OR LOWER(email) LIKE $2)`;
      params.push(`%${search.trim().toLowerCase()}%`);
    }

    const countRes = await pool.query(countStr, params);
    const total = parseInt(countRes.rows[0].count, 10);

    queryStr += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const dataParams = [...params, limitNum, offset];

    const dataRes = await pool.query(queryStr, dataParams);

    res.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ success: false, error: 'Server error fetching patients list.' });
  }
});

// 2. GET /api/admin/patients/:id (Full Profile & Appointments History)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patientRes = await pool.query(
      `SELECT * FROM patients WHERE id = $1 AND hospital_id = $2`,
      [id, req.user.hospitalId || 'GJS-HOSP-01']
    );

    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found.' });
    }

    const patient = patientRes.rows[0];

    // Fetch linked appointments by patient_id OR matching mobile
    const appointmentsRes = await pool.query(
      `SELECT * FROM appointments 
       WHERE patient_id = $1 OR (mobile = $2 AND mobile IS NOT NULL AND mobile != '')
       ORDER BY created_at DESC`,
      [patient.id, patient.mobile]
    );

    res.json({
      success: true,
      patient,
      appointments: appointmentsRes.rows
    });
  } catch (err) {
    console.error('Error fetching patient profile:', err);
    res.status(500).json({ success: false, error: 'Server error fetching patient profile.' });
  }
});

// 2b. GET /api/admin/patients/:id/prescriptions - Real Prescriptions list for Patient Profile
router.get('/:id/prescriptions', async (req, res) => {
  try {
    const { id } = req.params;
    const pRes = await pool.query(
      `SELECT pr.*, d.name as doctor_name, d.specialty as doctor_specialty, a.appointment_id, a.preferred_date
       FROM prescriptions pr
       LEFT JOIN doctors d ON pr.doctor_id = d.id
       LEFT JOIN appointments a ON pr.appointment_id = a.id
       WHERE pr.patient_id = $1
       ORDER BY pr.created_at DESC`,
      [id]
    );

    const prescriptions = pRes.rows;
    for (let p of prescriptions) {
      const medRes = await pool.query(`SELECT * FROM prescription_medicines WHERE prescription_id = $1 ORDER BY id ASC`, [p.id]);
      p.medicines = medRes.rows;
    }

    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (err) {
    console.error('Error fetching patient prescriptions:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch patient prescriptions' });
  }
});

// 2c. GET /api/admin/patients/:id/bills - Real Bills list for Patient Profile
router.get('/:id/bills', async (req, res) => {
  try {
    const { id } = req.params;
    const bRes = await pool.query(
      `SELECT b.*, a.appointment_id, a.doctor_name
       FROM bills b
       LEFT JOIN appointments a ON b.appointment_id = a.id
       WHERE b.patient_id = $1
       ORDER BY b.created_at DESC`,
      [id]
    );

    const bills = bRes.rows;
    for (let b of bills) {
      const itemsRes = await pool.query(`SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY id ASC`, [b.id]);
      b.items = itemsRes.rows;
    }

    res.json({ success: true, count: bills.length, data: bills });
  } catch (err) {
    console.error('Error fetching patient bills:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch patient bills' });
  }
});

// 3. POST /api/admin/patients (Manual Walk-in Patient Registration)
router.post('/', async (req, res) => {
  try {
    const patient = await findOrCreatePatient(req.user.hospitalId || 'GJS-HOSP-01', req.body);
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully!',
      data: patient
    });
  } catch (err) {
    console.error('Error registering patient:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error registering patient.' });
  }
});

// 4. PUT /api/admin/patients/:id (Update Patient Record)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, mobile, email, age, dob, gender, blood_group, address,
      govt_id_number, emergency_contact_name, emergency_contact_phone,
      allergies, existing_diseases, insurance_provider, insurance_policy_number
    } = req.body;

    const result = await pool.query(
      `UPDATE patients SET
        name = COALESCE($1, name),
        mobile = COALESCE($2, mobile),
        email = $3,
        age = $4,
        dob = $5,
        gender = $6,
        blood_group = $7,
        address = $8,
        govt_id_number = $9,
        emergency_contact_name = $10,
        emergency_contact_phone = $11,
        allergies = $12,
        existing_diseases = $13,
        insurance_provider = $14,
        insurance_policy_number = $15
       WHERE id = $16 AND hospital_id = $17
       RETURNING *`,
      [
        name, mobile, email || null, age ? parseInt(age, 10) : null,
        dob || null, gender || null, blood_group || null, address || null,
        govt_id_number || null, emergency_contact_name || null,
        emergency_contact_phone || null, allergies || null, existing_diseases || null,
        insurance_provider || null, insurance_policy_number || null,
        id, req.user.hospitalId || 'GJS-HOSP-01'
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient record not found.' });
    }

    res.json({
      success: true,
      message: 'Patient profile updated successfully!',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(500).json({ success: false, error: 'Server error updating patient record.' });
  }
});

export default router;
