import React, { useState, useEffect } from 'react';
import { Clock, Search, RefreshCw, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function PharmacyExpiry({ authFetch, user }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [daysFilter, setDaysFilter] = useState(30);
  const [search, setSearch] = useState('');

  const fetchExpiringMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      // Query all medicines
      const res = await authFetch(`${API_BASE_URL}/admin/medicines?status=ACTIVE`);
      const data = await res.json();
      if (data.success) {
        // Filter medicines expiring in next X days
        const rawMeds = data.data || [];
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + parseInt(daysFilter, 10));

        const filtered = rawMeds.filter(m => {
          if (!m.expiry_date) return false;
          const exp = new Date(m.expiry_date);
          // Keep if it is already expired, or expiring within the daysFilter
          return exp <= limitDate;
        }).sort((a, b) => {
          if (!a.expiry_date) return 1;
          if (!b.expiry_date) return -1;
          return new Date(a.expiry_date) - new Date(b.expiry_date);
        });

        setMedicines(filtered);
      } else {
        setError(data.error || 'Failed to fetch medicines list.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error fetching expiring medicines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringMedicines();
  }, [daysFilter]);

  const filteredList = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.category_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '80vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={26} color="#dc2626" />
            <span>Expiry Management & Alerts</span>
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'block' }}>
            Monitor batches nearing their expiration dates to guarantee patient safety and avoid stock wastage
          </span>
        </div>

        <div>
          <button
            type="button"
            onClick={fetchExpiringMedicines}
            disabled={loading}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Search Medicine Name</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Type medicine name to filter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Expiry Scoped Period</label>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: '700' }}
            >
              <option value="30">Expiring within 30 Days (Soonest)</option>
              <option value="60">Expiring within 60 Days (2 Months)</option>
              <option value="90">Expiring within 90 Days (3 Months)</option>
            </select>
          </div>
        </div>
      </div>

      {/* LIST TABLE */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading expiry status logs...</div>
      ) : error ? (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>⚠️ {error}</div>
      ) : filteredList.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '60px', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
          <CheckCircle2 size={48} color="#16a34a" style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#15803d' }}>
            Excellent! No medicines found expiring within the next {daysFilter} days.
          </p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px' }}>Medicine Name</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Current Stock</th>
                <th style={{ padding: '12px 16px' }}>Nearest Expiry Date</th>
                <th style={{ padding: '12px 16px' }}>Time Left</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status Alert</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((m) => {
                const expDate = new Date(m.expiry_date);
                const today = new Date();
                const diffTime = expDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isExpired = diffDays <= 0;

                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>{m.name}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                        {m.category_name || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: m.current_stock > 0 ? '#0f172a' : '#dc2626' }}>
                      {m.current_stock} {m.unit || 'units'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '800', color: isExpired ? '#dc2626' : '#b45309' }}>
                      {expDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>
                      {isExpired ? (
                        <span style={{ color: '#dc2626' }}>Expired</span>
                      ) : (
                        <span>{diffDays} days left</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800',
                        background: isExpired ? '#fef2f2' : '#fffbe0',
                        color: isExpired ? '#dc2626' : '#b45309',
                        border: isExpired ? '1px solid #fecaca' : '1px solid #fef08a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isExpired ? <AlertCircle size={12} /> : <AlertTriangle size={12} />}
                        {isExpired ? 'EXPIRED (Discontinue)' : 'Expires Soon'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
