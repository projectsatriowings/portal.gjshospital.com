import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';

let translations = {};

// Load translation JSON files into memory
try {
  const translationsDir = path.join(process.cwd(), 'translations');
  const enFile = path.join(translationsDir, 'en.json');
  const taFile = path.join(translationsDir, 'ta.json');

  if (fs.existsSync(enFile)) {
    translations['en'] = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  }
  if (fs.existsSync(taFile)) {
    translations['ta'] = JSON.parse(fs.readFileSync(taFile, 'utf8'));
  }
} catch (err) {
  console.error('Error loading translation files:', err);
}

// Get active hospital language preference from hospital_settings
export async function getHospitalLanguage() {
  try {
    const res = await pool.query(`SELECT language_preference FROM hospital_settings LIMIT 1`);
    if (res.rows.length > 0 && res.rows[0].language_preference) {
      return res.rows[0].language_preference;
    }
  } catch (err) {
    // Return default English if table doesn't exist yet
  }
  return 'en';
}

// Translate a key using current hospital language or fallback to English
export async function getTranslation(key, overrideLang = null) {
  const lang = overrideLang || await getHospitalLanguage();
  const dict = translations[lang] || translations['en'] || {};
  return dict[key] || (translations['en'] && translations['en'][key]) || key;
}

// Helper to get full translation dictionary for an active language
export async function getTranslationsDict(overrideLang = null) {
  const lang = overrideLang || await getHospitalLanguage();
  return {
    ...(translations['en'] || {}),
    ...(translations[lang] || {})
  };
}
