import React, { useState, useEffect } from 'react';
import { PackagePlus, Search, RefreshCw, Layers, Calendar, UserCheck, RefreshCw as LoopIcon } from 'lucide-react';
import StockInModal from './StockInModal';

export default function PharmacyStockManagement({ authFetch, user }) {
  const [medicines, setMedicines] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  
  // Stock In Modal
  const [stockInMed, setStockInMed] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await authFetch('http://localhost:5000/api/admin/medicines/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch medicines
      let medUrl = `http://localhost:5000/api/admin/medicines?status=${statusFilter}`;
      if (categoryFilter !== 'all') medUrl += `&category_id=${categoryFilter}`;
      if (search.trim()) medUrl += `&query=${encodeURIComponent(search.trim())}`;
      
      const medRes = await authFetch(medUrl);
      const medData = await medRes.json();
      if (!medData.success) throw new Error(medData.error || 'Failed to fetch medicines');
      setMedicines(medData.data || []);

      // 2. Fetch stock movements ledger
      const movRes = await authFetch('http://localhost:5000/api/admin/medicines/stock-movements');
      const movData = await movRes.json();
      if (!movData.success) throw new Error(movData.error || 'Failed to fetch ledger');
      setMovements(movData.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading stock logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchData();
  }, [statusFilter, categoryFilter]);

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '80vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PackagePlus size={26} color="#16a34a" />
            <span>Stock Control & Movements Ledger</span>
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'block' }}>
            Stock-in raw quantities, trace audit ledgers, batch numbers, and verify stock levels
          </span>
        </div>

        <div>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '14px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Search Master</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search medicine catalog..."
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

      {/* TWO PANEL WORKSPACE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ACTIVE STOCK LEVELS */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Active Catalog Inventory</h3>
          
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading medicine items...</div>
          ) : medicines.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No medicines matched search.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {medicines.map(m => {
                const isOutOfStock = (m.current_stock || 0) <= 0;
                const isLowStock = !isOutOfStock && (m.current_stock < (m.reorder_level || 10));

                return (
                  <div
                    key={m.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isOutOfStock ? '#fff5f5' : (isLowStock ? '#fffbeb' : '#ffffff')
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>{m.name}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                        Category: <strong>{m.category_name || 'Unassigned'}</strong> | Unit: <strong>{m.unit}</strong>
                      </span>
                      {m.expiry_date && (
                        <span style={{ fontSize: '11px', color: '#b45309', display: 'block', marginTop: '2px' }}>
                          Nearest Expiry: <strong>{new Date(m.expiry_date).toLocaleDateString()}</strong>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '13.5px', fontWeight: '800',
                          color: isOutOfStock ? '#dc2626' : (isLowStock ? '#b45309' : '#15803d')
                        }}>
                          {m.current_stock || 0} {m.unit}s
                        </div>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          Reorder: {m.reorder_level || 10}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStockInMed(m)}
                        style={{
                          background: '#16a34a', color: '#fff', border: 'none',
                          padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                          fontWeight: '700', cursor: 'pointer', display: 'inline-flex',
                          alignItems: 'center', gap: '4px'
                        }}
                      >
                        <PackagePlus size={13} /> Stock In
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STOCK AUDIT TIMELINE LEDGER */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Audit Movements Ledger</h3>
          
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading movements...</div>
          ) : movements.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No movements logged.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
              {movements.map(mov => {
                const isAdd = mov.type === 'PURCHASE_IN' || (mov.type === 'ADJUSTMENT' && mov.quantity > 0);
                return (
                  <div
                    key={mov.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '10px',
                      fontSize: '12.5px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#0f172a' }}>{mov.medicine_name}</strong>
                      <strong style={{ color: isAdd ? '#16a34a' : '#dc2626' }}>
                        {isAdd ? '+' : ''}{mov.quantity} {mov.unit}s
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                      <div>Type: <strong style={{ color: '#475569' }}>{mov.type}</strong></div>
                      <div>Ref: {mov.reference || 'N/A'}</div>
                    </div>

                    {mov.batch_number && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309', fontSize: '10.5px', marginTop: '2px' }}>
                        <div>Batch: <strong>{mov.batch_number}</strong></div>
                        {mov.expiry_date && (
                          <div>Expiry: <strong>{new Date(mov.expiry_date).toLocaleDateString()}</strong></div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginTop: '2px' }}>
                      <div>By: {mov.user_name || 'System'}</div>
                      <div>{new Date(mov.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* STOCK IN MODAL FORM LINK */}
      {stockInMed && (
        <StockInModal
          isOpen={!!stockInMed}
          onClose={() => setStockInMed(null)}
          medicine={stockInMed}
          authFetch={authFetch}
          onStockUpdated={() => {
            fetchData();
            setStockInMed(null);
          }}
        />
      )}

    </div>
  );
}
