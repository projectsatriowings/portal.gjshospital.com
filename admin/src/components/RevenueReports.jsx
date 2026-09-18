import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Download, RefreshCw, PieChart, CreditCard, ShieldAlert, Bell, CheckCircle2, TrendingUp, Lock } from 'lucide-react';
import { API_BASE_URL, getFileUrl } from '../config/api';

export default function RevenueReports({ authFetch, user }) {
  const [period, setPeriod] = useState('1m');
  const [reportData, setReportData] = useState(null);
  const [periodLabel, setPeriodLabel] = useState('1 Month (Past 30 Days)');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Revenue Audit Date & Reminder State
  const [reminderDate, setReminderDate] = useState('');
  const [reminderInfo, setReminderInfo] = useState(null);
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderMsg, setReminderMsg] = useState('');

  // Fetch Revenue Report & Reminder Status
  const fetchReport = async (p = period) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Revenue Analytics Data
      const res = await authFetch(`${API_BASE_URL}/admin/reports/revenue?period=${p}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
        setPeriodLabel(data.periodLabel);
      } else {
        setError(data.error || 'Failed to fetch revenue report.');
      }

      // 2. Fetch Revenue Audit Reminder Status
      const remRes = await authFetch(`${API_BASE_URL}/admin/reports/reminder`);
      const remData = await remRes.json();
      if (remData.success) {
        setReminderInfo(remData.data);
        if (remData.data.reminderDate) {
          setReminderDate(remData.data.reminderDate.split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching revenue report:', err);
      setError('Network error fetching revenue report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  const handlePeriodChange = (p) => {
    setPeriod(p);
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/reports/revenue/pdf?period=${period}`);
      const data = await res.json();
      if (data.success && data.pdfUrl) {
        window.open(getFileUrl(data.pdfUrl), '_blank');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    if (!reminderDate) return;
    setSavingReminder(true);
    setReminderMsg('');
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/reports/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderDate })
      });
      const data = await res.json();
      if (data.success) {
        setReminderMsg('Scheduled revenue review date saved successfully!');
        fetchReport(period);
      } else {
        setReminderMsg(`⚠️ ${data.error || 'Failed to save date.'}`);
      }
    } catch (err) {
      setReminderMsg('⚠️ Network error saving date.');
    } finally {
      setSavingReminder(false);
    }
  };

  // RBAC GUARDRAIL FOR FRONTEND: Only SUPER_ADMIN and HOSPITAL_ADMIN
  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'HOSPITAL_ADMIN') {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '30px', maxWidth: '500px', margin: '0 auto', color: '#dc2626' }}>
          <Lock size={48} color="#dc2626" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800' }}>403 Forbidden - Admin Access Only</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#991b1b' }}>
            Financial Revenue Reports are restricted to Hospital Administrators only. Staff roles ({user?.role}) are not authorized to view hospital revenue analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      
      {/* 1-DAY REVENUE AUDIT REMINDER NOTIFICATION BANNER */}
      {reminderInfo?.isReminderActive && (
        <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1.5px solid #f59e0b', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#d97706', color: '#fff', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={22} className="spin" />
            </div>
            <div>
              <strong style={{ fontSize: '15px', color: '#92400e', display: 'block' }}>
                🔔 Revenue Review Reminder Alert!
              </strong>
              <span style={{ fontSize: '13px', color: '#78350f' }}>
                {reminderInfo.daysRemaining === 1 ? 'Tomorrow is your scheduled Revenue Audit Date!' : 'Today is your scheduled Revenue Audit Date!'} Please review the 1m, 3m, 6m, and 1y performance metrics.
              </span>
            </div>
          </div>
          <span style={{ background: '#92400e', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
            Scheduled Date: {reminderDate}
          </span>
        </div>
      )}

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={26} color="#0284c7" />
            <span>Revenue Reports & Financial Analytics</span>
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'block' }}>
            Confidential hospital financial audit report (Admin Only Access)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => fetchReport(period)}
            disabled={loading}
            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} /> {downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      {/* MULTI-PERIOD FILTER TABS */}
      <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: '1m', label: '📅 1 Month (30 Days)' },
            { key: '3m', label: '📊 3 Months (Quarterly)' },
            { key: '6m', label: '📈 6 Months (Semi-Annual)' },
            { key: '1y', label: '🏦 1 Year (Annual)' }
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handlePeriodChange(t.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: period === t.key ? '#0284c7' : '#cbd5e1',
                background: period === t.key ? '#0284c7' : '#ffffff',
                color: period === t.key ? '#ffffff' : '#475569',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '12.5px', color: '#0369a1', fontWeight: '700', background: '#e0f2fe', padding: '6px 12px', borderRadius: '8px' }}>
          Viewing: {periodLabel}
        </span>
      </div>

      {/* ADMIN SCHEDULE REVENUE AUDIT REMINDER PICKER */}
      <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <form onSubmit={handleSaveReminder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={16} color="#d97706" /> Schedule Next Revenue Review Date:
            </strong>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Select a target date. System will alert you 1 day before the date.</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="date"
              required
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
            <button
              type="submit"
              disabled={savingReminder}
              style={{ background: '#d97706', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
            >
              {savingReminder ? 'Saving...' : 'Set Reminder Date'}
            </button>
          </div>
        </form>
        {reminderMsg && <div style={{ fontSize: '12.5px', fontWeight: '700', color: reminderMsg.includes('⚠️') ? '#dc2626' : '#15803d', marginTop: '8px' }}>{reminderMsg}</div>}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Calculating revenue metrics...</div>
      ) : error ? (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>⚠️ {error}</div>
      ) : !reportData ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SUMMARY STAT CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(15,23,42,0.15)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Paid Revenue ({period.toUpperCase()})</span>
              <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 4px 0', color: '#38bdf8' }}>₹{reportData.total_revenue.toFixed(2)}</h2>
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Realized Cash & Electronic Receipts</span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Paid Invoices</span>
              <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 4px 0', color: '#15803d' }}>{reportData.paid_bills_count}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Completed Transactions</span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Invoice Value</span>
              <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 4px 0', color: '#0369a1' }}>₹{reportData.average_bill_amount.toFixed(2)}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Per Patient Visit</span>
            </div>

          </div>

          {/* BREAKDOWN SECTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* CATEGORY BREAKDOWN */}
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={20} color="#0284c7" /> Revenue by Service Category
              </h3>

              {(!reportData.category_breakdown || reportData.category_breakdown.length === 0) ? (
                <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px', textAlign: 'center' }}>No category revenue recorded for this period.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {reportData.category_breakdown.map((c, idx) => {
                    const pct = reportData.total_revenue > 0 ? (c.amount / reportData.total_revenue) * 100 : 0;
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          <span>{c.category}</span>
                          <span>₹{c.amount.toFixed(2)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: idx === 0 ? '#0284c7' : (idx === 1 ? '#7e22ce' : '#16a34a'), borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PAYMENT METHOD BREAKDOWN */}
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="#0284c7" /> Revenue by Payment Method
              </h3>

              {(!reportData.payment_method_breakdown || reportData.payment_method_breakdown.length === 0) ? (
                <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px', textAlign: 'center' }}>No payment methods recorded for this period.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {reportData.payment_method_breakdown.map((m, idx) => {
                    const pct = reportData.total_revenue > 0 ? (m.amount / reportData.total_revenue) * 100 : 0;
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          <span>{m.method}</span>
                          <span>₹{m.amount.toFixed(2)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: m.method === 'UPI' ? '#16a34a' : (m.method === 'CARD' ? '#7e22ce' : '#0284c7'), borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
