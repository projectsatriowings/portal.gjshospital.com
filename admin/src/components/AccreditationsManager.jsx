import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Search, RefreshCw, Layers } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AccreditationsManager = () => {
  const [accreditations, setAccreditations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hospital_id: 'GJS',
    icon: 'Award',
    title: '',
    description: '',
    display_order: 1,
    status: 'active'
  });

  const fetchAccreditations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/accreditations`);
      const data = await res.json();
      if (data.success) {
        setAccreditations(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching accreditations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccreditations();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      hospital_id: 'GJS',
      icon: 'Award',
      title: '',
      description: '',
      display_order: accreditations.length + 1,
      status: 'active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      hospital_id: item.hospital_id || 'GJS',
      icon: item.icon || 'Award',
      title: item.title || '',
      description: item.description || '',
      display_order: item.display_order || 1,
      status: item.status || 'active'
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('Please enter a title');

    setSaving(true);
    try {
      const url = editingItem
        ? `${API_BASE_URL}/accreditations/${editingItem.id}`
        : `${API_BASE_URL}/accreditations`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        fetchAccreditations();
      } else {
        alert(data.error || 'Failed to save accreditation');
      }
    } catch (err) {
      console.error('Error saving accreditation:', err);
      alert('Error connecting to server');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this accreditation?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/accreditations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchAccreditations();
      } else {
        alert(data.error || 'Failed to delete accreditation');
      }
    } catch (err) {
      console.error('Error deleting accreditation:', err);
    }
  };

  const filteredItems = accreditations.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tab-pane">
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f2b48', margin: '0 0 6px 0' }}>
            Accreditation & Quality Manager
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            Manage hospital quality accreditations and regulatory certifications (NABH, NABL, ISO, etc.).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            background: '#00a3c8',
            color: '#fff',
            border: 'none',
            padding: '12px 22px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(0,163,200,0.3)'
          }}
        >
          <Plus size={18} />
          <span>Add Accreditation</span>
        </button>
      </div>

      {/* TOOLBAR */}
      <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '8px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: 1, maxWidth: '400px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search accreditations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
          />
        </div>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginLeft: 'auto' }}>
          Total Accreditations: <strong>{filteredItems.length}</strong>
        </span>
      </div>

      {/* TABLE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <RefreshCw size={36} color="#00a3c8" className="spin" style={{ marginBottom: '12px' }} />
          <p style={{ color: '#64748b', fontWeight: '600' }}>Loading accreditations...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <Layers size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ color: '#1a3a6e', margin: '0 0 8px 0' }}>No Accreditations Found</h3>
          <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>Click the button below to add your first accreditation entry.</p>
          <button onClick={handleOpenAdd} style={{ background: '#00a3c8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
            + Add Accreditation
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '16px 20px' }}>Order</th>
                <th style={{ padding: '16px 20px' }}>Icon</th>
                <th style={{ padding: '16px 20px' }}>Title</th>
                <th style={{ padding: '16px 20px' }}>Description</th>
                <th style={{ padding: '16px 20px' }}>Status</th>
                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: '#64748b' }}>#{item.display_order}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0f9ff', color: '#00a3c8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px' }}>
                      {item.icon === 'Award' ? '🏆' :
                       item.icon === 'ShieldCheck' ? '🛡️' :
                       item.icon === 'CheckCircle' ? '✅' :
                       item.icon === 'ShieldAlert' ? '⚠️' :
                       item.icon === 'Star' ? '⭐' :
                       item.icon === 'Shield' ? '🔰' :
                       '🎖️'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0f2b48' }}>{item.title}</td>
                  <td style={{ padding: '16px 20px', color: '#64748b', maxWidth: '300px' }}>{item.description}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: item.status === 'active' ? '#dcfce7' : '#f1f5f9', color: item.status === 'active' ? '#15803d' : '#64748b', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                      {item.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {item.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenEdit(item)} style={{ background: '#f0f9ff', color: '#0284c7', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', marginRight: '8px', fontWeight: '600' }}>
                      <Edit2 size={14} style={{ display: 'inline', marginRight: '4px' }} /> Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                      <Trash2 size={14} style={{ display: 'inline', marginRight: '4px' }} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f2b48', margin: '0 0 20px 0' }}>
              {editingItem ? 'Edit Accreditation' : 'Add New Accreditation'}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Icon Name</label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                >
                  <option value="Award">Award (Trophy 🏆)</option>
                  <option value="ShieldCheck">ShieldCheck (Shield 🛡️)</option>
                  <option value="CheckCircle">CheckCircle (Checkmark ✅)</option>
                  <option value="ShieldAlert">ShieldAlert (Warning ⚠️)</option>
                  <option value="Star">Star (Star ⭐)</option>
                  <option value="Shield">Shield (Insignia 🔰)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NABH"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. National Accreditation Board for Hospitals & Healthcare Providers..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: '#00a3c8', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Saving...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccreditationsManager;
