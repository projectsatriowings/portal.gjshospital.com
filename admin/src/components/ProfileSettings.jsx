import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, Shield, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Building2, Globe } from 'lucide-react';

const ProfileSettings = () => {
  const { user, updateProfile, authFetch } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Hospital Settings State
  const [hospitalLang, setHospitalLang] = useState('en');
  const [langSaving, setLangSaving] = useState(false);
  const [langMsg, setLangMsg] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/settings/hospital')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.language_preference) {
          setHospitalLang(d.data.language_preference);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveLanguage = async (e) => {
    e.preventDefault();
    setLangSaving(true);
    setLangMsg('');
    try {
      const res = await authFetch('http://localhost:5000/api/admin/settings/hospital', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language_preference: hospitalLang })
      });
      const data = await res.json();
      if (data.success) {
        setLangMsg('Hospital regional language preference updated successfully!');
      }
    } catch (err) {
      setLangMsg('Failed to update language setting.');
    } finally {
      setLangSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (form.newPassword) {
      if (!form.currentPassword) {
        setMsg({ type: 'error', text: 'Please enter your current password to set a new password.' });
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setMsg({ type: 'error', text: 'New password and confirm password do not match.' });
        return;
      }
      if (form.newPassword.length < 6) {
        setMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
        return;
      }
    }

    setSaving(true);
    const res = await updateProfile({
      name: form.name,
      email: form.email,
      phone: form.phone,
      currentPassword: form.currentPassword,
      newPassword: form.newPassword
    });

    setSaving(false);

    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Profile settings updated successfully!' });
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } else {
      setMsg({ type: 'error', text: res.error || 'Failed to update profile settings.' });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f2b48', margin: '0 0 6px 0' }}>
          Profile Settings
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Manage your personal staff account details, contact information, and security credentials.
        </p>
      </div>

      {/* ALERT MESSAGE */}
      {msg.text && (
        <div style={{
          background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: msg.type === 'success' ? '#15803d' : '#dc2626',
          padding: '14px 18px',
          borderRadius: '14px',
          fontSize: '14px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px'
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* ACCOUNT SUMMARY BADGE CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #004b7a 0%, #0070c0 100%)',
        borderRadius: '20px',
        padding: '24px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        boxShadow: '0 10px 25px rgba(0, 75, 122, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '22px',
            border: '2px solid rgba(255, 255, 255, 0.4)'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#fff' }}>
              {user?.name || 'Staff User'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#e0f2fe' }}>
              <span>Role: <strong style={{ textTransform: 'uppercase', color: '#7dd3fc' }}>{user?.role}</strong></span>
              <span>•</span>
              <span>Hospital ID: <strong>{user?.hospitalId || 'GJS-HOSP-01'}</strong></span>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '700',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          border: '1px solid rgba(255, 255, 255, 0.25)'
        }}>
          <Shield size={16} />
          <span>Active Staff Account</span>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* PERSONAL DETAILS CARD */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="#00a3c8" />
            <span>Personal Information</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* SECURITY & PASSWORD CHANGE CARD */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="#00a3c8" />
            <span>Change Password (Optional)</span>
          </h3>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>
            Leave blank if you do not wish to change your current password.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #0070c0 0%, #004b7a 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(0, 112, 192, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Save Profile Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
