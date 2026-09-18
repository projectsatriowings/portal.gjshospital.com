import { pool } from '../config/db.js';

export const generateUHID = async (clientOrPool, hospitalId = 'GJS-HOSP-01') => {
  const year = new Date().getFullYear();
  const prefix = `GJS-${year}-`;
  
  // Find highest current sequence number for the current year
  const res = await clientOrPool.query(
    `SELECT uhid FROM patients WHERE uhid LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (res.rows.length > 0) {
    const lastUhid = res.rows[0].uhid;
    const parts = lastUhid.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextNum = lastSeq + 1;
      }
    }
  }

  const seqStr = String(nextNum).padStart(6, '0');
  return `${prefix}${seqStr}`;
};

export const findOrCreatePatient = async (hospitalId = 'GJS-HOSP-01', data = {}) => {
  const client = await pool.connect();
  try {
    const mobile = (data.mobile || data.phone || '').trim();
    const name = (data.name || data.patient_name || 'Anonymous Patient').trim();
    const email = (data.email || '').trim();
    const age = data.age ? parseInt(data.age, 10) : null;
    const gender = data.gender || null;

    if (!mobile) {
      throw new Error('Mobile number is required to find or create patient record.');
    }

    // 1. Check if patient already exists
    const existing = await client.query(
      `SELECT * FROM patients WHERE hospital_id = $1 AND mobile = $2`,
      [hospitalId, mobile]
    );

    if (existing.rows.length > 0) {
      const patient = existing.rows[0];
      // Optionally update name/email/age/gender if missing
      let needsUpdate = false;
      let newName = patient.name;
      let newEmail = patient.email;
      let newAge = patient.age;
      let newGender = patient.gender;

      if (!patient.email && email) { newEmail = email; needsUpdate = true; }
      if (!patient.age && age) { newAge = age; needsUpdate = true; }
      if (!patient.gender && gender) { newGender = gender; needsUpdate = true; }

      if (needsUpdate) {
        const updateRes = await client.query(
          `UPDATE patients SET email = $1, age = $2, gender = $3 WHERE id = $4 RETURNING *`,
          [newEmail, newAge, newGender, patient.id]
        );
        return updateRes.rows[0];
      }

      return patient;
    }

    // 2. Patient not found -> Create new Patient with auto-generated UHID
    const uhid = await generateUHID(client, hospitalId);

    const insertRes = await client.query(
      `INSERT INTO patients (
        hospital_id, uhid, name, mobile, email, age, gender, dob, blood_group, address,
        govt_id_number, emergency_contact_name, emergency_contact_phone,
        allergies, existing_diseases, insurance_provider, insurance_policy_number, photo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        hospitalId,
        uhid,
        name,
        mobile,
        email || null,
        age || null,
        gender || null,
        data.dob || null,
        data.bloodGroup || data.blood_group || null,
        data.address || null,
        data.govtIdNumber || data.govt_id_number || null,
        data.emergencyContactName || data.emergency_contact_name || null,
        data.emergencyContactPhone || data.emergency_contact_phone || null,
        data.allergies || null,
        data.existingDiseases || data.existing_diseases || null,
        data.insuranceProvider || data.insurance_provider || null,
        data.insurancePolicyNumber || data.insurance_policy_number || null,
        data.photoUrl || data.photo_url || null
      ]
    );

    return insertRes.rows[0];
  } finally {
    client.release();
  }
};
