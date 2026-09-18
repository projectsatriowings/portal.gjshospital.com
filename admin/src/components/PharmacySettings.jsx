import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PharmacySettings({ authFetch, user }) {
  const [reorderLevel, setReorderLevel] = useState(10);
  const [expiryThreshold, setExpiryThreshold] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await authFetch('http://localhost:5000/api/admin/medicines/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setReorderLevel(data.data.default_reorder_level || 10);
        setExpiryThreshold(data.data.expiry_alert_threshold || 30);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const res = await authFetch('http://localhost:5000/api/admin/medicines/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_reorder_level: parseInt(reorderLevel, 10),
          expiry_alert_threshold: parseInt(expiryThreshold, 10)
        })
      });

      const data = await res.json();
      if (data.success) {
        setMsg('✅ Settings updated successfully!');
        fetchSettings();
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(`⚠️ ${data.error || 'Failed to update settings.'}`);
      }
    } catch (err) {
      console.error(err);
      setMsg('⚠️ Network error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  // Guard against non-admin roles accessing settings directly
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN';

  if (!isAdmin) {
    return (
      <div style={{ padding: '24px', background: '#f8fafc', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '30px', maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <ShieldAlert size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Access Denied</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
            Pharmacy configurations and warning thresholds can only be changed by authorized Hospital Administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '80vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={26} color="#475569" />
            <span>Pharmacy Settings</span>
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'block' }}>
            Configure default thresholds and warning indicators for inventory management
          </span>
        </div>
      </div>

      {msg && (
        <div style={{ background: msg.includes('⚠️') ? '#fef2f2' : '#f0fdf4', color: msg.includes('⚠️') ? '#dc2626' : '#15803d', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700', marginBottom: '24px', border: msg.includes('⚠️') ? '1px solid #fee2e2' : '1px solid #dcfce7' }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading settings...</div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '28px', maxWidth: '580px' }}>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                Default Reorder Level (Units)
              </label>
              <input
                type="number"
                min="1"
                required
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Newly created medicines will default to this safety stock level before triggering a low-stock alert.
              </span>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                Expiry Alert Threshold (Days)
              </label>
              <input
                type="number"
                min="7"
                required
                value={expiryThreshold}
                onChange={(e) => setExpiryThreshold(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Number of days prior to expiration that an active stock batch will trigger warning notifications in the dashboard.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
}
