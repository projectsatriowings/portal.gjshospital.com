import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Search, Plus, User, Phone, Mail, FileText, Calendar, 
  ShieldCheck, AlertCircle, Heart, Activity, CheckCircle2, 
  X, Eye, Edit, ChevronRight, UserPlus, FileSpreadsheet, CreditCard
} from 'lucide-react';

import { API_BASE_URL, getFileUrl } from '../config/api';

const PatientsManager = () => {
  const { authFetch } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [activeProfileTab, setActiveProfileTab] = useState('overview');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form, setForm] = useState({
    name: '', mobile: '', email: '', age: '', dob: '', gender: 'Male',
    blood_group: 'A+', address: '', govt_id_number: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    allergies: '', existing_diseases: '',
    insurance_provider: '', insurance_policy_number: ''
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Fetch Patients
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/patients?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [patientBills, setPatientBills] = useState([]);
  const [patientAdmissions, setPatientAdmissions] = useState([]);

  // Fetch Patient Full Details
  const fetchPatientProfile = async (id) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/patients/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedPatient(data.patient);
        setPatientAppointments(data.appointments || []);
        setActiveProfileTab('overview');

        // Fetch Prescriptions
        const pRes = await authFetch(`${API_BASE_URL}/admin/patients/${id}/prescriptions`);
        const pData = await pRes.json();
        if (pData.success) setPatientPrescriptions(pData.data || []);

        // Fetch Bills
        const bRes = await authFetch(`${API_BASE_URL}/admin/patients/${id}/bills`);
        const bData = await bRes.json();
        if (bData.success) setPatientBills(bData.data || []);

        // Fetch Admissions
        const admRes = await authFetch(`${API_BASE_URL}/admin/ipd/admissions/patient/${id}`);
        const admData = await admRes.json();
        if (admData.success) setPatientAdmissions(admData.data || []);
      }
    } catch (err) {
      console.error('Error fetching patient profile:', err);
    }
  };

  // Open Form Modal
  const handleOpenModal = (patient = null) => {
    setMsg({ type: '', text: '' });
    if (patient) {
      setEditingPatient(patient);
      setForm({
        name: patient.name || '',
        mobile: patient.mobile || '',
        email: patient.email || '',
        age: patient.age || '',
        dob: patient.dob ? patient.dob.split('T')[0] : '',
        gender: patient.gender || 'Male',
        blood_group: patient.blood_group || 'A+',
        address: patient.address || '',
        govt_id_number: patient.govt_id_number || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        allergies: patient.allergies || '',
        existing_diseases: patient.existing_diseases || '',
        insurance_provider: patient.insurance_provider || '',
        insurance_policy_number: patient.insurance_policy_number || ''
      });
    } else {
      setEditingPatient(null);
      setForm({
        name: '', mobile: '', email: '', age: '', dob: '', gender: 'Male',
        blood_group: 'A+', address: '', govt_id_number: '',
        emergency_contact_name: '', emergency_contact_phone: '',
        allergies: '', existing_diseases: '',
        insurance_provider: '', insurance_policy_number: ''
      });
    }
    setShowModal(true);
  };

  // Handle Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!form.name || !form.mobile) {
      setMsg({ type: 'error', text: 'Patient Name and Mobile Number are required.' });
      return;
    }

    setSaving(true);
    try {
      const url = editingPatient 
        ? `${API_BASE_URL}/admin/patients/${editingPatient.id}`
        : `${API_BASE_URL}/admin/patients`;
      
      const method = editingPatient ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchPatients();
        if (editingPatient && selectedPatient?.id === editingPatient.id) {
          setSelectedPatient(data.data);
        }
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to save patient record.' });
      }
    } catch (err) {
      console.error('Error saving patient:', err);
      setMsg({ type: 'error', text: 'Network error saving patient record.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f2b48', margin: '0 0 4px 0' }}>
            Patient Directory & Records
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Universal Health Identifier (UHID) patient records & clinical history
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          style={{
            background: 'linear-gradient(135deg, #0070c0 0%, #004b7a 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 16px rgba(0, 112, 192, 0.25)'
          }}
        >
          <UserPlus size={18} />
          <span>+ Register Patient</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search by Patient Name, Mobile Number, or UHID (e.g. GJS-2026-000001)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#0f172a' }}
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}>
            ×
          </button>
        )}
      </div>

      {/* PATIENTS TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading patient records...
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <Users size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '15px', margin: 0, fontWeight: '600' }}>No patient records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '14px 18px' }}>UHID</th>
                  <th style={{ padding: '14px 18px' }}>Patient Name</th>
                  <th style={{ padding: '14px 18px' }}>Mobile</th>
                  <th style={{ padding: '14px 18px' }}>Age / Gender</th>
                  <th style={{ padding: '14px 18px' }}>Blood Group</th>
                  <th style={{ padding: '14px 18px' }}>Emergency Contact</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        background: '#f0f9ff',
                        color: '#0284c7',
                        border: '1px solid #bae6fd',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '12px',
                        letterSpacing: '0.5px'
                      }}>
                        {p.uhid}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{p.name}</strong>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.email || 'No Email'}</span>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '700', color: '#334155' }}>
                      {p.mobile}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>
                      {p.age ? `${p.age} Yrs` : '-'} / {p.gender || '-'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '11px' }}>
                        {p.blood_group || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '12.5px' }}>
                      {p.emergency_contact_phone ? (
                        <>
                          <strong>{p.emergency_contact_name || 'Contact'}</strong> ({p.emergency_contact_phone})
                        </>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleViewProfile(p.id)}
                          style={{
                            background: '#f0f9ff',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px'
                          }}
                        >
                          <Eye size={14} /> Profile
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenModal(p)}
                          style={{
                            background: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL PATIENT PROFILE VIEW MODAL */}
      {selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '840px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* PROFILE MODAL HEADER */}
            <div style={{ background: 'linear-gradient(135deg, #004b7a 0%, #0070c0 100%)', padding: '24px 28px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px', color: '#fff' }}>
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#fff' }}>
                    {selectedPatient.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#e0f2fe' }}>
                    <span>UHID: <strong>{selectedPatient.uhid}</strong></span>
                    <span>•</span>
                    <span>Mobile: <strong>{selectedPatient.mobile}</strong></span>
                  </div>
                </div>
              </div>

              <button type="button" onClick={() => setSelectedPatient(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* PROFILE TABS */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 28px' }}>
              {['overview', 'appointments', 'admissions', 'prescriptions', 'reports', 'billing'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveProfileTab(tab)}
                  style={{
                    padding: '14px 20px',
                    border: 'none',
                    background: 'none',
                    fontWeight: activeProfileTab === tab ? '800' : '600',
                    color: activeProfileTab === tab ? '#0070c0' : '#64748b',
                    borderBottom: activeProfileTab === tab ? '3px solid #0070c0' : '3px solid transparent',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab === 'overview' && 'Overview'}
                  {tab === 'appointments' && `Appointments (${patientAppointments.length})`}
                  {tab === 'admissions' && 'Admissions'}
                  {tab === 'prescriptions' && 'Prescriptions'}
                  {tab === 'reports' && 'Lab Reports'}
                  {tab === 'billing' && 'Invoices'}
                </button>
              ))}
            </div>

            {/* TAB CONTENT VIEWPORT */}
            <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
              {activeProfileTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>AGE / GENDER</span>
                      <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#0f172a' }}>{selectedPatient.age ? `${selectedPatient.age} Years` : 'N/A'} / {selectedPatient.gender || 'N/A'}</p>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>BLOOD GROUP</span>
                      <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#dc2626' }}>{selectedPatient.blood_group || 'N/A'}</p>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>GOVT ID / AADHAAR</span>
                      <p style={{ margin: '4px 0 0 0', fontWeight: '800', color: '#0f172a' }}>{selectedPatient.govt_id_number || 'N/A'}</p>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f2b48', margin: '0 0 12px 0' }}>Medical History & Allergies</h4>
                    <p style={{ fontSize: '13.5px', color: '#334155', margin: '0 0 8px 0' }}>
                      <strong>Allergies:</strong> {selectedPatient.allergies || 'No known allergies reported.'}
                    </p>
                    <p style={{ fontSize: '13.5px', color: '#334155', margin: 0 }}>
                      <strong>Pre-existing Conditions:</strong> {selectedPatient.existing_diseases || 'None reported.'}
                    </p>
                  </div>

                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f2b48', margin: '0 0 12px 0' }}>Insurance & TPA Coverage</h4>
                    <p style={{ fontSize: '13.5px', color: '#334155', margin: '0 0 6px 0' }}>
                      <strong>Insurance Provider:</strong> {selectedPatient.insurance_provider || 'Self-Pay / Non-Insured'}
                    </p>
                    <p style={{ fontSize: '13.5px', color: '#334155', margin: 0 }}>
                      <strong>Policy / Claim No:</strong> {selectedPatient.insurance_policy_number || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {activeProfileTab === 'appointments' && (
                <div>
                  {patientAppointments.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      No appointment records found for this patient.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {patientAppointments.map((app) => (
                        <div key={app.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                              #{app.appointment_id || app.id}
                            </span>
                            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }}>
                              {app.doctor_name}
                            </h4>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                              {app.department_name} • {new Date(app.appointment_date || app.preferred_date).toLocaleDateString()} ({app.preferred_time})
                            </p>
                          </div>

                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '800',
                            background: app.status === 'Confirmed' ? '#dcfce7' : '#fef3c7',
                            color: app.status === 'Confirmed' ? '#15803d' : '#b45309'
                          }}>
                            {app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === 'admissions' && (
                <div>
                  {patientAdmissions.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      No IPD admission records found for this patient.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {patientAdmissions.map((adm) => (
                        <div key={adm.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                              {adm.ward_name} - Bed {adm.bed_number}
                            </span>
                            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }}>
                              Doctor: {adm.doctor_name || 'N/A'}
                            </h4>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                              Admitted: {new Date(adm.admission_date).toLocaleDateString()} {adm.discharge_date ? `| Discharged: ${new Date(adm.discharge_date).toLocaleDateString()}` : ''}
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '800',
                              background: adm.status === 'ADMITTED' ? '#dcfce7' : adm.status === 'DISCHARGED' ? '#e0f2fe' : '#fef3c7',
                              color: adm.status === 'ADMITTED' ? '#15803d' : adm.status === 'DISCHARGED' ? '#0369a1' : '#b45309'
                            }}>
                              {adm.status}
                            </span>
                            {adm.status === 'DISCHARGED' && adm.discharge_summary_url && (
                              <button
                                type="button"
                                onClick={() => window.open(getFileUrl(adm.discharge_summary_url), '_blank')}
                                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                📄 Discharge Summary
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === 'prescriptions' && (
                <div>
                  {patientPrescriptions.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <FileText size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <p style={{ fontSize: '13.5px', margin: 0 }}>No prescriptions recorded yet for this patient.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {patientPrescriptions.map((pr) => (
                        <div key={pr.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>Doctor: {pr.doctor_name} ({pr.doctor_specialty || 'General Medicine'})</strong>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Date: {new Date(pr.created_at).toLocaleDateString()}</span>
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}><strong>Diagnosis:</strong> {pr.diagnosis}</p>

                          {pr.medicines?.length > 0 && (
                            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px', fontSize: '12.5px' }}>
                              <strong style={{ display: 'block', color: '#0284c7', marginBottom: '4px' }}>Prescribed Medicines:</strong>
                              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                {pr.medicines.map((m, idx) => (
                                  <li key={idx}><strong>{m.name}</strong> — {m.dosage} ({m.duration}) — {m.instructions}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {pr.follow_up_date && (
                            <div style={{ background: '#f0fdf4', color: '#15803d', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
                              🗓️ Follow-up Date: {new Date(pr.follow_up_date).toLocaleDateString()}
                            </div>
                          )}

                          {pr.pdf_url && (
                            <button
                              type="button"
                              onClick={() => window.open(getFileUrl(pr.pdf_url), '_blank')}
                              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              📄 Download Prescription PDF
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === 'billing' && (
                <div>
                  {patientBills.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <CreditCard size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <p style={{ fontSize: '13.5px', margin: 0 }}>No billing invoices created yet for this patient.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {patientBills.map((b) => (
                        <div key={b.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>Invoice #{b.bill_number}</strong>
                            <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>Date: {new Date(b.created_at).toLocaleDateString()} | Doctor: {b.doctor_name || 'General'}</span>
                            <span style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginTop: '4px' }}>
                              Total: ₹{parseFloat(b.total_amount).toFixed(2)} | Paid: ₹{parseFloat(b.paid_amount).toFixed(2)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: '800',
                              background: b.status === 'PAID' ? '#dcfce7' : '#fef3c7',
                              color: b.status === 'PAID' ? '#15803d' : '#b45309'
                            }}>
                              {b.status}
                            </span>
                            {b.pdf_url && (
                              <button
                                type="button"
                                onClick={() => window.open(getFileUrl(b.pdf_url), '_blank')}
                                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                📄 Invoice PDF
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* REGISTER / EDIT PATIENT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '720px', borderRadius: '24px', padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f2b48', margin: 0 }}>
                {editingPatient ? 'Edit Patient Record' : 'Register Walk-in Patient'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {msg.text && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* SECTION 1: PERSONAL INFORMATION */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0070c0', margin: '0 0 12px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                  1. Personal Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Full Name *</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Mobile Number *</label>
                    <input type="text" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Email Address</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Age (Years)</label>
                    <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Gender</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Blood Group</label>
                    <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONTACT & EMERGENCY */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0070c0', margin: '0 0 12px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                  2. Contact & Emergency Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Address</label>
                    <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Emergency Contact Name</label>
                    <input type="text" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Emergency Contact Phone</label>
                    <input type="text" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} />
                  </div>
                </div>
              </div>

              {/* SECTION 3: MEDICAL INFO */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0070c0', margin: '0 0 12px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                  3. Medical Info & History
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Allergies</label>
                    <input type="text" placeholder="e.g. Penicillin, Dust" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Existing Conditions</label>
                    <input type="text" placeholder="e.g. Diabetes, Hypertension" value={form.existing_diseases} onChange={(e) => setForm({ ...form, existing_diseases: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }} />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: '#0070c0', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                  {saving ? 'Saving Patient...' : (editingPatient ? 'Update Patient' : 'Register Patient')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default PatientsManager;
