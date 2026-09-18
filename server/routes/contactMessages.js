import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ success: false, message: 'Name, phone and message are required' });
  }

  try {
    const query = `
      INSERT INTO contact_messages (name, email, phone, message, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    const values = [name, email || '', phone, message];
    const result = await pool.query(query, values);
    res.status(201).json({ success: true, message: 'Contact message sent successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error inserting contact message:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send contact message' });
  }
});

export default router;
