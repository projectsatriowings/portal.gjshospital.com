import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { findOrCreatePatient } from '../services/patientService.js';
import { sendConfirmation, sendReschedule, sendCancellation, sendNoShow } from '../services/notificationService.js';
import { generateAppointmentSlipPdf } from '../services/pdfService.js';

const router = express.Router();

// Apply Auth Middleware: Restricted to SUPER_ADMIN, HOSPITAL_ADMIN, and RECEPTIONIST
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'PHARMACIST'));

// Helper to generate unique Appointment ID
const generateAppointmentId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `GJS-${new Date().getFullYear()}-${randomNum}`;
};

// Helper to calculate next sequential token number for a doctor on a specific date
async function getNextTokenNumber(client, doctorId, dateStr) {
  if (!doctorId || !dateStr) return 1;
  const cleanDate = dateStr instanceof Date 
    ? dateStr.toISOString().split('T')[0] 
    : String(dateStr).split('T')[0];

  const query = `
    SELECT COUNT(*) 
    FROM appointments 
    WHERE doctor_id = $1 
      AND (preferred_date::text LIKE $2 OR appointment_date::text LIKE $2)
      AND status IN ('CONFIRMED', 'Confirmed', 'COMPLETED', 'Completed', 'RESCHEDULED', 'Rescheduled')
  `;
  const result = await client.query(query, [doctorId, `%${cleanDate}%`]);
  const count = parseInt(result.rows[0].count, 10);
  return count + 1;
}

// Helper to log status change in appointment_status_logs
async function logStatusChange(client, appointmentId, previousStatus, newStatus, userId, userName, reason = null) {
  await client.query(
    `INSERT INTO appointment_status_logs 
     (appointment_id, previous_status, new_status, changed_by_user_id, changed_by_name, reason, changed_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [appointmentId, previousStatus || 'PENDING', newStatus, userId || null, userName || 'System Staff', reason || null]
  );
}

// GET /api/admin/appointments/dashboard-overview-stats - Aggregated HMS Admin Dashboard KPIs
router.get('/dashboard-overview-stats', async (req, res) => {
  try {
    const userRole = req.user?.role;
    const isReceptionist = userRole === 'RECEPTIONIST';

    // 1. Today's Appointments
    const appTodayRes = await pool.query(
      `SELECT COUNT(*)::int FROM appointments 
       WHERE DATE(preferred_date) = CURRENT_DATE 
          OR DATE(appointment_date) = CURRENT_DATE 
          OR DATE(created_at) = CURRENT_DATE`
    );
    const todayAppointmentsCount = appTodayRes.rows[0].count;

    // 2. Today's Patients
    const ptTodayRes = await pool.query(
      `SELECT COUNT(*)::int FROM patients 
       WHERE DATE(created_at) = CURRENT_DATE`
    );
    const todayPatientsCount = ptTodayRes.rows[0].count;

    // 3. Pending Bills (count and amount)
    const pendingBillsRes = await pool.query(
      `SELECT COUNT(*)::int as count, COALESCE(SUM(total_amount - paid_amount), 0.00)::float as amount 
       FROM bills 
       WHERE status IN ('PENDING', 'PARTIALLY_PAID', 'Pending', 'Partially Paid')`
    );
    const pendingBillsCount = pendingBillsRes.rows[0].count;
    const pendingBillsAmount = pendingBillsRes.rows[0].amount;

    // 4. OPD Count Today (status = COMPLETED today)
    const opdCompletedRes = await pool.query(
      `SELECT COUNT(*)::int FROM appointments 
       WHERE (UPPER(status) = 'COMPLETED' OR UPPER(status) = 'Completed')
         AND (preferred_date::date = CURRENT_DATE OR appointment_date::date = CURRENT_DATE OR created_at::date = CURRENT_DATE)`
    );
    const opdCompletedCount = opdCompletedRes.rows[0].count;

    // If receptionist, return the reduced set immediately
    if (isReceptionist) {
      const activeIpdRes = await pool.query("SELECT COUNT(*)::int FROM admissions WHERE status = 'ADMITTED'");
      const activeIpdCount = activeIpdRes.rows[0].count;
      const bedsRes = await pool.query("SELECT COUNT(*)::int as total, COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END)::int as occupied FROM beds");
      const totalBedsCount = bedsRes.rows[0].total;
      const occupiedBedsCount = bedsRes.rows[0].occupied;

      return res.json({
        success: true,
        stats: {
          todayAppointmentsCount,
          todayPatientsCount,
          pendingBillsCount,
          pendingBillsAmount,
          opdCompletedCount,
          activeIpdCount,
          totalBedsCount,
          occupiedBedsCount
        }
      });
    }

    // For admins: fetch the remaining full set of metrics
    // 5. Total active doctors
    const totalDocsRes = await pool.query(
      `SELECT COUNT(*)::int FROM doctors`
    );
    const totalDoctors = totalDocsRes.rows[0].count;

    // 6. Today's Revenue (sum of paid_amount today)
    const revenueRes = await pool.query(
      `SELECT COALESCE(SUM(paid_amount), 0.00)::float as revenue FROM bills 
       WHERE status IN ('PAID', 'PARTIALLY_PAID') 
         AND created_at::date = CURRENT_DATE`
    );
    const todayRevenue = revenueRes.rows[0].revenue;

    // 7. Pending Prescriptions
    const pendingRxRes = await pool.query(
      `SELECT COUNT(DISTINCT pm.prescription_id)::int FROM prescription_medicines pm
       WHERE pm.dispensed_status = 'PENDING'`
    );
    const pendingPrescriptionsCount = pendingRxRes.rows[0].count;

    // 8. Low Stock Alerts
    const lowStockRes = await pool.query(
      `SELECT COUNT(*)::int FROM medicines 
       WHERE current_stock < reorder_level AND status = 'ACTIVE'`
    );
    const lowStockCount = lowStockRes.rows[0].count;

    // Trailing 7 Days Revenue Trend
    const trendRes = await pool.query(
      `WITH date_series AS (
         SELECT GENERATE_SERIES(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS day
       )
       SELECT 
         TO_CHAR(ds.day, 'DD Mon') as date,
         COALESCE(SUM(b.paid_amount), 0.00)::float as amount
       FROM date_series ds
       LEFT JOIN bills b ON DATE(b.created_at) = ds.day AND b.status IN ('PAID', 'PARTIALLY_PAID')
       GROUP BY ds.day
       ORDER BY ds.day ASC`
    );
    const revenueTrend = trendRes.rows;

    const activeIpdRes = await pool.query("SELECT COUNT(*)::int FROM admissions WHERE status = 'ADMITTED'");
    const activeIpdCount = activeIpdRes.rows[0].count;
    const bedsRes = await pool.query("SELECT COUNT(*)::int as total, COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END)::int as occupied FROM beds");
    const totalBedsCount = bedsRes.rows[0].total;
    const occupiedBedsCount = bedsRes.rows[0].occupied;

    res.json({
      success: true,
      stats: {
        todayAppointmentsCount,
        todayPatientsCount,
        totalDoctors,
        todayRevenue,
        pendingBillsCount,
        pendingBillsAmount,
        opdCompletedCount,
        pendingPrescriptionsCount,
        lowStockCount,
        activeIpdCount,
        totalBedsCount,
        occupiedBedsCount
      },
      revenueTrend
    });
  } catch (err) {
    console.error('Error fetching dashboard overview stats:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard overview stats.' });
  }
});

// 1. GET /api/admin/appointments - List with Search & Multi-filters
router.get('/', async (req, res) => {
  try {
    const { query, status, doctorId, departmentId, startDate, endDate, patientId, patient_id } = req.query;
    const pId = patientId || patient_id;

    let sql = `
      SELECT a.*, p.uhid as patient_uhid, p.blood_group, p.gender as patient_gender,
             pr.id as prescription_id
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN prescriptions pr ON pr.appointment_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (pId) {
      params.push(parseInt(pId, 10));
      sql += ` AND a.patient_id = $${params.length}`;
    }

    if (query) {
      params.push(`%${query.trim()}%`);
      const pIndex = params.length;
      sql += ` AND (a.patient_name ILIKE $${pIndex} OR a.mobile ILIKE $${pIndex} OR a.appointment_id ILIKE $${pIndex})`;
    }

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND UPPER(a.status) = UPPER($${params.length})`;
    }

    if (doctorId && doctorId !== 'all') {
      params.push(parseInt(doctorId, 10));
      sql += ` AND a.doctor_id = $${params.length}`;
    }

    if (departmentId && departmentId !== 'all') {
      params.push(parseInt(departmentId, 10));
      sql += ` AND a.department_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND (a.preferred_date >= $${params.length} OR a.appointment_date >= $${params.length})`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND (a.preferred_date <= $${params.length} OR a.appointment_date <= $${params.length})`;
    }

    sql += ` ORDER BY a.created_at DESC`;

    const result = await pool.query(sql, params);
    const appointments = result.rows;

    // Attach doctor leave status & slot conflict count to each appointment row
    for (let app of appointments) {
      if (app.doctor_id && (app.preferred_date || app.appointment_date)) {
        const dateStr = app.preferred_date || app.appointment_date;
        const dateObj = new Date(dateStr);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateOnly = `${yyyy}-${mm}-${dd}`;
        const isoDateOnly = dateObj.toISOString().split('T')[0];

        // Check if doctor is on leave
        const leaveCheck = await pool.query(
          `SELECT reason FROM doctor_unavailability WHERE doctor_id = $1 AND (blocked_date::text LIKE $2 OR blocked_date::text LIKE $3)`,
          [app.doctor_id, `%${dateOnly}%`, `%${isoDateOnly}%`]
        );
        app.is_doctor_on_leave = leaveCheck.rows.length > 0;
        app.doctor_leave_reason = leaveCheck.rows[0]?.reason || null;

        // Check patient count in same slot
        const slotCheck = await pool.query(
          `SELECT COUNT(*) FROM appointments 
           WHERE doctor_id = $1 
             AND (preferred_date::text LIKE $2 OR preferred_date::text LIKE $3 OR appointment_date::text LIKE $2 OR appointment_date::text LIKE $3)
             AND preferred_time = $4
             AND id != $5
             AND status IN ('CONFIRMED', 'Confirmed', 'COMPLETED', 'Completed', 'RESCHEDULED', 'Rescheduled')`,
          [app.doctor_id, `%${dateOnly}%`, `%${isoDateOnly}%`, app.preferred_time, app.id]
        );
        app.slot_patient_count = parseInt(slotCheck.rows[0].count, 10);
      } else {
        app.is_doctor_on_leave = false;
        app.doctor_leave_reason = null;
        app.slot_patient_count = 0;
      }
    }

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    console.error('Error fetching admin appointments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch appointments list' });
  }
});

// 2. GET /api/admin/appointments/:id - Full Detail View with Timeline Logs
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const isNum = !isNaN(id);
    const appRes = isNum
      ? await pool.query(
          `SELECT a.*, p.uhid as patient_uhid, p.blood_group, p.gender as patient_gender, p.address as patient_address, p.emergency_contact_phone
           FROM appointments a
           LEFT JOIN patients p ON a.patient_id = p.id
           WHERE a.id = $1 OR a.appointment_id = $2`,
          [parseInt(id, 10), id]
        )
      : await pool.query(
          `SELECT a.*, p.uhid as patient_uhid, p.blood_group, p.gender as patient_gender, p.address as patient_address, p.emergency_contact_phone
           FROM appointments a
           LEFT JOIN patients p ON a.patient_id = p.id
           WHERE a.appointment_id = $1`,
          [id]
        );

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const appointment = appRes.rows[0];

    // Fetch timeline logs
    const logsRes = await pool.query(
      `SELECT * FROM appointment_status_logs WHERE appointment_id = $1 ORDER BY changed_at ASC`,
      [appointment.id]
    );

    // Calculate Doctor Availability & Existing Slot Bookings Verification
    let slotVerification = {
      isDoctorOnLeave: false,
      leaveReason: null,
      existingSlotBookingsCount: 0,
      existingSlotPatients: [],
      statusMessage: 'Doctor Available for this slot'
    };

    if (appointment.doctor_id && (appointment.preferred_date || appointment.appointment_date)) {
      const dateStr = appointment.preferred_date || appointment.appointment_date;
      const dateObj = new Date(dateStr);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateOnly = `${yyyy}-${mm}-${dd}`;
      const isoDateOnly = dateObj.toISOString().split('T')[0];

      // 1. Check doctor leave
      const leaveRes = await pool.query(
        `SELECT * FROM doctor_unavailability WHERE doctor_id = $1 AND (blocked_date::text LIKE $2 OR blocked_date::text LIKE $3)`,
        [appointment.doctor_id, `%${dateOnly}%`, `%${isoDateOnly}%`]
      );
      if (leaveRes.rows.length > 0) {
        slotVerification.isDoctorOnLeave = true;
        slotVerification.leaveReason = leaveRes.rows[0].reason || 'On Leave / Unavailable';
        slotVerification.statusMessage = `⚠️ Doctor On Leave on ${dateOnly} (${slotVerification.leaveReason})`;
      } else {
        // 2. Check existing bookings in same date & time slot (excluding current appointment)
        const slotBookingsRes = await pool.query(
          `SELECT patient_name, token_number, status, preferred_time 
           FROM appointments 
           WHERE doctor_id = $1 
             AND (preferred_date::text LIKE $2 OR preferred_date::text LIKE $3 OR appointment_date::text LIKE $2 OR appointment_date::text LIKE $3)
             AND preferred_time = $4
             AND id != $5
             AND status IN ('CONFIRMED', 'Confirmed', 'COMPLETED', 'Completed', 'RESCHEDULED', 'Rescheduled')`,
          [appointment.doctor_id, `%${dateOnly}%`, `%${isoDateOnly}%`, appointment.preferred_time, appointment.id]
        );

        slotVerification.existingSlotBookingsCount = slotBookingsRes.rows.length;
        slotVerification.existingSlotPatients = slotBookingsRes.rows;
        if (slotBookingsRes.rows.length > 0) {
          slotVerification.statusMessage = `ℹ️ ${slotBookingsRes.rows.length} existing patient(s) already confirmed in this slot (${appointment.preferred_time})`;
        } else {
          slotVerification.statusMessage = `✅ Doctor Available & Slot Free (${appointment.preferred_time})`;
        }
      }
    }

    res.json({
      success: true,
      data: {
        ...appointment,
        statusLogs: logsRes.rows,
        slotVerification
      }
    });
  } catch (error) {
    console.error('Error fetching appointment detail:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch appointment detail' });
  }
});

// 3. PUT /api/admin/appointments/:id/confirm - Confirm & Assign Token
router.put('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query('SELECT * FROM appointments WHERE id = $1 FOR UPDATE', [id]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const app = checkRes.rows[0];
    const dateStr = app.preferred_date || app.appointment_date;

    // 3a. Validate requested slot against doctor's schedule/availability
    if (app.doctor_id && dateStr) {
      const dateOnly = dateStr instanceof Date 
        ? dateStr.toISOString().split('T')[0] 
        : String(dateStr).split('T')[0];

      const leaveCheck = await client.query(
        `SELECT * FROM doctor_unavailability WHERE doctor_id = $1 AND (blocked_date::text LIKE $2 OR blocked_date = $3)`,
        [app.doctor_id, `%${dateOnly}%`, dateOnly]
      );
      if (leaveCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          error: `Doctor is unavailable/on leave on ${dateOnly}. Please reschedule the appointment instead of confirming.` 
        });
      }
    }

    const prevStatus = app.status || 'PENDING';
    const tokenNum = await getNextTokenNumber(client, app.doctor_id, dateStr);

    const updateRes = await client.query(
      `UPDATE appointments 
       SET status = 'CONFIRMED', token_number = $1 
       WHERE id = $2 
       RETURNING *`,
      [String(tokenNum), id]
    );

    const updatedApp = updateRes.rows[0];

    await logStatusChange(
      client, 
      id, 
      prevStatus, 
      'CONFIRMED', 
      req.user.userId, 
      req.user.name || 'Staff'
    );

    await client.query('COMMIT');

    // Trigger Notification
    await sendConfirmation(updatedApp);

    res.json({
      success: true,
      message: `Appointment confirmed successfully! Assigned Token #${tokenNum}`,
      data: updatedApp
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error confirming appointment:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm appointment' });
  } finally {
    client.release();
  }
});

// 3b. PUT /api/admin/appointments/:id/check-in - Patient Check-In
router.put('/:id/check-in', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const checkRes = await client.query('SELECT * FROM appointments WHERE id = $1 FOR UPDATE', [id]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const app = checkRes.rows[0];
    if (app.status !== 'CONFIRMED' && app.status !== 'Confirmed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Only CONFIRMED appointments can be checked in' });
    }

    const updateRes = await client.query(
      `UPDATE appointments SET checked_in_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    await logStatusChange(
      client,
      id,
      app.status,
      app.status,
      req.user.userId,
      req.user.name || 'Staff',
      'Patient arrived at hospital and completed check-in'
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Patient checked in successfully!',
      data: updateRes.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error performing check-in:', err);
    res.status(500).json({ success: false, error: 'Failed to record check-in' });
  } finally {
    client.release();
  }
});

// 3c. GET /api/admin/appointments/:id/slip - Generate & Download Printed Slip PDF
router.get('/:id/slip', async (req, res) => {
  try {
    const { id } = req.params;
    const isNum = !isNaN(id);
    const appRes = isNum
      ? await pool.query(`SELECT * FROM appointments WHERE id = $1 OR appointment_id = $2`, [parseInt(id, 10), id])
      : await pool.query(`SELECT * FROM appointments WHERE appointment_id = $1`, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const appointment = appRes.rows[0];
    const pdfUrl = await generateAppointmentSlipPdf(appointment);

    res.json({ success: true, pdfUrl });
  } catch (err) {
    console.error('Error generating appointment slip PDF:', err);
    res.status(500).json({ success: false, error: 'Failed to generate printed appointment slip' });
  }
});

// 3d. GET /api/admin/appointments/:id/prescription - Fetch Doctor Prescription & PDF for Receptionist/Pharmacy
router.get('/:id/prescription', async (req, res) => {
  try {
    const { id } = req.params;
    const isNum = !isNaN(id);
    const appRes = isNum
      ? await pool.query(`SELECT id FROM appointments WHERE id = $1 OR appointment_id = $2`, [parseInt(id, 10), id])
      : await pool.query(`SELECT id FROM appointments WHERE appointment_id = $1`, [id]);

    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Appointment not found.' });
    }

    const appId = appRes.rows[0].id;
    const prescRes = await pool.query(`SELECT * FROM prescriptions WHERE appointment_id = $1`, [appId]);

    if (prescRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No prescription recorded for this appointment yet.' });
    }

    const prescription = prescRes.rows[0];
    const medRes = await pool.query(`SELECT * FROM prescription_medicines WHERE prescription_id = $1`, [prescription.id]);

    res.json({
      success: true,
      data: {
        ...prescription,
        medicines: medRes.rows
      }
    });
  } catch (err) {
    console.error('Error fetching appointment prescription:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch prescription.' });
  }
});

// 4. PUT /api/admin/appointments/:id/reschedule - Reschedule Date/Time
router.put('/:id/reschedule', async (req, res) => {
  const { id } = req.params;
  const { newDate, newTime } = req.body;

  if (!newDate || !newTime) {
    return res.status(400).json({ success: false, error: 'newDate and newTime are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query('SELECT * FROM appointments WHERE id = $1 FOR UPDATE', [id]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const app = checkRes.rows[0];

    // Check doctor unavailability / slot conflict
    if (app.doctor_id) {
      const leaveCheck = await client.query(
        `SELECT * FROM doctor_unavailability WHERE doctor_id = $1 AND (blocked_date::text LIKE $2 OR blocked_date = $3)`,
        [app.doctor_id, `%${newDate}%`, newDate]
      );
      if (leaveCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: `Doctor is unavailable on ${newDate}. Please choose another date.` });
      }
    }

    const prevStatus = app.status || 'PENDING';

    const updateRes = await client.query(
      `UPDATE appointments 
       SET preferred_date = $1, preferred_time = $2, appointment_date = $1, status = 'RESCHEDULED', token_number = NULL
       WHERE id = $3
       RETURNING *`,
      [newDate, newTime, id]
    );

    const updatedApp = updateRes.rows[0];

    await logStatusChange(
      client,
      id,
      prevStatus,
      'RESCHEDULED',
      req.user.userId,
      req.user.name || 'Staff',
      `Rescheduled to ${newDate} ${newTime}`
    );

    await client.query('COMMIT');

    // Trigger Notification
    await sendReschedule(updatedApp, newDate, newTime);

    res.json({
      success: true,
      message: `Appointment rescheduled to ${newDate} at ${newTime}`,
      data: updatedApp
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ success: false, error: 'Failed to reschedule appointment' });
  } finally {
    client.release();
  }
});

// 5. PUT /api/admin/appointments/:id/cancel - Cancel with Reason
router.put('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query('SELECT * FROM appointments WHERE id = $1 FOR UPDATE', [id]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const app = checkRes.rows[0];
    const prevStatus = app.status || 'PENDING';

    const updateRes = await client.query(
      `UPDATE appointments SET status = 'CANCELLED' WHERE id = $1 RETURNING *`,
      [id]
    );

    const updatedApp = updateRes.rows[0];

    await logStatusChange(
      client,
      id,
      prevStatus,
      'CANCELLED',
      req.user.userId,
      req.user.name || 'Staff',
      reason || 'Cancelled by staff'
    );

    await client.query('COMMIT');

    // Trigger Notification
    await sendCancellation(updatedApp, reason);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: updatedApp
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel appointment' });
  } finally {
    client.release();
  }
});

// 6. PUT /api/admin/appointments/:id/complete - Mark Completed
router.put('/:id/complete', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query('SELECT * FROM appointments WHERE id = $1 FOR UPDATE', [id]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const app = checkRes.rows[0];
    const prevStatus = app.status || 'CONFIRMED';

    const updateRes = await client.query(
      `UPDATE appointments SET status = 'COMPLETED' WHERE id = $1 RETURNING *`,
      [id]
    );

    const updatedApp = updateRes.rows[0];

    await logStatusChange(
      client,
      id,
      prevStatus,
      'COMPLETED',
      req.user.userId,
      req.user.name || 'Staff'
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Appointment marked as COMPLETED',
      data: updatedApp
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error marking appointment completed:', error);
    res.status(500).json({ success: false, error: 'Failed to complete appointment' });
  } finally {
    client.release();
  }
});

// 7. PUT /api/admin/appointments/:id/no-show - Mark No Show
router.put('/:id/no-show', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query('SELECT * FROM appointments WHERE id = $1 FOR UPDATE', [id]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const app = checkRes.rows[0];
    const prevStatus = app.status || 'CONFIRMED';

    const updateRes = await client.query(
      `UPDATE appointments SET status = 'NO_SHOW' WHERE id = $1 RETURNING *`,
      [id]
    );

    const updatedApp = updateRes.rows[0];

    await logStatusChange(
      client,
      id,
      prevStatus,
      'NO_SHOW',
      req.user.userId,
      req.user.name || 'Staff'
    );

    await client.query('COMMIT');

    await sendNoShow(updatedApp);

    res.json({
      success: true,
      message: 'Appointment marked as NO_SHOW',
      data: updatedApp
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error marking appointment no-show:', error);
    res.status(500).json({ success: false, error: 'Failed to mark no-show' });
  } finally {
    client.release();
  }
});

// 8. POST /api/admin/appointments/manual - Manual / Walk-in Booking
router.post('/manual', async (req, res) => {
  const {
    mobile, name, email, age, gender, bloodGroup,
    departmentId, departmentName, doctorId, doctorName,
    preferredDate, preferredTime, reason
  } = req.body;

  if (!mobile || !name || !preferredDate) {
    return res.status(400).json({ success: false, error: 'Mobile, Name, and Date are required for walk-in booking.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Reuse findOrCreatePatient service
    const patient = await findOrCreatePatient('GJS-HOSP-01', {
      name,
      mobile,
      email,
      age: age ? parseInt(age, 10) : null,
      gender,
      bloodGroup
    });

    // Check Doctor Leave/Unavailability conflict
    if (doctorId) {
      const leaveCheck = await client.query(
        `SELECT * FROM doctor_unavailability WHERE doctor_id = $1 AND blocked_date = $2`,
        [doctorId, preferredDate]
      );
      if (leaveCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: `Selected doctor is unavailable on ${preferredDate}.` });
      }
    }

    const appointmentId = generateAppointmentId();
    const tokenNum = await getNextTokenNumber(client, doctorId, preferredDate);

    const insertQuery = `
      INSERT INTO appointments (
        appointment_id, patient_id, patient_name, mobile, email,
        department_id, department_name, doctor_id, doctor_name,
        preferred_date, preferred_time, appointment_date, reason,
        status, token_number, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $10, $12, 'CONFIRMED', $13, NOW())
      RETURNING *;
    `;

    const values = [
      appointmentId,
      patient.id,
      name,
      mobile,
      email || '',
      departmentId ? parseInt(departmentId, 10) : null,
      departmentName || 'General Medicine',
      doctorId ? parseInt(doctorId, 10) : null,
      doctorName || 'On Call Specialist',
      preferredDate,
      preferredTime || '10:00 AM - 11:00 AM',
      reason || 'Walk-in Consultation',
      String(tokenNum)
    ];

    const result = await client.query(insertQuery, values);
    const newAppointment = result.rows[0];

    // Log status change
    await logStatusChange(
      client,
      newAppointment.id,
      null,
      'CONFIRMED',
      req.user.userId,
      req.user.name || 'Staff',
      'Created via Walk-in / Manual Booking'
    );

    await client.query('COMMIT');

    // Trigger confirmation notification
    await sendConfirmation(newAppointment);

    res.status(201).json({
      success: true,
      message: `Walk-in appointment registered successfully! Token #${tokenNum}`,
      data: newAppointment
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating manual appointment:', error);
    res.status(500).json({ success: false, error: 'Failed to create manual appointment' });
  } finally {
    client.release();
  }
});

export default router;
