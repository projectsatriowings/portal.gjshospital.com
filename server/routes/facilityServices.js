import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all facility services
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM facility_services ORDER BY display_order ASC, id ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching facility services:', err);
    res.status(500).json({ success: false, error: 'Server error fetching facility services' });
  }
});

// POST create facility service
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { icon, title, description, display_order, status } = req.body;
    const result = await pool.query(
      `INSERT INTO facility_services (icon, title, description, display_order, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        icon || 'Pill',
        title || 'New Facility Service',
        description || '',
        display_order || 0,
        status || 'active'
      ]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error creating facility service:', err);
    res.status(500).json({ success: false, error: 'Server error creating facility service' });
  }
});

// PUT update facility service
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { icon, title, description, display_order, status } = req.body;

    const result = await pool.query(
      `UPDATE facility_services
       SET icon = $1, title = $2, description = $3, display_order = $4, status = $5
       WHERE id = $6 RETURNING *`,
      [icon, title, description, display_order, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error updating facility service:', err);
    res.status(500).json({ success: false, error: 'Server error updating facility service' });
  }
});

// DELETE facility service
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM facility_services WHERE id = $1', [id]);
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Error deleting facility service:', err);
    res.status(500).json({ success: false, error: 'Server error deleting facility service' });
  }
});

export default router;
