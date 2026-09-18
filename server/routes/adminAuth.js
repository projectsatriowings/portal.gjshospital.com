import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticate } from '../middleware/authMiddleware.js';
import { pool } from '../config/db.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Check your .env file.');
}
const ACCESS_TOKEN_EXPIRY = '15m';

// helper: generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      hospitalId: user.hospital_id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

// 1. POST /admin/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const userRes = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    
    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.'
      });
    }

    const user = userRes.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Your staff account is currently inactive. Please contact system administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Password incorrect.'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save refresh token to database
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        hospitalId: user.hospital_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });

  } catch (err) {
    console.error('Error in /admin/auth/login:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

// 2. POST /admin/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required.'
      });
    }

    const tokenRes = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token. Please log in again.'
      });
    }

    const tokenRow = tokenRes.rows[0];
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [tokenRow.user_id]);

    if (userRes.rows.length === 0 || userRes.rows[0].status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Associated user account is no longer active.'
      });
    }

    const user = userRes.rows[0];
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken: newAccessToken
    });

  } catch (err) {
    console.error('Error in /admin/auth/refresh:', err);
    res.status(500).json({ success: false, error: 'Failed to refresh access token.' });
  }
});

// 3. POST /admin/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Error in /admin/auth/logout:', err);
    res.status(500).json({ success: false, error: 'Failed to log out.' });
  }
});

// 4. GET /admin/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id, hospital_id, name, email, phone, role, status, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const u = userRes.rows[0];
    res.json({
      success: true,
      user: {
        id: u.id,
        hospitalId: u.hospital_id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        createdAt: u.created_at
      }
    });
  } catch (err) {
    console.error('Error in /admin/auth/me:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
});

// 5. PUT /admin/auth/profile (Update staff profile & password)
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, email, currentPassword, newPassword } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }

    // Fetch user
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    const user = userRes.rows[0];

    // Check if email is being changed and if it already exists
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
        [email.trim(), userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Email address is already in use by another staff account.' });
      }
    }

    let updatedPasswordHash = user.password_hash;

    // Password change validation
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'Current password is required to set a new password.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
      }

      updatedPasswordHash = await bcrypt.hash(newPassword, 10);
    }

    const updateRes = await pool.query(
      `UPDATE users
       SET name = $1, phone = $2, email = $3, password_hash = $4
       WHERE id = $5
       RETURNING id, hospital_id, name, email, phone, role, status, created_at`,
      [
        name.trim(),
        phone ? phone.trim() : user.phone,
        email ? email.trim() : user.email,
        updatedPasswordHash,
        userId
      ]
    );

    const updatedUser = updateRes.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser.id,
        hospitalId: updatedUser.hospital_id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });

  } catch (err) {
    console.error('Error in PUT /admin/auth/profile:', err);
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

export default router;
