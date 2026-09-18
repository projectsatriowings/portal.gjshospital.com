import express from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all accreditations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM accreditations ORDER BY display_order ASC, id ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching accreditations:', err);
    res.status(500).json({ success: false, error: 'Server error fetching accreditations' });
  }
});

// POST create accreditation
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { hospital_id, icon, title, description, display_order, status } = req.body;
    const result = await pool.query(
      `INSERT INTO accreditations (hospital_id, icon, title, description, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        hospital_id || 'GJS',
        icon || 'Award',
        title || 'New Accreditation',
        description || '',
        display_order || 0,
        status || 'active'
      ]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error creating accreditation:', err);
    res.status(500).json({ success: false, error: 'Server error creating accreditation' });
  }
});

// PUT update accreditation
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { hospital_id, icon, title, description, display_order, status } = req.body;

    const result = await pool.query(
      `UPDATE accreditations
       SET hospital_id = $1, icon = $2, title = $3, description = $4, display_order = $5, status = $6
       WHERE id = $7 RETURNING *`,
      [hospital_id || 'GJS', icon, title, description, display_order, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Accreditation not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error updating accreditation:', err);
    res.status(500).json({ success: false, error: 'Server error updating accreditation' });
  }
});

// DELETE accreditation
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM accreditations WHERE id = $1', [id]);
    res.json({ success: true, message: 'Accreditation deleted successfully' });
  } catch (err) {
    console.error('Error deleting accreditation:', err);
    res.status(500).json({ success: false, error: 'Server error deleting accreditation' });
  }
});

export default router;
