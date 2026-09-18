import dns from 'node:dns';
// Prioritize IPv4 DNS lookups to avoid ETIMEDOUT on IPv6 addresses
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { pool } from './config/db.js';
import doctorsRoutes, { ensureDoctorColumnsExist } from './routes/doctors.js';
import appointmentsRoutes from './routes/appointments.js';
import enquiriesRoutes from './routes/enquiries.js';
import departmentsRoutes from './routes/departments.js';
import healthPackagesRoutes from './routes/healthPackages.js';
import blogsRoutes from './routes/blogs.js';
import contactMessagesRoutes from './routes/contactMessages.js';
import contentRoutes from './routes/content.js';
import outsourcedServicesRoutes from './routes/outsourcedServices.js';
import facilityServicesRoutes from './routes/facilityServices.js';
import infrastructureServicesRoutes from './routes/infrastructureServices.js';
import accreditationRoutes from './routes/accreditations.js';
import adminAuthRoutes from './routes/adminAuth.js';
import adminPatientsRoutes from './routes/adminPatients.js';
import adminAppointmentsRoutes from './routes/adminAppointments.js';
import doctorDashboardRoutes from './routes/doctorDashboard.js';
import adminBillsRoutes from './routes/adminBills.js';
import hospitalSettingsRoutes from './routes/hospitalSettings.js';
import adminMedicinesRoutes from './routes/adminMedicines.js';
import adminReportsRoutes from './routes/adminReports.js';
import adminIPDRoutes from './routes/adminIPD.js';
import cron from 'node-cron';



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve uploaded report files & doctor photos statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes Registration
app.use('/admin/auth', adminAuthRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/patients', adminPatientsRoutes);
app.use('/api/admin/appointments', adminAppointmentsRoutes);
app.use('/api/admin/bills', adminBillsRoutes);
app.use('/api/admin/settings/hospital', hospitalSettingsRoutes);
app.use('/api/admin/medicines', adminMedicinesRoutes);
// Alias /api/admin/pharmacy/* → /api/admin/medicines/* by rewriting the URL
app.use('/api/admin/pharmacy', (req, res, next) => {
  req.url = req.url; // Keep sub-path intact
  next();
}, adminMedicinesRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/ipd', adminIPDRoutes);
app.use('/api/doctor-dashboard', doctorDashboardRoutes);
app.use('/api/doctor', doctorDashboardRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/health-packages', healthPackagesRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/contact-messages', contactMessagesRoutes);
app.use('/api/enquiries', enquiriesRoutes);
app.use('/api/outsourced-services', outsourcedServicesRoutes);
app.use('/api/facility-services', facilityServicesRoutes);
app.use('/api/infrastructure-services', infrastructureServicesRoutes);
app.use('/api/accreditations', accreditationRoutes);
app.use('/api', contentRoutes); // /api/testimonials, /api/banners, /api/partners, /api/gallery

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'G.J.S Hospital API server is running' });
});

// ─── OPTIONAL ALL-IN-ONE SUBDOMAIN SERVING (Slash Method) ─────────
// 1. Serve Admin Portal at /admin (if admin/dist is present)
const adminDist = path.join(process.cwd(), '../admin/dist');
const adminLocalDist = path.join(process.cwd(), 'admin/dist');
const adminPathToUse = fs.existsSync(adminDist) ? adminDist : (fs.existsSync(adminLocalDist) ? adminLocalDist : null);

if (adminPathToUse) {
  app.use('/admin', express.static(adminPathToUse));
  app.get(['/admin', '/admin/*'], (req, res) => {
    res.sendFile(path.join(adminPathToUse, 'index.html'));
  });
}

// 2. Serve Client Portal at / (if client/dist is present)
const clientDist = path.join(process.cwd(), '../client/dist');
const clientLocalDist = path.join(process.cwd(), 'client/dist');
const clientPathToUse = fs.existsSync(clientDist) ? clientDist : (fs.existsSync(clientLocalDist) ? clientLocalDist : null);

if (clientPathToUse) {
  app.use(express.static(clientPathToUse));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin/auth') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientPathToUse, 'index.html'));
  });
}

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  try {
    const dbRes = await pool.query('SELECT NOW()');
    console.log(`⚡ Connected to Neon Cloud PostgreSQL Database! DB Time: ${dbRes.rows[0].now}`);
    await ensureDoctorColumnsExist();
  } catch (err) {
    console.error('❌ Could not connect to Neon Cloud Database:', err.message);
  }

  // IPD Daily Room Charge Cron — runs at 00:05 AM daily
  cron.schedule('5 0 * * *', async () => {
    console.log('⏰ [CRON] Running daily IPD room charge job...');
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const resAdmissions = await client.query(`
          SELECT a.id as admission_id, a.bill_id, a.admission_date, w.daily_rate, w.name as ward_name
          FROM admissions a
          JOIN beds b ON a.bed_id = b.id
          JOIN wards w ON b.ward_id = w.id
          WHERE a.status = 'ADMITTED'
        `);
        
        for (const adm of resAdmissions.rows) {
          const today = new Date();
          const admDate = new Date(adm.admission_date);
          const diffTime = Math.abs(today - admDate);
          const dayNum = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          await client.query(`
            INSERT INTO bill_items (bill_id, category, description, amount, quantity, is_confirmed)
            VALUES ($1, 'ROOM_CHARGE', $2, $3, 1, true)
          `, [adm.bill_id, `Room Charge - ${adm.ward_name} (Day ${dayNum})`, adm.daily_rate]);
          
          await client.query(`
            UPDATE bills
            SET total_amount = (SELECT COALESCE(SUM(amount * quantity), 0) FROM bill_items WHERE bill_id = $1 AND is_confirmed = true)
            WHERE id = $1
          `, [adm.bill_id]);
        }
        await client.query('COMMIT');
        console.log(`✅ [CRON] Added daily room charges for ${resAdmissions.rowCount} active admissions.`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('❌ [CRON] Daily room charge error:', err);
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`👉 Kill the old process and re-run 'npm run dev'.\n`);
    process.exit(1); // Actually exit so node --watch doesn't retry forever
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

// Trigger watch reload
