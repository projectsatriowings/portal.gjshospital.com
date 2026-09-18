import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/enquiries - Create new contact enquiry in Neon Cloud PostgreSQL
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  try {
    const query = `
      INSERT INTO enquiries (name, email, phone, subject, message, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const values = [name, email || '', phone || '', subject || '', message || ''];
    
    const result = await pool.query(query, values);
    res.status(201).json({ success: true, message: 'Enquiry saved successfully in Neon PostgreSQL', data: result.rows[0] });
  } catch (error) {
    console.error('Error inserting enquiry into Neon DB:', error.message);
    res.status(500).json({ success: false, message: 'Database insert failed' });
  }
});

// GET /api/enquiries - Fetch all enquiries from Neon Cloud PostgreSQL
router.get('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('Error fetching enquiries from Neon DB:', error.message);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
});

export default router;
