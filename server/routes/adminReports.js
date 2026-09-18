import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { generateRevenueReportPdf } from '../services/pdfService.js';
import { pool } from '../config/db.js';

const router = express.Router();

// Protect all revenue report endpoints strictly for SUPER_ADMIN and HOSPITAL_ADMIN ONLY.
// ACCOUNTANT, RECEPTIONIST, and PHARMACIST are EXPLICITLY REJECTED with 403 Forbidden.
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'));

// Helper to compute period dates & SQL conditions
function getPeriodDetails(periodKey) {
  let days = 30;
  let label = '1 Month (Past 30 Days)';

  if (periodKey === '3m') {
    days = 90;
    label = '3 Months (Quarterly / 90 Days)';
  } else if (periodKey === '6m') {
    days = 180;
    label = '6 Months (Semi-Annual / 180 Days)';
  } else if (periodKey === '1y') {
    days = 365;
    label = '1 Year (Annual / 365 Days)';
  }

  return { days, label };
}

// 1. GET /api/admin/reports/revenue - Financial Revenue Audit Data
router.get('/revenue', async (req, res) => {
  try {
    const periodKey = (req.query.period || '1m').toLowerCase();
    const { days, label } = getPeriodDetails(periodKey);

    // Fetch Total Paid Revenue & Bill Count for selected period
    const mainRes = await pool.query(
      `SELECT 
         COALESCE(SUM(paid_amount), 0.00) as total_revenue,
         COUNT(*) as paid_bills_count,
         COALESCE(AVG(paid_amount), 0.00) as average_bill_amount
       FROM bills
       WHERE status IN ('PAID', 'PARTIALLY_PAID')
         AND created_at >= NOW() - INTERVAL '1 day' * $1`,
      [days]
    );

    const mainData = mainRes.rows[0];

    // Fetch Category Breakdown (CONSULTATION, PHARMACY, LAB, OTHER)
    const catRes = await pool.query(
      `SELECT bi.category, COALESCE(SUM(bi.amount * bi.quantity), 0.00) as amount
       FROM bill_items bi
       JOIN bills b ON bi.bill_id = b.id
       WHERE b.status IN ('PAID', 'PARTIALLY_PAID')
         AND b.created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY bi.category
       ORDER BY amount DESC`,
      [days]
    );

    // Fetch Payment Method Breakdown (CASH, UPI, CARD)
    const payRes = await pool.query(
      `SELECT COALESCE(payment_method, 'CASH') as method, COALESCE(SUM(paid_amount), 0.00) as amount
       FROM bills
       WHERE status IN ('PAID', 'PARTIALLY_PAID')
         AND created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY payment_method
       ORDER BY amount DESC`,
      [days]
    );

    res.json({
      success: true,
      period: periodKey,
      periodLabel: label,
      data: {
        total_revenue: parseFloat(mainData.total_revenue),
        paid_bills_count: parseInt(mainData.paid_bills_count, 10),
        average_bill_amount: parseFloat(mainData.average_bill_amount),
        category_breakdown: catRes.rows.map(r => ({ category: r.category, amount: parseFloat(r.amount) })),
        payment_method_breakdown: payRes.rows.map(r => ({ method: r.method, amount: parseFloat(r.amount) }))
      }
    });
  } catch (err) {
    console.error('Error fetching revenue report:', err);
    res.status(500).json({ success: false, error: 'Failed to generate revenue report.' });
  }
});

// 2. GET /api/admin/reports/revenue/pdf - Stream/Download Revenue PDF Report
router.get('/revenue/pdf', async (req, res) => {
  try {
    const periodKey = (req.query.period || '1m').toLowerCase();
    const { days, label } = getPeriodDetails(periodKey);

    const mainRes = await pool.query(
      `SELECT 
         COALESCE(SUM(paid_amount), 0.00) as total_revenue,
         COUNT(*) as paid_bills_count,
         COALESCE(AVG(paid_amount), 0.00) as average_bill_amount
       FROM bills
       WHERE status IN ('PAID', 'PARTIALLY_PAID')
         AND created_at >= NOW() - INTERVAL '1 day' * $1`,
      [days]
    );

    const catRes = await pool.query(
      `SELECT bi.category, COALESCE(SUM(bi.amount * bi.quantity), 0.00) as amount
       FROM bill_items bi
       JOIN bills b ON bi.bill_id = b.id
       WHERE b.status IN ('PAID', 'PARTIALLY_PAID')
         AND b.created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY bi.category`,
      [days]
    );

    const payRes = await pool.query(
      `SELECT COALESCE(payment_method, 'CASH') as method, COALESCE(SUM(paid_amount), 0.00) as amount
       FROM bills
       WHERE status IN ('PAID', 'PARTIALLY_PAID')
         AND created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY payment_method`,
      [days]
    );

    const reportData = {
      total_revenue: parseFloat(mainRes.rows[0].total_revenue),
      paid_bills_count: parseInt(mainRes.rows[0].paid_bills_count, 10),
      average_bill_amount: parseFloat(mainRes.rows[0].average_bill_amount),
      category_breakdown: catRes.rows.map(r => ({ category: r.category, amount: parseFloat(r.amount) })),
      payment_method_breakdown: payRes.rows.map(r => ({ method: r.method, amount: parseFloat(r.amount) }))
    };

    const pdfUrl = await generateRevenueReportPdf(reportData, label);
    res.json({ success: true, pdfUrl });
  } catch (err) {
    console.error('Error generating revenue PDF report:', err);
    res.status(500).json({ success: false, error: 'Failed to generate revenue PDF report.' });
  }
});

// 3. GET /api/admin/reports/reminder - Get Scheduled Revenue Audit Date & Reminder Alert Status
router.get('/reminder', async (req, res) => {
  try {
    const settingRes = await pool.query(`SELECT revenue_reminder_date FROM hospital_settings WHERE hospital_id = 'GJS-HOSP-01' LIMIT 1`);
    const reminderDate = settingRes.rows[0]?.revenue_reminder_date || null;

    let isReminderActive = false;
    let daysRemaining = null;

    if (reminderDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const auditDate = new Date(reminderDate);
      auditDate.setHours(0, 0, 0, 0);

      const diffTime = auditDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Trigger reminder 1 day before selected date (or on selected date)
      if (daysRemaining === 1 || daysRemaining === 0) {
        isReminderActive = true;
      }
    }

    res.json({
      success: true,
      data: {
        reminderDate,
        daysRemaining,
        isReminderActive
      }
    });
  } catch (err) {
    console.error('Error fetching revenue reminder:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch revenue reminder.' });
  }
});

// 4. POST /api/admin/reports/reminder - Set Scheduled Revenue Audit Date (Admin Selected)
router.post('/reminder', async (req, res) => {
  try {
    const { reminderDate } = req.body;
    if (!reminderDate) {
      return res.status(400).json({ success: false, error: 'Target audit date is required.' });
    }

    // Ensure revenue_reminder_date column exists in hospital_settings
    await pool.query(`ALTER TABLE hospital_settings ADD COLUMN IF NOT EXISTS revenue_reminder_date DATE`);

    await pool.query(
      `UPDATE hospital_settings SET revenue_reminder_date = $1 WHERE hospital_id = 'GJS-HOSP-01'`,
      [reminderDate]
    );

    res.json({
      success: true,
      message: 'Revenue audit reminder date set successfully!',
      reminderDate
    });
  } catch (err) {
    console.error('Error setting revenue reminder date:', err);
    res.status(500).json({ success: false, error: 'Failed to save revenue reminder date.' });
  }
});

// 5. GET /api/admin/reports/monthly-reports - Past Auto-Generated Reports
router.get('/monthly-reports', async (req, res) => {
  try {
    const reportsRes = await pool.query(
      `SELECT 
         TO_CHAR(created_at, 'YYYY-MM') as month_key,
         TO_CHAR(created_at, 'Month YYYY') as month_name,
         COALESCE(SUM(paid_amount), 0.00) as total_revenue,
         COUNT(*) as total_bills
       FROM bills
       WHERE status IN ('PAID', 'PARTIALLY_PAID')
       GROUP BY TO_CHAR(created_at, 'YYYY-MM'), TO_CHAR(created_at, 'Month YYYY')
       ORDER BY month_key DESC`
    );

    res.json({
      success: true,
      count: reportsRes.rows.length,
      data: reportsRes.rows.map(r => ({
        month_key: r.month_key,
        month_name: r.month_name.trim(),
        total_revenue: parseFloat(r.total_revenue),
        total_bills: parseInt(r.total_bills, 10)
      }))
    });
  } catch (err) {
    console.error('Error fetching monthly reports:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch monthly reports.' });
  }
});

export default router;
