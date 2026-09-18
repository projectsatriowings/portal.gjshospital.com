import React, { useState, useEffect } from 'react';
import { Pill, Search, Plus, Edit, Trash2, RefreshCw, CheckCircle2, AlertCircle, PackagePlus, AlertTriangle, Lock } from 'lucide-react';
import StockInModal from './StockInModal';

export default function MedicineCatalog({ authFetch, user }) {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State for Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [form, setForm] = useState({ name: '', unit_price: '', unit: 'tablet', reorder_level: 10, status: 'ACTIVE', category_id: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Stock In Modal State
  const [stockInMed, setStockInMed] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await authFetch('http://localhost:5000/api/admin/medicines/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `http://localhost:5000/api/admin/medicines?status=${statusFilter}`;
      if (categoryFilter !== 'all') url += `&category_id=${categoryFilter}`;
      if (search.trim()) url += `&query=${encodeURIComponent(search.trim())}`;

      const res = await authFetch(url);
      const data = await res.json();
      if (data.success) {
        setMedicines(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch medicine catalog.');
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Network error fetching medicine catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [statusFilter, categoryFilter]);

  const handleOpenModal = (med = null) => {
    setMsg('');
    if (med) {
      setEditingMed(med);
      setForm({
        name: med.name,
        unit_price: med.unit_price,
        unit: med.unit || 'tablet',
        reorder_level: med.reorder_level || 10,
        status: med.status || 'ACTIVE',
        category_id: med.category_id || ''
      });
    } else {
      setEditingMed(null);
      setForm({ name: '', unit_price: '', unit: 'tablet', reorder_level: 10, status: 'ACTIVE', category_id: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const url = editingMed
        ? `http://localhost:5000/api/admin/medicines/${editingMed.id}`
        : `http://localhost:5000/api/admin/medicines`;

      const method = editingMed ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category_id: form.category_id ? parseInt(form.category_id, 10) : null
        })
      });

      const data = await res.json();
      if (data.success) {
        setMsg(editingMed ? 'Medicine updated successfully!' : 'Medicine added to catalog!');
        fetchMedicines();
        setTimeout(() => {
          setShowModal(false);
        }, 1000);
      } else {
        setMsg(`⚠️ ${data.error || 'Failed to save medicine.'}`);
      }
    } catch (err) {
      setMsg('⚠️ Network error saving medicine.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      
      {/* STOCK CONTROL AUDIT GUARANTEE BANNER */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '12.5px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Lock size={18} color="#0284c7" />
        <span>
          <strong>Stock Audit Integrity:</strong> Medicine stock quantity changes <strong>ONLY through Stock In receipts or Pharmacy Dispensing</strong> logs. Direct manual stock editing is disabled for strict audit trail compliance.
        </span>
      </div>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Pill size={26} color="#0284c7" />
            <span>Medicine Catalog & Stock Control</span>
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'block' }}>
            Manage medicine master catalog, unit prices, reorder thresholds, and inventory levels
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchMedicines}
            disabled={loading}
            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Add New Medicine
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchMedicines(); }} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr auto', gap: '14px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Search Catalog</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search medicine name or unit (e.g. Dolo 650, Paracetamol, strip)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div style={{ paddingTop: '16px' }}>
            <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>
              Search
            </button>
          </div>
        </form>
      </div>

      {/* CATALOG TABLE */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading medicine catalog...</div>
      ) : error ? (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>⚠️ {error}</div>
      ) : medicines.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '60px', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
          <Pill size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>No medicines found in catalog.</p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px' }}>Medicine Name</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Unit Type</th>
                <th style={{ padding: '12px 16px' }}>Unit Price (₹)</th>
                <th style={{ padding: '12px 16px' }}>Current Stock</th>
                <th style={{ padding: '12px 16px' }}>Reorder Level</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => {
                const isOutOfStock = (m.current_stock || 0) <= 0;
                const isLowStock = !isOutOfStock && (m.current_stock < (m.reorder_level || 10));

                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>{m.name}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                        {m.category_name || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', textTransform: 'capitalize' }}>{m.unit || 'tablet'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#15803d' }}>₹{parseFloat(m.unit_price).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '800',
                        background: isOutOfStock ? '#fef2f2' : (isLowStock ? '#fffbe0' : '#f0fdf4'),
                        color: isOutOfStock ? '#dc2626' : (isLowStock ? '#b45309' : '#15803d'),
                        border: isOutOfStock ? '1px solid #fecaca' : (isLowStock ? '1px solid #fef08a' : '1px solid #bbf7d0')
                      }}>
                        {m.current_stock || 0} {m.unit || 'units'}
                        {isOutOfStock && ' (Out of Stock)'}
                        {isLowStock && ' (Low Stock)'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{m.reorder_level || 10}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                        background: m.status === 'ACTIVE' ? '#dcfce7' : '#fef2f2',
                        color: m.status === 'ACTIVE' ? '#15803d' : '#dc2626'
                      }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setStockInMed(m)}
                          style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <PackagePlus size={14} /> Stock In
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenModal(m)}
                          style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* STOCK IN MODAL */}
      {stockInMed && (
        <StockInModal
          isOpen={Boolean(stockInMed)}
          onClose={() => setStockInMed(null)}
          medicine={stockInMed}
          authFetch={authFetch}
          onStockUpdated={() => fetchMedicines()}
        />
      )}

      {/* ADD / EDIT MEDICINE MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '520px', borderRadius: '20px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                {editingMed ? 'Edit Medicine Details' : 'Add New Medicine to Catalog'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>×</button>
            </div>

            {msg && <div style={{ background: msg.includes('⚠️') ? '#fef2f2' : '#f0fdf4', color: msg.includes('⚠️') ? '#dc2626' : '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>{msg}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dolo 650mg / Cetirizine 10mg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Medicine Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">Unassigned (None)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    placeholder="e.g. 5.00"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Unit Type</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="strip">Strip</option>
                    <option value="bottle">Bottle / Syrup</option>
                    <option value="sachet">Sachet</option>
                    <option value="injection">Injection / Vial</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Reorder Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={form.reorder_level}
                    onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', color: '#64748b' }}>
                💡 <strong>Note:</strong> Current stock count cannot be manually edited here. Please use the <strong>"Stock In"</strong> button to receive inventory from suppliers.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
