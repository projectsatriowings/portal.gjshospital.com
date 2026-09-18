import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads/doctors directory exists
const doctorUploadsDir = path.join(__dirname, '../uploads/doctors');
if (!fs.existsSync(doctorUploadsDir)) {
  fs.mkdirSync(doctorUploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, doctorUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'doc-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Ensure image_url and dynamic fields exist in database
export const ensureDoctorColumnsExist = async () => {
  try {
    await pool.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS image_url TEXT;`);
    await pool.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2) DEFAULT 500.00;`);
    await pool.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 5;`);
    await pool.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS languages VARCHAR(255) DEFAULT 'English, Tamil';`);
    await pool.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS availability VARCHAR(255) DEFAULT 'Mon - Sat (9 AM - 4 PM)';`);
  } catch (err) {
    console.error('Error ensuring doctor columns exist:', err.message);
  }
};

// POST /api/doctors/upload-image - Upload Doctor Photo
router.post('/upload-image', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), upload.single('doctor_image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }
  const imageUrl = `/uploads/doctors/${req.file.filename}`;
  res.json({ success: true, message: 'Image uploaded successfully', image_url: imageUrl });
});

// GET /api/doctors - Fetch doctors with search, department, gender filters
router.get('/', async (req, res) => {
  const { department, search, gender } = req.query;

  try {
    let query = `SELECT d.*, u.email AS login_email FROM doctors d LEFT JOIN users u ON d.user_id = u.id WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    // Filter by Search
    if (search && search.trim() !== '') {
      query += ` AND (LOWER(d.name) LIKE $${paramIndex} OR LOWER(d.specialty) LIKE $${paramIndex})`;
      values.push(`%${search.trim().toLowerCase()}%`);
      paramIndex += 1;
    }

    // Filter by Department / Specialty
    if (department && department.toLowerCase() !== 'all') {
      const deptLower = department.toLowerCase();
      if (deptLower === 'pediatrics' || deptLower === 'paediatrics') {
        query += ` AND (LOWER(d.specialty) LIKE $${paramIndex} OR LOWER(d.specialty) LIKE $${paramIndex + 1} OR LOWER(d.specialty) LIKE $${paramIndex + 2})`;
        values.push('%pediatric%', '%paediatric%', '%child care%');
        paramIndex += 3;
      } else if (deptLower === 'gynecology' || deptLower === 'gynaecology') {
        query += ` AND (LOWER(d.specialty) LIKE $${paramIndex} OR LOWER(d.specialty) LIKE $${paramIndex + 1} OR LOWER(d.specialty) LIKE $${paramIndex + 2})`;
        values.push('%gynecolog%', '%gynaecolog%', '%obg%');
        paramIndex += 3;
      } else {
        query += ` AND LOWER(d.specialty) LIKE $${paramIndex}`;
        values.push(`%${deptLower}%`);
        paramIndex += 1;
      }
    }

    // Filter by Gender
    if (gender && gender.toLowerCase() !== 'all') {
      query += ` AND LOWER(d.gender) = $${paramIndex}`;
      values.push(gender.toLowerCase());
      paramIndex += 1;
    }

    query += ` ORDER BY d.id ASC`;

    const result = await pool.query(query, values);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('Error fetching doctors:', error.message);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
});

// GET /api/doctors/:id - Fetch single doctor by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT d.*, u.email AS login_email FROM doctors d LEFT JOIN users u ON d.user_id = u.id WHERE d.id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching doctor details:', error.message);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
});

// POST /api/doctors - Add a new doctor (supports image_url, consultation_fee, experience_years, languages, availability)
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  const { name, specialty, consults, gender, status, image_url, consultation_fee, experience_years, languages, availability } = req.body;
  if (!name || !specialty) {
    return res.status(400).json({ success: false, message: 'Name and specialty are required' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO doctors (name, specialty, consults, gender, status, image_url, consultation_fee, experience_years, languages, availability)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      name, 
      specialty, 
      consults || '', 
      gender || 'male', 
      status || 'active', 
      image_url || null,
      consultation_fee || '500.00',
      experience_years || 5,
      languages || 'English, Tamil',
      availability || 'Mon - Sat (9 AM - 4 PM)'
    ]);

    res.status(201).json({ success: true, message: 'Doctor added successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error adding doctor:', error.message);
    res.status(500).json({ success: false, message: 'Failed to add doctor' });
  }
});

// PUT /api/doctors/:id - Update doctor (supports image_url, consultation_fee, experience_years, languages, availability)
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { name, specialty, consults, gender, status, image_url, consultation_fee, experience_years, languages, availability } = req.body;

  try {
    const result = await pool.query(`
      UPDATE doctors
      SET 
        name = COALESCE($1, name),
        specialty = COALESCE($2, specialty),
        consults = COALESCE($3, consults),
        gender = COALESCE($4, gender),
        status = COALESCE($5, status),
        image_url = COALESCE($6, image_url),
        consultation_fee = COALESCE($7, consultation_fee),
        experience_years = COALESCE($8, experience_years),
        languages = COALESCE($9, languages),
        availability = COALESCE($10, availability)
      WHERE id = $11
      RETURNING *
    `, [name, specialty, consults, gender, status, image_url, consultation_fee, experience_years, languages, availability, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, message: 'Doctor updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating doctor:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update doctor' });
  }
});

// DELETE /api/doctors/:id - Delete doctor
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM doctors WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete doctor' });
  }
});

// POST /api/doctors/:id/create-login - Create/Link login account for a Doctor
router.post('/:id/create-login', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    // 1. Verify doctor exists
    const docRes = await pool.query('SELECT * FROM doctors WHERE id = $1', [id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found.' });
    }
    const doc = docRes.rows[0];

    // 2. Hash password & create user with role 'DOCTOR'
    const passwordHash = await bcrypt.hash(password, 10);
    const userRes = await pool.query(
      `INSERT INTO users (hospital_id, name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET password_hash = $4, role = $5, status = $6
       RETURNING id`,
      ['GJS-HOSP-01', doc.name, email.trim().toLowerCase(), passwordHash, 'DOCTOR', 'active']
    );

    const userId = userRes.rows[0].id;

    // 3. Link doctor to user_id
    await pool.query('UPDATE doctors SET user_id = $1 WHERE id = $2', [userId, id]);

    res.json({
      success: true,
      message: `Login access created successfully for ${doc.name}!`,
      loginEmail: email.trim().toLowerCase()
    });
  } catch (err) {
    console.error('Error creating doctor login:', err);
    res.status(500).json({ success: false, error: 'Failed to create doctor login access.' });
  }
});

export default router;
