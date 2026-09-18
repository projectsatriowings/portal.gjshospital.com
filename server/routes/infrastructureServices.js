import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all infrastructure services
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM infrastructure_services ORDER BY display_order ASC, id ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching infrastructure services:', err);
    res.status(500).json({ success: false, error: 'Server error fetching infrastructure services' });
  }
});

// POST create infrastructure service
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { icon, title, description, display_order, status } = req.body;
    const result = await pool.query(
      `INSERT INTO infrastructure_services (icon, title, description, display_order, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        icon || 'Building',
        title || 'New Infrastructure Service',
        description || '',
        display_order || 0,
        status || 'active'
      ]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error creating infrastructure service:', err);
    res.status(500).json({ success: false, error: 'Server error creating infrastructure service' });
  }
});

// PUT update infrastructure service
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { icon, title, description, display_order, status } = req.body;

    const result = await pool.query(
      `UPDATE infrastructure_services
       SET icon = $1, title = $2, description = $3, display_order = $4, status = $5
       WHERE id = $6 RETURNING *`,
      [icon, title, description, display_order, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error updating infrastructure service:', err);
    res.status(500).json({ success: false, error: 'Server error updating infrastructure service' });
  }
});

// DELETE infrastructure service
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM infrastructure_services WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    res.json({ success: true, message: 'Infrastructure service deleted successfully' });
  } catch (err) {
    console.error('Error deleting infrastructure service:', err);
    res.status(500).json({ success: false, error: 'Server error deleting infrastructure service' });
  }
});

export default router;
