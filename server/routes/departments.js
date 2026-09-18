import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// MULTER SETUP FOR CMS IMAGE UPLOADS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'departments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `dept-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/departments/upload-image - Upload hero/overview/og image
router.post('/upload-image', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }
  const imageUrl = `/uploads/departments/${req.file.filename}`;
  res.json({ success: true, image_url: imageUrl });
});

// GET /api/departments - Fetch all published departments with live doctor count
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.*,
        COALESCE(
          (
            SELECT COUNT(*) 
            FROM doctors doc 
            WHERE LOWER(doc.specialty) LIKE LOWER('%' || d.name || '%')
               OR (LOWER(d.name) LIKE '%pediatric%' AND LOWER(doc.specialty) LIKE '%paediatric%')
               OR (LOWER(d.name) LIKE '%gynecology%' AND LOWER(doc.specialty) LIKE '%obg%')
          ), 0
        ) AS doctor_count
      FROM departments d
      ORDER BY d.id ASC
    `);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('Error fetching departments:', error.message);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
});

// GET /api/departments/related/:id - Fetch related departments
router.get('/related/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const numericId = isNaN(id) ? 0 : parseInt(id);
    const result = await pool.query('SELECT * FROM departments WHERE id != $1 ORDER BY id ASC LIMIT 4', [numericId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching related departments:', error.message);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
});

// GET /api/departments/admin/:id - Fetch department for Admin Editor with assigned doctors
router.get('/admin/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM departments WHERE id = $1', [parseInt(id)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const dept = result.rows[0];

    // Fetch all doctors to show assignment list
    const doctorsRes = await pool.query('SELECT id, name, specialty, consults, gender, image_url FROM doctors ORDER BY id ASC');
    const assignedDoctors = doctorsRes.rows.filter(d => 
      d.specialty.toLowerCase().includes(dept.name.toLowerCase()) ||
      (dept.name.toLowerCase().includes('pediatric') && d.specialty.toLowerCase().includes('paediatric'))
    );

    dept.assigned_doctors = assignedDoctors;
    dept.all_doctors = doctorsRes.rows;
    dept.doctor_count = assignedDoctors.length;

    res.json({ success: true, data: dept });
  } catch (error) {
    console.error('Error fetching admin department:', error.message);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
});

// PUT /api/departments/admin/:id - Save Draft Data
router.put('/admin/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  const { id } = req.params;
  const draftPayload = req.body;

  try {
    const result = await pool.query(`
      UPDATE departments
      SET 
        draft_data = $1,
        publish_status = 'draft'
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(draftPayload), parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.json({ success: true, message: 'Department draft saved successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error saving admin department draft:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save draft' });
  }
});

// POST /api/departments/admin/:id/publish - Publish Draft Data to Live Page
router.post('/admin/:id/publish', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  const { id } = req.params;
  const publishPayload = req.body;

  try {
    const {
      name, slug, short_description, full_description, icon, color_theme, status,
      hero, overview, stats, treatments, facilities, why_choose, faqs, cta, seo
    } = publishPayload;

    const result = await pool.query(`
      UPDATE departments
      SET 
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        short_description = COALESCE($3, short_description),
        full_description = COALESCE($4, full_description),
        icon = COALESCE($5, icon),
        color_theme = COALESCE($6, color_theme),
        status = COALESCE($7, status),
        hero = $8,
        overview = $9,
        stats = $10,
        treatments = $11,
        facilities = $12,
        why_choose = $13,
        faqs = $14,
        cta = $15,
        seo = $16,
        publish_status = 'published',
        draft_data = $17
      WHERE id = $18
      RETURNING *
    `, [
      name, slug, short_description, full_description, icon, color_theme, status || 'active',
      JSON.stringify(hero || {}),
      JSON.stringify(overview || {}),
      JSON.stringify(stats || {}),
      JSON.stringify(treatments || {}),
      JSON.stringify(facilities || {}),
      JSON.stringify(why_choose || {}),
      JSON.stringify(faqs || {}),
      JSON.stringify(cta || {}),
      JSON.stringify(seo || {}),
      JSON.stringify(publishPayload),
      parseInt(id)
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.json({ success: true, message: 'Department published successfully!', data: result.rows[0] });
  } catch (error) {
    console.error('Error publishing department:', error.message);
    res.status(500).json({ success: false, message: 'Failed to publish department' });
  }
});

// GET /api/departments/:idOrSlug - Fetch single department detail for public site
router.get('/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  const isPreview = req.query.preview === 'true';

  try {
    let query;
    let values;

    if (!isNaN(idOrSlug)) {
      query = 'SELECT * FROM departments WHERE id = $1';
      values = [parseInt(idOrSlug)];
    } else {
      query = 'SELECT * FROM departments WHERE LOWER(slug) = $1 OR LOWER(name) LIKE $2';
      values = [idOrSlug.toLowerCase(), `%${idOrSlug.toLowerCase()}%`];
    }

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    let dept = result.rows[0];

    // Hide draft department pages from the public unless in preview mode
    if (dept.publish_status !== 'published' && !isPreview) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // If preview=true and draft_data exists, merge draft data into payload
    if (isPreview && dept.draft_data && Object.keys(dept.draft_data).length > 0) {
      dept = { ...dept, ...dept.draft_data };
    }

    // Calculate live doctor count for this department
    const countRes = await pool.query(`
      SELECT COUNT(*) AS count 
      FROM doctors doc 
      WHERE LOWER(doc.specialty) LIKE LOWER('%' || $1 || '%')
         OR (LOWER($1) LIKE '%pediatric%' AND LOWER(doc.specialty) LIKE '%paediatric%')
    `, [dept.name]);

    dept.doctor_count = parseInt(countRes.rows[0].count) || 0;

    res.json({ success: true, data: dept });
  } catch (error) {
    console.error('Error fetching department detail:', error.message);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
});

// POST /api/departments - Create new department
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  const { name, slug, short_description, icon } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Department name is required' });
  }

  let deptSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    const checkSlug = await pool.query('SELECT id FROM departments WHERE slug = $1', [deptSlug]);
    if (checkSlug.rows.length > 0) {
      deptSlug = `${deptSlug}-${Date.now()}`;
    }

    const result = await pool.query(`
      INSERT INTO departments (
        name, slug, short_description, icon, publish_status, status,
        hero, overview, stats, treatments, facilities, why_choose, faqs, cta, seo
      )
      VALUES ($1, $2, $3, $4, 'draft', 'active', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}', '{}')
      RETURNING *
    `, [name, deptSlug, short_description || 'New clinical department specialization', icon || 'Activity']);

    res.status(201).json({ success: true, message: 'Department created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating department:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create department: ' + error.message });
  }
});

// DELETE /api/departments/:id - Delete department
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
});

export default router;
