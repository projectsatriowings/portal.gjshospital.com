import React, { useState, useEffect } from 'react';
import { Pill, Layers, Package, AlertTriangle, AlertCircle, Clock, DollarSign, Calendar, FileText, RefreshCw, Info, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function PharmacyDashboard({ authFetch, user, setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    totalCategories: 0,
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringCount: 0,
    todaySales: 0,
    monthlyRevenue: 0,
    pendingPrescriptions: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch KPI Stats
      const statRes = await authFetch(`${API_BASE_URL}/admin/medicines/dashboard-stats`);
      const statData = await statRes.json();
      if (statData.success) {
        setStats(statData.stats);
      } else {
        setError(statData.error);
      }

      // 2. Fetch Alerts
      const alertRes = await authFetch(`${API_BASE_URL}/admin/medicines/alerts`);
      const alertData = await alertRes.json();
      if (alertData.success) {
        setAlerts(alertData.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Network error fetching dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '80vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Pill size={26} color="#0284c7" />
            <span>Pharmacy Analytics Dashboard</span>
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'block' }}>
            Overview of stock metrics, sales totals, expiring items, and pending prescriptions
          </span>
        </div>

        <div>
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700', marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* CARD 1: TODAY'S SALES */}
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(22,163,74,0.05)' }}>
          <div>
            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#16a34a', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Today's Sales</span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#14532d', margin: '6px 0' }}>₹{parseFloat(stats.todaySales || 0).toFixed(2)}</div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#15803d' }}>Confirmed issues only</span>
          </div>
          <div style={{ background: '#ffffff', color: '#16a34a', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <DollarSign size={24} />
          </div>
        </div>

        {/* CARD 2: MONTHLY REVENUE */}
        <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(37,99,235,0.05)' }}>
          <div>
            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#2563eb', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Monthly Revenue</span>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#1e3a8a', margin: '6px 0' }}>₹{parseFloat(stats.monthlyRevenue || 0).toFixed(2)}</div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8' }}>Current Month</span>
          </div>
          <div style={{ background: '#ffffff', color: '#2563eb', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <Calendar size={24} />
          </div>
        </div>

        {/* CARD 3: PENDING PRESCRIPTIONS */}
        <div style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', border: '1px solid #e9d5ff', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(124,58,237,0.05)' }}>
          <div>
            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#7c3aed', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Pending Queue</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#4c1d95', margin: '6px 0' }}>{stats.pendingPrescriptions}</div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActiveTab('pharmacy_dispensing')}>View Queue →</span>
          </div>
          <div style={{ background: '#ffffff', color: '#7c3aed', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <FileText size={24} />
          </div>
        </div>

      </div>

      {/* KPI METRIC TILES GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#f0fdfa', color: '#0d9488', padding: '10px', borderRadius: '10px' }}><Pill size={22} /></div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Medicines Master</span>
            <strong style={{ fontSize: '18px', color: '#0f172a', display: 'block', marginTop: '2px' }}>{stats.totalMedicines}</strong>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#f5f3ff', color: '#6d28d9', padding: '10px', borderRadius: '10px' }}><Layers size={22} /></div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Categories</span>
            <strong style={{ fontSize: '18px', color: '#0f172a', display: 'block', marginTop: '2px' }}>{stats.totalCategories}</strong>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#f8fafc', color: '#475569', padding: '10px', borderRadius: '10px' }}><Package size={22} /></div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Stock</span>
            <strong style={{ fontSize: '18px', color: '#0f172a', display: 'block', marginTop: '2px' }}>{stats.totalStock}</strong>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#fffbeb', color: '#d97706', padding: '10px', borderRadius: '10px' }}><AlertTriangle size={22} /></div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Low Stock</span>
            <strong style={{ fontSize: '18px', color: '#0f172a', display: 'block', marginTop: '2px' }}>{stats.lowStockCount}</strong>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '10px' }}><AlertCircle size={22} /></div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Out Of Stock</span>
            <strong style={{ fontSize: '18px', color: '#dc2626', display: 'block', marginTop: '2px' }}>{stats.outOfStockCount}</strong>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#fff7ed', color: '#ea580c', padding: '10px', borderRadius: '10px' }}><Clock size={22} /></div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Expiring Soon</span>
            <strong style={{ fontSize: '18px', color: '#ea580c', display: 'block', marginTop: '2px' }}>{stats.expiringCount}</strong>
          </div>
        </div>

      </div>

      {/* DYNAMIC WARNING ALERTS CARD */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Live System Warnings & Expiry Notifications</h3>
        
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Refreshing notifications...</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#16a34a', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600' }}>
            <CheckCircle2 size={18} />
            <span>All stock levels and expirations are currently healthy! No alerts generated.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((al) => (
              <div
                key={al.id}
                style={{
                  background: al.type === 'error' ? '#fef2f2' : '#fffbeb',
                  border: al.type === 'error' ? '1px solid #fecaca' : '1px solid #fef08a',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ color: al.type === 'error' ? '#dc2626' : '#d97706', display: 'flex', alignItems: 'center' }}>
                  {al.type === 'error' ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: al.type === 'error' ? '#991b1b' : '#92400e', flex: 1 }}>
                  {al.text}
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{al.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
