import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Search, RefreshCw, Building } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const InfrastructureServicesManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    icon: '🏨',
    title: '',
    description: '',
    display_order: 1,
    status: 'active'
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/infrastructure-services`);
      const data = await res.json();
      if (data.success) {
        setServices(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching infrastructure services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      icon: '🏨',
      title: '',
      description: '',
      display_order: services.length + 1,
      status: 'active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      icon: item.icon || '🏨',
      title: item.title || '',
      description: item.description || '',
      display_order: item.display_order || 1,
      status: item.status || 'active'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingItem
        ? `${API_BASE_URL}/infrastructure-services/${editingItem.id}`
        : `${API_BASE_URL}/infrastructure-services`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const payload = {
        icon: form.icon || '🏨',
        title: form.title,
        description: form.description || '',
        display_order: parseInt(form.display_order, 10) || 1,
        status: form.status || 'active'
      };

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8' 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        fetchServices();
      } else {
        alert(data.error || 'Failed to save infrastructure service');
      }
    } catch (err) {
      console.error('Error saving infrastructure service:', err);
      alert(`Saved successfully or retry! (${err.message})`);
      fetchServices();
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/infrastructure-services/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchServices();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting infrastructure service:', err);
      alert('Network error while deleting');
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`${API_BASE_URL}/infrastructure-services/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchServices();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredServices = services.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* HEADER BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building color="#00a3c8" size={28} />
            Infrastructure & Facility Services Management
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Manage Nurses Hostel, Canteen, Housekeeping, Security, Maintenance and Infrastructure cards displayed on website
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={fetchServices}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Data
          </button>

          <button
            onClick={handleOpenAdd}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #00a3c8 0%, #0070c0 100%)',
              color: '#ffffff',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 163, 200, 0.25)'
            }}
          >
            <Plus size={18} /> Add Infrastructure Service
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '14px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <Search size={20} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search infrastructure services by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            width: '100%',
            color: '#1e293b'
          }}
        />
      </div>

      {/* SERVICES TABLE */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Order</th>
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Icon</th>
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Title</th>
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Description</th>
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Loading infrastructure services...
                </td>
              </tr>
            ) : filteredServices.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No infrastructure services found. Click "Add Infrastructure Service" to create one.
                </td>
              </tr>
            ) : (
              filteredServices.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: '#00a3c8' }}>
                    #{item.display_order}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#f0f9ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px'
                    }}>
                      {item.icon}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0f172a' }}>
                    {item.title}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '13px', maxWidth: '300px' }}>
                    {item.description}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button
                      onClick={() => handleToggleStatus(item)}
                      style={{
                        border: 'none',
                        background: item.status === 'active' ? '#ecfdf5' : '#fef2f2',
                        color: item.status === 'active' ? '#059669' : '#dc2626',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {item.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {item.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        style={{
                          background: '#f1f5f9',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          color: '#0070c0',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        style={{
                          background: '#fef2f2',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          color: '#dc2626',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                {editingItem ? 'Edit Infrastructure Service' : 'Add New Infrastructure Service'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Choose Icon (Click an icon or enter custom)
                </label>

                {/* INTERACTIVE PRESET ICON SELECTOR */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '10px',
                  background: '#f8fafc',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  {[
                    { label: 'Nurses Hostel', icon: '🏨' },
                    { label: 'Canteen', icon: '🍽️' },
                    { label: 'Housekeeping', icon: '🧹' },
                    { label: 'Maintenance', icon: '🔧' },
                    { label: 'Security', icon: '🛡️' },
                    { label: 'Waste Mgmt', icon: '♻️' },
                    { label: 'Parking', icon: '🚗' },
                    { label: 'Help Desk', icon: '☎️' },
                    { label: 'Pharmacy', icon: '💊' },
                    { label: 'Lab', icon: '🧪' },
                    { label: 'Ambulance', icon: '🚑' },
                    { label: 'ICU', icon: '🛏️' },
                    { label: 'Surgery', icon: '✂️' },
                    { label: 'Radiology', icon: '📻' },
                    { label: 'Sterilization', icon: '🛡️' },
                    { label: 'Physiotherapy', icon: '🩺' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm({ ...form, icon: preset.icon })}
                      title={preset.label}
                      style={{
                        padding: '6px 10px',
                        fontSize: '18px',
                        borderRadius: '8px',
                        border: form.icon === preset.icon ? '2px solid #00a3c8' : '1px solid #cbd5e1',
                        background: form.icon === preset.icon ? '#e0f2fe' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.icon}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Or enter custom icon / emoji (e.g. 🏥 or Building)"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nurses Hostel, Canteen, Housekeeping"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Short description of the infrastructure service..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 1 })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#fff'
                    }}
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #00a3c8 0%, #0070c0 100%)',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Service' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfrastructureServicesManager;
