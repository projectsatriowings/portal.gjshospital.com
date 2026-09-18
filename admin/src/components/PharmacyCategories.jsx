import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PharmacyCategories({ authFetch, user }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('http://localhost:5000/api/admin/medicines/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch categories.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error fetching categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (cat) => {
    setEditingCat(cat);
    setName(cat.name);
    setShowForm(true);
  };

  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      const res = await authFetch(`http://localhost:5000/api/admin/medicines/categories/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ Category deleted successfully.`);
        fetchCategories();
        setTimeout(() => setMsg(''), 2000);
      } else {
        alert(data.error || 'Failed to delete category.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting category.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMsg('');

    try {
      const url = editingCat 
        ? `http://localhost:5000/api/admin/medicines/categories/${editingCat.id}`
        : 'http://localhost:5000/api/admin/medicines/categories';
      const method = editingCat ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      const data = await res.json();
      if (data.success) {
        setMsg(editingCat ? '✅ Category updated!' : '✅ Category created!');
        setName('');
        setEditingCat(null);
        setShowForm(false);
        fetchCategories();
        setTimeout(() => setMsg(''), 2000);
      } else {
        setMsg(`⚠️ ${data.error || 'Failed to save category.'}`);
      }
    } catch (err) {
      console.error(err);
      setMsg('⚠️ Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '80vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={26} color="#0284c7" />
            <span>Medicine Categories</span>
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'block' }}>
            Configure and organize catalog medicines into Tablets, Syrups, Injections, etc.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchCategories}
            disabled={loading}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>

          <button
            type="button"
            onClick={() => { setEditingCat(null); setName(''); setShowForm(true); setMsg(''); }}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ background: msg.includes('⚠️') ? '#fef2f2' : '#f0fdf4', color: msg.includes('⚠️') ? '#dc2626' : '#15803d', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700', marginBottom: '20px', border: msg.includes('⚠️') ? '1px solid #fee2e2' : '1px solid #dcfce7' }}>
          {msg}
        </div>
      )}

      {/* RENDER LIST */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading categories...</div>
      ) : error ? (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>⚠️ {error}</div>
      ) : categories.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '60px', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
          <Layers size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>No medicine categories found. Click Add Category to create one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div>
                <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>{cat.name}</strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                  ID: #{cat.id}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleEdit(cat)}
                  style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Edit Category Name"
                >
                  <Edit size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Delete Category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '420px', borderRadius: '18px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              {editingCat ? 'Edit Category Name' : 'Create New Category'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tablets, Syrups, Ointments"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
