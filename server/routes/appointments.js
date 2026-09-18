import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/db.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload setup using Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

import { findOrCreatePatient } from '../services/patientService.js';

// Helper to generate unique Appointment ID
const generateAppointmentId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `GJS-${new Date().getFullYear()}-${randomNum}`;
};

// 1. POST /api/appointments/upload-report - Report File Upload
router.post('/upload-report', upload.single('reportFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({
    success: true,
    message: 'Report uploaded successfully',
    fileUrl: `/uploads/${req.file.filename}`
  });
});

// 2. POST /api/appointments - Guest Appointment Booking (No Login)
router.post('/', async (req, res) => {
  const { 
    fullName, patientName, mobile, email, age, gender, 
    departmentId, departmentName, doctorId, doctorName, 
    preferredDate, preferredTime, reason, message, reportFile 
  } = req.body;

  const finalName = fullName || patientName;
  const finalDate = preferredDate;

  if (!finalName || !mobile || !finalDate) {
    return res.status(400).json({ 
      success: false, 
      message: 'Full Name, Mobile Number, and Preferred Date are required' 
    });
  }

  const appointmentId = generateAppointmentId();
  const tokenNumber = `TK-${Math.floor(10 + Math.random() * 90)}`;
  const instructions = "Please arrive 15 minutes prior to your preferred time slot. Carry any previous medical reports and a valid ID proof.";

  try {
    // Check if Doctor is on leave on finalDate
    if (doctorId && finalDate) {
      const dateObj = new Date(finalDate);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateOnly = `${yyyy}-${mm}-${dd}`;
      const isoDateOnly = dateObj.toISOString().split('T')[0];

      const leaveCheck = await pool.query(
        `SELECT reason FROM doctor_unavailability WHERE doctor_id = $1 AND (blocked_date::text LIKE $2 OR blocked_date::text LIKE $3)`,
        [parseInt(doctorId, 10), `%${dateOnly}%`, `%${isoDateOnly}%`]
      );
      if (leaveCheck.rows.length > 0) {
        const reason = leaveCheck.rows[0]?.reason || 'Leave / Unavailable';
        return res.status(400).json({
          success: false,
          message: `Doctor ${doctorName || ''} is unavailable / on leave on ${dateOnly} (${reason}). Please choose another date or doctor.`
        });
      }
    }

    // Automatically find or create Patient record with UHID
    const patient = await findOrCreatePatient('GJS-HOSP-01', {
      name: finalName,
      mobile: mobile,
      email: email,
      age: age,
      gender: gender
    });

    const query = `
      INSERT INTO appointments (
        appointment_id, patient_id, patient_name, mobile, phone, email, age, gender, 
        department_id, department_name, department, doctor_id, doctor_name, 
        preferred_date, appointment_date, preferred_time, reason, report_file, 
        status, token_number, instructions, created_at
      )
      VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $9, $10, $11, $12, $12, $13, $14, $15, $16, $17, $18, NOW())
      RETURNING *;
    `;
    const values = [
      appointmentId,
      patient.id,
      finalName,
      mobile,
      email || '',
      age ? parseInt(age) : null,
      gender || 'unspecified',
      departmentId ? parseInt(departmentId) : null,
      departmentName || 'General Medicine',
      doctorId ? parseInt(doctorId) : null,
      doctorName || 'Available Specialist',
      finalDate,
      preferredTime || '09:00 AM - 12:00 PM',
      reason || message || 'Consultation',
      reportFile || '',
      'Pending Confirmation',
      tokenNumber,
      instructions
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Your appointment request has been submitted successfully. Our hospital team will confirm your appointment shortly via phone call, SMS, or email.',
      appointmentId: appointmentId,
      status: 'Pending Confirmation',
      tokenNumber: tokenNumber,
      instructions: instructions,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating appointment:', error.message);
    res.status(500).json({ success: false, message: 'Appointment submission failed. Please try again.' });
  }
});

// 3. GET /api/appointments/status - Status Check by appointmentId & mobile
router.get('/status', async (req, res) => {
  const { appointmentId, mobile } = req.query;

  if (!appointmentId || !mobile) {
    return res.status(400).json({ 
      success: false, 
      message: 'Both Appointment ID and Mobile Number are required to track status' 
    });
  }

  try {
    const query = `
      SELECT * FROM appointments 
      WHERE LOWER(appointment_id) = LOWER($1) AND mobile = $2
    `;
    const result = await pool.query(query, [appointmentId.trim(), mobile.trim()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No appointment found matching this Appointment ID and Mobile Number combination.' 
      });
    }

    const app = result.rows[0];

    res.json({
      success: true,
      data: {
        appointmentId: app.appointment_id,
        patientName: app.patient_name,
        mobile: app.mobile,
        status: app.status || 'PENDING',
        doctorName: app.doctor_name || 'Assigned On Call Specialist',
        department: app.department_name || 'General Medicine',
        date: app.preferred_date || app.appointment_date,
        time: app.preferred_time || '09:00 AM - 12:00 PM',
        tokenNumber: app.token_number ? parseInt(app.token_number, 10) : null,
        instructions: 'Please arrive 15 minutes before your slot with previous medical records.'
      }
    });
  } catch (error) {
    console.error('Error checking status:', error.message);
    res.status(500).json({ success: false, message: 'Status check failed. Please try again.' });
  }
});

// 4. POST /api/appointments/package - Health Package Booking
router.post('/package', async (req, res) => {
  const { fullName, mobile, email, packageId, packageName, preferredDate } = req.body;

  if (!fullName || !mobile || !preferredDate) {
    return res.status(400).json({ success: false, message: 'Full Name, Mobile Number, and Date are required' });
  }

  const appointmentId = generateAppointmentId();

  try {
    const query = `
      INSERT INTO appointments (
        appointment_id, patient_name, mobile, email, 
        department_name, preferred_date, reason, package_id, 
        status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending Confirmation', NOW())
      RETURNING *;
    `;
    const values = [
      appointmentId,
      fullName,
      mobile,
      email || '',
      'Diagnostic Center',
      preferredDate,
      `Health Package Booking: ${packageName || 'Special Checkup'}`,
      packageId ? parseInt(packageId) : null
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Health Package booking request submitted successfully!',
      appointmentId: appointmentId,
      status: 'Pending Confirmation',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Package booking failed' });
  }
});

export default router;
