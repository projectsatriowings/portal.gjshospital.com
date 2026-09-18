import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

router.get('/testimonials', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials ORDER BY id ASC');
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
});

router.get('/banners', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, title: "Dedicated Experts. Exceptional Care", subtitle: "Delivering trusted, compassionate, and advanced medical services" }
    ]
  });
});

router.get('/partners', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: "Star Health Insurance" },
      { id: 2, name: "HDFC ERGO" },
      { id: 3, name: "ICICI Lombard" },
      { id: 4, name: "Bajaj Allianz" },
      { id: 5, name: "Vidal Health TPA" }
    ]
  });
});

router.get('/gallery', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, title: "Operation Suite", image_url: "/assets/hospital2-BqdDMbQU.gif" },
      { id: 2, title: "Diagnostic Center", image_url: "/assets/scan2-CO6GxBsG.gif" },
      { id: 3, title: "Pharmacy", image_url: "/assets/pharmacy-Cli0N9M-.webp" }
    ]
  });
});

export default router;
