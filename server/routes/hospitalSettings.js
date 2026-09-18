import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

// 1. GET /api/admin/settings/hospital - Read Hospital Settings & Language Preference
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM hospital_settings WHERE hospital_id = 'GJS-HOSP-01' LIMIT 1`);
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          hospital_id: 'GJS-HOSP-01',
          hospital_name: 'G.J.S Multi-Speciality Hospital',
          phone: '+91 94431 23456',
          address: '123 Hospital Road, City Center',
          language_preference: 'en'
        }
      });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching hospital settings:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch hospital settings' });
  }
});

// 2. PUT /api/admin/settings/hospital - Update Hospital Settings & Language Preference (SUPER_ADMIN / HOSPITAL_ADMIN)
router.put('/', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const { hospital_name, phone, address, language_preference } = req.body;

    const result = await pool.query(
      `INSERT INTO hospital_settings (hospital_id, hospital_name, phone, address, language_preference, updated_at)
       VALUES ('GJS-HOSP-01', $1, $2, $3, $4, NOW())
       ON CONFLICT (hospital_id) DO UPDATE 
       SET hospital_name = COALESCE(EXCLUDED.hospital_name, hospital_settings.hospital_name),
           phone = COALESCE(EXCLUDED.phone, hospital_settings.phone),
           address = COALESCE(EXCLUDED.address, hospital_settings.address),
           language_preference = COALESCE(EXCLUDED.language_preference, hospital_settings.language_preference),
           updated_at = NOW()
       RETURNING *`,
      [hospital_name || 'G.J.S Multi-Speciality Hospital', phone || '+91 94431 23456', address || '123 Hospital Road, City Center', language_preference || 'en']
    );

    res.json({
      success: true,
      message: 'Hospital settings & regional language preference updated successfully!',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating hospital settings:', err);
    res.status(500).json({ success: false, error: 'Failed to update hospital settings' });
  }
});

export default router;
