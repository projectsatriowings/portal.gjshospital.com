import React, { useState, useEffect } from 'react';
import { X, Search, UserCheck, Calendar, Clock, Stethoscope, Building, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

export default function WalkinAppointmentModal({ isOpen, onClose, onSuccess, doctors = [], departments = [] }) {
  const { authFetch } = useAuth();

  const [searchMobile, setSearchMobile] = useState('');
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientFound, setPatientFound] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    age: '',
    gender: 'Male',
    bloodGroup: '',
    departmentId: '',
    departmentName: '',
    doctorId: '',
    doctorName: '',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: '10:00 AM - 11:00 AM',
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setPatientFound(false);
      setSearchMobile('');
      setFormData({
        name: '',
        mobile: '',
        email: '',
        age: '',
        gender: 'Male',
        bloodGroup: '',
        departmentId: departments[0]?.id || '',
        departmentName: departments[0]?.name || '',
        doctorId: doctors[0]?.id || '',
        doctorName: doctors[0]?.name || '',
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '10:00 AM - 11:00 AM',
        reason: 'Walk-in Consultation'
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Search existing patient by mobile
  const handlePatientSearch = async () => {
    if (!searchMobile.trim()) return;
    setSearchingPatient(true);
    setError('');
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/patients?search=${encodeURIComponent(searchMobile.trim())}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const p = data.data[0];
        setPatientFound(true);
        setFormData(prev => ({
          ...prev,
          name: p.name || '',
          mobile: p.mobile || searchMobile,
          email: p.email || '',
          age: p.age || '',
          gender: p.gender || 'Male',
          bloodGroup: p.blood_group || ''
        }));
      } else {
        setPatientFound(false);
        setFormData(prev => ({ ...prev, mobile: searchMobile }));
      }
    } catch (err) {
      console.error('Error searching patient:', err);
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    const deptObj = departments.find(d => String(d.id) === String(deptId));
    setFormData(prev => ({
      ...prev,
      departmentId: deptId,
      departmentName: deptObj ? deptObj.name : ''
    }));
  };

  const handleDoctorChange = (e) => {
    const docId = e.target.value;
    const docObj = doctors.find(d => String(d.id) === String(docId));
    setFormData(prev => ({
      ...prev,
      doctorId: docId,
      doctorName: docObj ? docObj.name : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.preferredDate) {
      setError('Patient Name, Mobile Number, and Date are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        onSuccess(data.message || 'Walk-in appointment registered!');
        onClose();
      } else {
        setError(data.error || 'Failed to register walk-in appointment.');
      }
    } catch (err) {
      console.error('Error creating manual appointment:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        border: '1px solid #cbd5e1'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #004861 100%)',
          color: '#ffffff',
          borderRadius: '20px 20px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={22} color="#38bdf8" />
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
              + New Walk-in Appointment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', border: '1px solid #fecaca' }}>
              ⚠️ {error}
            </div>
          )}

          {/* SEARCH EXISTING PATIENT */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
              🔍 Search Existing Patient by Mobile Number
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Enter 10-digit mobile number..."
                value={searchMobile}
                onChange={(e) => setSearchMobile(e.target.value)}
                style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={handlePatientSearch}
                disabled={searchingPatient}
                style={{ background: '#0070c0', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                {searchingPatient ? 'Searching...' : 'Search'}
              </button>
            </div>
            {patientFound && (
              <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: '700', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} /> Patient record found! Patient details auto-filled below.
              </div>
            )}
          </div>

          {/* PATIENT DETAILS */}
          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
            1. Patient Information
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Mobile Number *</label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* DOCTOR & CONSULTATION DETAILS */}
          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
            2. Doctor & Schedule Details
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Department</label>
              <select
                value={formData.departmentId}
                onChange={handleDepartmentChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Assign Doctor</label>
              <select
                value={formData.doctorId}
                onChange={handleDoctorChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              >
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty || 'General'})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Date *</label>
              <input
                type="date"
                required
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Time Slot</label>
              <select
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
              >
                <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 01:00 PM">12:00 PM - 01:00 PM</option>
                <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Reason for Visit</label>
            <input
              type="text"
              placeholder="e.g. Fever, Follow-up checkup..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px' }}
            />
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #0070c0 0%, #004861 100%)', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              {loading ? 'Registering...' : 'Confirm Walk-in & Issue Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
