import React, { useState, useEffect } from 'react';
import { CreditCard, Search, RefreshCw, Eye, Download, Plus, X, User } from 'lucide-react';
import BillDetailModal from './BillDetailModal';
import { API_BASE_URL } from '../config/api';

export default function BillingModule({ authFetch, user, defaultStatusFilter = 'all' }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [selectedBillId, setSelectedBillId] = useState(null);

  useEffect(() => {
    setStatusFilter(defaultStatusFilter);
  }, [defaultStatusFilter]);

  // Create Standalone Bill State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);

  const handleSearchPatients = async (e) => {
    e.preventDefault();
    if (!patientQuery.trim()) return;
    setSearchingPatients(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/patients?search=${encodeURIComponent(patientQuery.trim())}`);
      const data = await res.json();
      if (data.success) {
        setPatientResults(data.data || []);
      }
    } catch (err) {
      console.error('Error searching patients:', err);
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleCreateBillForPatient = async (patientId) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/bills/create-standalone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, force_new: true })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setPatientQuery('');
        setPatientResults([]);
        await fetchBills();
        setSelectedBillId(data.data.id); // Open new bill immediately
      } else {
        alert(data.error || 'Failed to create bill');
      }
    } catch (err) {
      console.error('Error creating bill:', err);
    }
  };

  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE_URL}/admin/bills?status=${statusFilter}`;
      if (searchQuery.trim()) url += `&query=${encodeURIComponent(searchQuery.trim())}`;

      const res = await authFetch(url);
      const data = await res.json();
      if (data.success) {
        setBills(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch bills.');
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Network error fetching bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBills();
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={26} color="#0284c7" />
            <span>OPD Billing & Invoices</span>
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'block' }}>
            Manage consultation fees, lab/pharmacy charges, and patient payments
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {user?.role === 'RECEPTIONIST' && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Create Standalone Bill
            </button>
          )}

          <button
            type="button"
            onClick={fetchBills}
            disabled={loading}
            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '14px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Search Bills</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search patient name, mobile, or Bill # (e.g. INV-GJS-2026-000001)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="PAID">PAID</option>
            </select>
          </div>

          <div style={{ paddingTop: '16px' }}>
            <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>
              Search
            </button>
          </div>
        </form>
      </div>

      {/* BILLS TABLE */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading bills list...</div>
      ) : error ? (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>⚠️ {error}</div>
      ) : bills.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '60px', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
          <CreditCard size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>No billing records found matching your filters.</p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px' }}>Invoice #</th>
                <th style={{ padding: '12px 16px' }}>Patient Name</th>
                <th style={{ padding: '12px 16px' }}>Billed Date</th>
                <th style={{ padding: '12px 16px' }}>Total Amount</th>
                <th style={{ padding: '12px 16px' }}>Paid Amount</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => {
                const total = parseFloat(b.total_amount || 0);
                const paid = parseFloat(b.paid_amount || 0);
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setSelectedBillId(b.id)}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '3px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '800' }}>
                        {b.bill_number}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <strong style={{ color: '#0f172a' }}>{b.patient_name}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>UHID: {b.patient_uhid || 'N/A'} | Mob: {b.mobile || '-'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>₹{total.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#15803d' }}>₹{paid.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        background: b.status === 'PAID' ? '#dcfce7' : (b.status === 'PARTIALLY_PAID' ? '#fef3c7' : '#fef2f2'),
                        color: b.status === 'PAID' ? '#15803d' : (b.status === 'PARTIALLY_PAID' ? '#b45309' : '#dc2626')
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedBillId(b.id)}
                        style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={14} /> View Details & Pay
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE STANDALONE BILL MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', width: '480px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '24px', position: 'relative' }}>
            <button
              onClick={() => { setShowCreateModal(false); setPatientResults([]); setPatientQuery(''); }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Create Standalone Bill</h3>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '16px' }}>
              Search for any patient (including newly registered patients) to create a bill.
            </span>

            {/* SEARCH FORM */}
            <form onSubmit={handleSearchPatients} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                required
                placeholder="Search patient by Name, Phone, or UHID..."
                value={patientQuery}
                onChange={e => setPatientQuery(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
              <button
                type="submit"
                disabled={searchingPatients}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                {searchingPatients ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* SEARCH RESULTS */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              {patientResults.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12.5px' }}>
                  {searchingPatients ? 'Searching patients list...' : 'No patients loaded. Search above.'}
                </div>
              ) : (
                patientResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleCreateBillForPatient(p.id)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>UHID: {p.uhid || 'N/A'} | Phone: {p.mobile}</div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800' }}>Select Patient →</span>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                onClick={() => { setShowCreateModal(false); setPatientResults([]); setPatientQuery(''); }}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILL DETAIL MODAL */}
      <BillDetailModal
        isOpen={Boolean(selectedBillId)}
        onClose={() => setSelectedBillId(null)}
        billId={selectedBillId}
        authFetch={authFetch}
        onBillUpdated={fetchBills}
      />
    </div>
  );
}
