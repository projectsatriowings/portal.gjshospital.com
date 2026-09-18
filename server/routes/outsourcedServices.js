import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all outsourced services
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM outsourced_services ORDER BY display_order ASC, id ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching outsourced services:', err);
    res.status(500).json({ success: false, error: 'Server error fetching outsourced services' });
  }
});

// POST create outsourced service
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { icon, title, description, display_order, status } = req.body;
    const result = await pool.query(
      `INSERT INTO outsourced_services (icon, title, description, display_order, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        icon || 'Droplet',
        title || 'New Outsourced Service',
        description || '',
        display_order || 0,
        status || 'active'
      ]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error creating outsourced service:', err);
    res.status(500).json({ success: false, error: 'Server error creating outsourced service' });
  }
});

// PUT update outsourced service
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { icon, title, description, display_order, status } = req.body;

    const result = await pool.query(
      `UPDATE outsourced_services
       SET icon = $1, title = $2, description = $3, display_order = $4, status = $5
       WHERE id = $6 RETURNING *`,
      [icon, title, description, display_order, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error updating outsourced service:', err);
    res.status(500).json({ success: false, error: 'Server error updating outsourced service' });
  }
});

// DELETE outsourced service
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM outsourced_services WHERE id = $1', [id]);
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Error deleting outsourced service:', err);
    res.status(500).json({ success: false, error: 'Server error deleting outsourced service' });
  }
});

export default router;
