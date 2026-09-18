import React, { useState, useEffect } from 'react';
import {
  Calendar, Users, DollarSign, FileText, Activity, Clock, CheckCircle2,
  AlertTriangle, Info, ArrowRight, UserPlus, Stethoscope, Bed, Plus,
  Search, ShieldCheck, ChevronRight, Eye, RefreshCw, BarChart2, PieChart,
  Pill, Layers, Package
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function DashboardOverview({
  authFetch,
  user,
  setActiveTab,
  setSelectedDetailAppointmentId,
  setShowWalkinModal,
  setBillingFilter
}) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointmentsCount: 0,
    todayPatientsCount: 0,
    pendingBillsCount: 0,
    pendingBillsAmount: 0.00,
    opdCompletedCount: 0,
    todayRevenueAmount: 0.00,
    monthlyRevenueAmount: 0.00,
    activeIpdCount: 0,
    totalBedsCount: 0,
    occupiedBedsCount: 0
  });

  const [revenueTrend, setRevenueTrend] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [12000, 19000, 15000, 25000, 22000, 30000, 28000]
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pharmStats, setPharmStats] = useState({
    totalMedicines: 0,
    totalStock: 0,
    lowStockCount: 0,
    expiringCount: 0,
    todaySales: 0,
    monthlyRevenue: 0
  });

  const [appFilter, setAppFilter] = useState('all');
  const [appPage, setAppPage] = useState(1);
  const appsPerPage = 5;

  const [hoveredCard, setHoveredCard] = useState(null);
  const [deptData, setDeptData] = useState([
    { name: 'Cardiology', count: 28, color: '#3b82f6' },
    { name: 'Orthopedics', count: 22, color: '#10b981' },
    { name: 'Pediatrics', count: 18, color: '#8b5cf6' },
    { name: 'Neurology', count: 12, color: '#f59e0b' },
    { name: 'General Medicine', count: 10, color: '#06b6d4' }
  ]);

  // Fetch Live Analytics Data from Backend API
  const fetchDashboardData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      // 1. Fetch dashboard overview stats & revenue trend from backend
      const statsRes = await authFetch(`${API_BASE_URL}/admin/appointments/dashboard-overview-stats`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
        if (statsData.revenueTrend) {
          setRevenueTrend(statsData.revenueTrend);
        }
      }

      // 2. Fetch Appointments for the table list
      const appRes = await authFetch(`${API_BASE_URL}/admin/appointments?limit=100`);
      const appData = await appRes.json();
      if (appData.success && Array.isArray(appData.data)) {
        const liveApps = appData.data.map((a, idx) => ({
          id: a.id,
          token: a.token_number ? `Token #${a.token_number}` : `A-${String(idx + 1).padStart(3, '0')}`,
          patient: a.patient_name || a.name || 'Patient',
          doctor: a.doctor_name || 'Dr. Specialist',
          time: a.preferred_time || a.appointment_time || '09:00 AM',
          status: a.status || 'Pending'
        }));
        setRecentAppointments(liveApps);

        // Aggregate departments OPD count from actual appointments
        const deptCounts = {};
        appData.data.forEach(a => {
          const dept = a.department_name || a.department || 'General Medicine';
          deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#f97316'];
        const mappedDeptData = Object.keys(deptCounts).map((name, i) => ({
          name,
          count: deptCounts[name],
          color: colors[i % colors.length]
        }));
        if (mappedDeptData.length > 0) {
          setDeptData(mappedDeptData);
        }
      }

      // 3. Fetch Recent Patients for the right column list
      const ptRes = await authFetch(`${API_BASE_URL}/admin/patients?limit=5`);
      const ptData = await ptRes.json();
      if (ptData.success && Array.isArray(ptData.data)) {
        const livePts = ptData.data.map((p, i) => {
          const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT';
          const colors = [
            { bg: '#e0e7ff', color: '#3730a3' },
            { bg: '#fef3c7', color: '#92400e' },
            { bg: '#dcfce7', color: '#166534' },
            { bg: '#ffedd5', color: '#9a3412' },
            { bg: '#fce7f3', color: '#9d174d' }
          ];
          return {
            id: p.id,
            initials,
            name: p.name,
            uhid: `UHID: ${p.uhid || `GJS-2026-10${i + 25}`}`,
            time: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:15 AM',
            bg: colors[i % colors.length].bg,
            color: colors[i % colors.length].color
          };
        });
        setRecentPatients(livePts);
      }

      // 4. Fetch Live Pharmacy Alerts & Expiry warnings
      const alertRes = await authFetch(`${API_BASE_URL}/admin/medicines/alerts`);
      const alertData = await alertRes.json();
      if (alertData.success && Array.isArray(alertData.data)) {
        const liveAlerts = alertData.data.map((al, idx) => ({
          id: `pharm-alert-${idx}`,
          type: al.type === 'error' ? 'error' : 'info',
          text: al.text,
          time: al.time || 'Expiry Alert'
        }));
        setNotifications(liveAlerts.slice(0, 5));
      }

      // 5. Fetch Live Pharmacy Stats
      if (user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'PHARMACIST') {
        const pharmRes = await authFetch(`${API_BASE_URL}/admin/medicines/dashboard-stats`);
        const pharmData = await pharmRes.json();
        if (pharmData.success) {
          setPharmStats(pharmData.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard live data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const isReceptionist = user?.role === 'RECEPTIONIST';

  const cards = [
    {
      id: 'today_appointments',
      title: "Today's Appointments",
      value: stats.todayAppointmentsCount,
      subtitle: "Scheduled appointments",
      bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      border: '#bfdbfe',
      textColor: '#1e40af',
      valueColor: '#1e3a8a',
      icon: <Calendar size={24} />,
      iconBg: '#ffffff',
      iconColor: '#2563eb',
      shadowColor: 'rgba(37,99,235,0.15)',
      onClick: () => setActiveTab('appointments')
    },
    {
      id: 'today_patients',
      title: "Today's Patients",
      value: stats.todayPatientsCount,
      subtitle: "New registrations today",
      bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      border: '#bbf7d0',
      textColor: '#065f46',
      valueColor: '#064e3b',
      icon: <Users size={24} />,
      iconBg: '#ffffff',
      iconColor: '#059669',
      shadowColor: 'rgba(16,185,129,0.15)',
      onClick: () => setActiveTab('patients')
    },
    {
      id: 'pending_bills',
      title: "Pending Invoices",
      value: stats.pendingBillsCount,
      subtitle: `₹${(stats.pendingBillsAmount || 0).toLocaleString()} outstanding`,
      bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      border: '#fed7aa',
      textColor: '#9a3412',
      valueColor: '#7c2d12',
      icon: <FileText size={24} />,
      iconBg: '#ffffff',
      iconColor: '#ea580c',
      shadowColor: 'rgba(249,115,22,0.15)',
      onClick: () => { setBillingFilter('PENDING'); setActiveTab('billing'); }
    },
    {
      id: 'opd_completed',
      title: "OPD Count Today",
      value: stats.opdCompletedCount,
      subtitle: "Consultations completed",
      bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      border: '#fecdd3',
      textColor: '#9f1239',
      valueColor: '#881337',
      icon: <CheckCircle2 size={24} />,
      iconBg: '#ffffff',
      iconColor: '#e11d48',
      shadowColor: 'rgba(225,29,72,0.15)',
      onClick: () => setActiveTab('appointments')
    }
  ];

  if (!isReceptionist) {
    cards.splice(2, 0,
      {
        id: 'total_doctors',
        title: "Total Doctors",
        value: stats.totalDoctors,
        subtitle: "Active on duty",
        bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
        border: '#a5f3fc',
        textColor: '#0891b2',
        valueColor: '#0e7490',
        icon: <Stethoscope size={24} />,
        iconBg: '#ffffff',
        iconColor: '#06b6d4',
        shadowColor: 'rgba(6,182,212,0.15)',
        onClick: () => setActiveTab('doctors')
      },
      {
        id: 'today_revenue',
        title: "Today's Revenue",
        value: `₹${(stats.todayRevenue || 0).toLocaleString()}`,
        subtitle: "Collected today",
        bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
        border: '#e9d5ff',
        textColor: '#6b21a8',
        valueColor: '#4c1d95',
        icon: <DollarSign size={24} />,
        iconBg: '#ffffff',
        iconColor: '#7c3aed',
        shadowColor: 'rgba(124,58,237,0.15)',
        onClick: () => setActiveTab('revenue_reports')
      }
    );
    cards.push(
      {
        id: 'active_ipd',
        title: "Active IPD Patients",
        value: stats.activeIpdCount || 0,
        subtitle: `${stats.occupiedBedsCount || 0} / ${stats.totalBedsCount || 0} beds occupied`,
        bg: 'linear-gradient(135deg, #f5f3ff 0%, #edd9ff 100%)',
        border: '#ddd6fe',
        textColor: '#5b21b6',
        valueColor: '#4c1d95',
        icon: <Bed size={24} />,
        iconBg: '#ffffff',
        iconColor: '#8b5cf6',
        shadowColor: 'rgba(139,92,246,0.15)',
        onClick: () => setActiveTab('ipdAdmissions')
      },
      {
        id: 'pending_prescriptions',
        title: "Pending Rx Queue",
        value: stats.pendingPrescriptionsCount,
        subtitle: "Awaiting dispensing",
        bg: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
        border: '#99f6e4',
        textColor: '#0f766e',
        valueColor: '#115e59',
        icon: <Pill size={24} />,
        iconBg: '#ffffff',
        iconColor: '#0d9488',
        shadowColor: 'rgba(13,148,136,0.15)',
        onClick: () => setActiveTab('pharmacy_dispensing')
      },
      {
        id: 'low_stock_alerts',
        title: "Low Stock Alerts",
        value: stats.lowStockCount,
        subtitle: "Medicines below limit",
        bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        border: '#fca5a5',
        textColor: '#991b1b',
        valueColor: '#7f1d1d',
        icon: <AlertTriangle size={24} />,
        iconBg: '#ffffff',
        iconColor: '#dc2626',
        shadowColor: 'rgba(220,38,38,0.15)',
        onClick: () => setActiveTab('pharmacy_stock_management')
      }
    );
  }

  const renderRevenueChart = () => {
    if (!revenueTrend || revenueTrend.length === 0) {
      return <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No revenue trend data available.</div>;
    }

    const maxAmt = Math.max(...revenueTrend.map(d => d.amount), 1000);
    const height = 90;
    const width = 240;
    const padding = 10;

    const points = revenueTrend.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (revenueTrend.length - 1);
      const y = height - padding - (d.amount / maxAmt) * (height - 2 * padding);
      return { x, y, ...d };
    });

    const pathData = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaData = points.length > 0
      ? `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '110px' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />

          {/* Area under curve */}
          {areaData && <path d={areaData} fill="url(#chartGrad)" />}

          {/* Line Curve */}
          {pathData && <path d={pathData} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
              {p.amount > 0 && (
                <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0369a1">
                  ₹{Math.round(p.amount)}
                </text>
              )}
            </g>
          ))}
        </svg>
        {/* X Axis dates label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 6px', marginTop: '2px' }}>
          {points.map((p, idx) => (
            <span key={idx} style={{ fontSize: '8px', fontWeight: '800', color: '#64748b' }}>
              {p.date}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const filteredAppointments = recentAppointments.filter(app => {
    if (appFilter === 'all') return true;
    if (appFilter === 'pending') return app.status.toLowerCase().includes('pending');
    if (appFilter === 'confirmed') return app.status.toLowerCase().includes('confirm');
    if (appFilter === 'completed') return app.status.toLowerCase().includes('complete');
    return true;
  });

  return (
    <div className="dashboard-wrapper" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>

      {/* 1. TOP GREETING & DATE BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
            Welcome back, <strong>{user?.name || 'User'}</strong>!
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Calendar size={16} color="#64748b" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {cards.map((card) => (
          <div
            key={card.id}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={card.onClick}
            style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
              borderRadius: '18px',
              padding: '20px 22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: hoveredCard === card.id ? `0 10px 25px -5px ${card.shadowColor || 'rgba(0,0,0,0.1)'}` : '0 4px 6px -1px rgba(0,0,0,0.02)',
              transform: hoveredCard === card.id ? 'translateY(-4px) scale(1.02)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: '750', color: card.textColor, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {card.title}
              </span>
              <div style={{ fontSize: '28px', fontWeight: '900', color: card.valueColor, margin: '6px 0' }}>
                {card.value}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', opacity: 0.85, color: card.textColor }}>
                {card.subtitle}
              </span>
            </div>
            <div style={{ background: card.iconBg, color: card.iconColor, width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 10px ${card.shadowColor || 'rgba(0,0,0,0.05)'}` }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* PHARMACY & INVENTORY OVERVIEW - ADMIN & PHARMACIST ONLY */}
      {!isReceptionist && (user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'PHARMACIST') && (
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pill size={18} color="#0284c7" />
            <span>Pharmacy & Stock Overview</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ background: '#f0fdfa', color: '#0d9488', padding: '8px', borderRadius: '8px' }}><Pill size={18} /></div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Medicines Master</span>
                <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block', marginTop: '1px' }}>{pharmStats?.totalMedicines || 0} items</strong>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ background: '#f8fafc', color: '#475569', padding: '8px', borderRadius: '8px' }}><Package size={18} /></div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Total Stock</span>
                <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block', marginTop: '1px' }}>{pharmStats?.totalStock || 0} units</strong>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ background: '#fffbeb', color: '#d97706', padding: '8px', borderRadius: '8px' }}><AlertTriangle size={18} /></div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Low Stock Alert</span>
                <strong style={{ fontSize: '16px', color: (pharmStats?.lowStockCount || 0) > 0 ? '#d97706' : '#0f172a', display: 'block', marginTop: '1px' }}>{pharmStats?.lowStockCount || 0} alert(s)</strong>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px', borderRadius: '8px' }}><AlertTriangle size={18} /></div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Expiring Soon</span>
                <strong style={{ fontSize: '16px', color: (pharmStats?.expiringCount || 0) > 0 ? '#dc2626' : '#0f172a', display: 'block', marginTop: '1px' }}>{pharmStats?.expiringCount || 0} alert(s)</strong>
              </div>
            </div>

            {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN') && (
              <>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '8px', borderRadius: '8px' }}><DollarSign size={18} /></div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Today's Pharmacy Sales</span>
                    <strong style={{ fontSize: '16px', color: '#16a34a', display: 'block', marginTop: '1px' }}>₹{parseFloat(pharmStats?.todaySales || 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ background: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '8px' }}><DollarSign size={18} /></div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Pharmacy Monthly Revenue</span>
                    <strong style={{ fontSize: '16px', color: '#2563eb', display: 'block', marginTop: '1px' }}>₹{parseFloat(pharmStats?.monthlyRevenue || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* 3. MIDDLE CONTENT GRID (2 COLUMNS) */}
      <div className="dashboard-grid">

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* TODAY'S APPOINTMENTS TABLE CARD */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Today's Appointments</h3>
              <button
                type="button"
                onClick={() => setActiveTab('appointments')}
                style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
              >
                View All
              </button>
            </div>

            {/* FILTER TABS */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'completed', label: 'Completed' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setAppFilter(tab.key); setAppPage(1); }}
                  style={{
                    background: appFilter === tab.key ? '#0284c7' : '#f1f5f9',
                    color: appFilter === tab.key ? '#ffffff' : '#475569',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              {filteredAppointments.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  No matching appointments for today.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#64748b', fontWeight: '700', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 12px' }}>Token</th>
                      <th style={{ padding: '10px 12px' }}>Patient Name</th>
                      <th style={{ padding: '10px 12px' }}>Doctor</th>
                      <th style={{ padding: '10px 12px' }}>Time</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.slice((appPage - 1) * appsPerPage, appPage * appsPerPage).map((app, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedDetailAppointmentId(app.id)}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800' }}>
                            {app.token}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{app.patient}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{app.doctor}</td>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: '12.5px', whiteSpace: 'nowrap' }}>{app.time}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '700',
                            background: app.status.toLowerCase().includes('confirm') ? '#dcfce7' : (app.status.toLowerCase().includes('complete') ? '#e0f2fe' : (app.status.toLowerCase().includes('cancel') ? '#fef2f2' : '#ffedd5')),
                            color: app.status.toLowerCase().includes('confirm') ? '#15803d' : (app.status.toLowerCase().includes('complete') ? '#0369a1' : (app.status.toLowerCase().includes('cancel') ? '#dc2626' : '#c2410c'))
                          }}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* PAGINATION FOOTER */}
            {filteredAppointments.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '12.3px', color: '#64748b', fontWeight: '600' }}>
                  Page <strong>{appPage}</strong> of <strong>{Math.ceil(filteredAppointments.length / appsPerPage) || 1}</strong> (Total: {filteredAppointments.length} appointments)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={appPage === 1}
                    onClick={() => setAppPage(p => Math.max(p - 1, 1))}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: appPage === 1 ? '#cbd5e1' : '#475569', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: appPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={appPage >= Math.ceil(filteredAppointments.length / appsPerPage)}
                    onClick={() => setAppPage(p => Math.min(p + 1, Math.ceil(filteredAppointments.length / appsPerPage)))}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: appPage >= Math.ceil(filteredAppointments.length / appsPerPage) ? '#cbd5e1' : '#475569', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: appPage >= Math.ceil(filteredAppointments.length / appsPerPage) ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CHARTS ROW (Hidden for RECEPTIONIST) */}
          {!isReceptionist && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>

              {/* OPD vs IPD SUMMARY */}
              {(() => {
                const opdCount = stats.opdCompletedCount || 0;
                const ipdCount = stats.activeIpdCount || 0;
                const totalIpdOpd = opdCount + ipdCount;
                const opdPct = totalIpdOpd > 0 ? Math.round((opdCount / totalIpdOpd) * 100) : 100;
                const ipdPct = totalIpdOpd > 0 ? Math.round((ipdCount / totalIpdOpd) * 100) : 0;
                
                return (
                  <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>OPD vs IPD Summary</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', height: '110px' }}>
                      <div style={{ width: '70px', height: '70px', position: 'relative' }}>
                        <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" strokeWidth="6" />
                          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray={`${opdPct} ${100 - opdPct}`} strokeDashoffset="0" />
                          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray={`${ipdPct} ${100 - ipdPct}`} strokeDashoffset={`${100 - opdPct}`} />
                        </svg>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#3b82f6' }} />
                          <span><strong>OPD Patients</strong><div style={{ fontSize: '11.5px', color: '#64748b' }}>{totalIpdOpd > 0 ? opdPct : 0}% ({opdCount})</div></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#10b981' }} />
                          <span><strong>IPD Patients</strong><div style={{ fontSize: '11.5px', color: '#64748b' }}>{totalIpdOpd > 0 ? ipdPct : 0}% ({ipdCount})</div></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* DEPARTMENT WISE OPD BAR CHART */}
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Department Wise OPD</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '110px', paddingTop: '10px' }}>
                  {deptData.slice(0, 5).map((d, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ width: '18px', height: `${Math.min(d.count * 4, 80)}px`, background: d.color, borderRadius: '4px 4px 0 0', transition: 'all 0.3s ease' }} />
                      <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '45px' }} title={d.name}>
                        {d.name.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-DAY REVENUE TREND (Live SVG chart) */}
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>7-Day Revenue Trend</span>
                  <span style={{ fontSize: '11.5px', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '8px' }}>Live</span>
                </h3>
                {renderRevenueChart()}
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* RECENT PATIENTS LIST CARD */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Recent Patients</h3>
              <button
                type="button"
                onClick={() => setActiveTab('patients')}
                style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
              >
                View All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {recentPatients.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '10px 0' }}>No recent patient registrations.</div>
              ) : (
                recentPatients.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: p.bg, color: p.color, fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.initials}
                      </div>
                      <div>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>{p.name}</strong>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>{p.uhid}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0284c7' }}>{p.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LIVE NOTIFICATIONS CARD */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>System Alerts</h3>
              <span style={{ background: '#fde8e8', color: '#dc2626', fontSize: '11.5px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px' }}>Live Warnings</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '255px', overflowY: 'auto', paddingRight: '4px' }}>
              {notifications.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '10px 0' }}>No active system alerts.</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                      background: n.type === 'error' ? '#fde8e8' : '#dbeafe',
                      color: n.type === 'error' ? '#e11d48' : '#2563eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {n.type === 'error' ? <AlertTriangle size={15} /> : <Info size={15} />}
                    </div>
                    <div>
                      <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: '600', display: 'block', lineHeight: '1.4' }}>{n.text}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{n.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 4. BOTTOM QUICK ACTIONS BAR */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '20px', marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Quick Actions</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px'
        }}>

          <button
            type="button"
            onClick={() => setShowWalkinModal(true)}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '700', color: '#334155', transition: 'all 0.15s ease' }}
          >
            <Calendar size={18} color="#2563eb" />
            <span>+ New Appointment</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('patients')}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '700', color: '#334155', transition: 'all 0.15s ease' }}
          >
            <UserPlus size={18} color="#059669" />
            <span>+ Register Patient</span>
          </button>

          <button
            type="button"
            onClick={() => { setBillingFilter('PENDING'); setActiveTab('billing'); }}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '700', color: '#334155', transition: 'all 0.15s ease' }}
          >
            <FileText size={18} color="#ea580c" />
            <span>View Pending Bills</span>
          </button>

          {!isReceptionist && (
            <button
              type="button"
              onClick={() => setActiveTab('pharmacy_dispensing')}
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '700', color: '#334155', transition: 'all 0.15s ease' }}
            >
              <Pill size={18} color="#0d9488" />
              <span>View Pharmacy Queue</span>
            </button>
          )}

        </div>
      </div>

    </div>
  );
}
