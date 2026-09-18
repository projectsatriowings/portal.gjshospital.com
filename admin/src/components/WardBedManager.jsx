import React, { useState, useEffect } from 'react';
import { Building2, BedDouble, Plus, Edit, Trash2, X, Activity, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function WardBedManager({ authFetch, user }) {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWard, setSelectedWard] = useState(null);
  const [beds, setBeds] = useState([]);

  // Ward Modal
  const [showWardModal, setShowWardModal] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [wardForm, setWardForm] = useState({
    name: '',
    room_type: 'General',
    daily_rate: '',
    total_beds: ''
  });

  // Bed Modal (Status Change)
  const [showBedModal, setShowBedModal] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [bedStatus, setBedStatus] = useState('');

  // Add Bed Modal
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [newBedNumber, setNewBedNumber] = useState('');

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/wards`);
      const data = await res.json();
      if (data.success) setWards(data.data || []);
    } catch (err) {
      console.error('Error fetching wards:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async (wardId) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/beds?wardId=${wardId}`);
      const data = await res.json();
      if (data.success) setBeds(data.data || []);
    } catch (err) {
      console.error('Error fetching beds:', err);
    }
  };

  const handleSelectWard = async (ward) => {
    setSelectedWard(ward);
    await fetchBeds(ward.id);
  };

  const handleOpenWardModal = (ward = null) => {
    if (ward) {
      setEditingWard(ward);
      setWardForm({
        name: ward.name,
        room_type: ward.room_type,
        daily_rate: ward.daily_rate,
        total_beds: ward.total_beds
      });
    } else {
      setEditingWard(null);
      setWardForm({ name: '', room_type: 'General', daily_rate: '', total_beds: '' });
    }
    setShowWardModal(true);
  };

  const handleSaveWard = async (e) => {
    e.preventDefault();
    try {
      const url = editingWard 
        ? `${API_BASE_URL}/admin/ipd/wards/${editingWard.id}` 
        : `${API_BASE_URL}/admin/ipd/wards`;
      const method = editingWard ? 'PUT' : 'POST';
      
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wardForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowWardModal(false);
        fetchWards();
        if (editingWard && selectedWard?.id === editingWard.id) {
          setSelectedWard({ ...selectedWard, ...wardForm });
        }
      } else {
        alert(data.error || 'Failed to save ward');
      }
    } catch (err) {
      console.error('Error saving ward:', err);
    }
  };

  const handleDeleteWard = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/wards/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (selectedWard?.id === id) setSelectedWard(null);
        fetchWards();
      } else {
        alert(data.error || 'Failed to delete ward');
      }
    } catch (err) {
      console.error('Error deleting ward:', err);
    }
  };

  const handleOpenBedModal = (bed) => {
    if (bed.status === 'OCCUPIED') {
      alert('Cannot change status of an OCCUPIED bed directly. Please use Admission/Discharge workflow.');
      return;
    }
    setEditingBed(bed);
    setBedStatus(bed.status);
    setShowBedModal(true);
  };

  const handleSaveBedStatus = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/beds/${editingBed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: bedStatus })
      });
      const data = await res.json();
      if (data.success) {
        setShowBedModal(false);
        if (selectedWard) fetchBeds(selectedWard.id);
        fetchWards(); // Update bed counts in ward list
      } else {
        alert(data.error || 'Failed to update bed');
      }
    } catch (err) {
      console.error('Error updating bed:', err);
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/beds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ward_id: selectedWard.id, bed_number: newBedNumber })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddBedModal(false);
        setNewBedNumber('');
        fetchBeds(selectedWard.id);
        fetchWards();
      } else {
        alert(data.error || 'Failed to add bed');
      }
    } catch (err) {
      console.error('Error adding bed:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
      case 'OCCUPIED': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      case 'RESERVED': return { bg: '#fef9c3', text: '#a16207', border: '#fef08a' };
      case 'MAINTENANCE': return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>Ward & Bed Management</h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Manage hospital wards, room types, and bed availability</p>
        </div>
        <button
          onClick={() => handleOpenWardModal()}
          style={{ background: 'linear-gradient(135deg, #0070c0, #004861)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Add New Ward
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedWard ? '1fr 2fr' : '1fr', gap: '24px' }}>
        
        {/* WARDS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Loading wards...</div>
          ) : wards.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>No wards found.</div>
          ) : (
            wards.map(ward => (
              <div 
                key={ward.id} 
                onClick={() => handleSelectWard(ward)}
                style={{ 
                  background: '#ffffff', 
                  borderRadius: '16px', 
                  border: selectedWard?.id === ward.id ? '2px solid #0070c0' : '1px solid #e2e8f0', 
                  padding: '20px', 
                  cursor: 'pointer',
                  boxShadow: selectedWard?.id === ward.id ? '0 4px 12px rgba(0,112,192,0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>{ward.name}</h3>
                    <span style={{ fontSize: '12px', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>{ward.room_type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenWardModal(ward); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Edit size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteWard(ward.id, ward.name); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                  <strong>₹{parseFloat(ward.daily_rate).toFixed(2)}</strong> / day
                </div>

                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: '700' }}>
                  <span style={{ background: '#f8fafc', color: '#475569', padding: '4px 8px', borderRadius: '6px' }}>Total: {ward.total_beds}</span>
                  <span style={{ background: '#f0fdf4', color: '#15803d', padding: '4px 8px', borderRadius: '6px' }}>Avail: {ward.available_beds || 0}</span>
                  <span style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px' }}>Occ: {ward.occupied_beds || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* BED GRID */}
        {selectedWard && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>Beds in {selectedWard.name}</h2>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Click a bed to update its status.</p>
              </div>
              <button
                onClick={() => setShowAddBedModal(true)}
                style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Plus size={16} /> Add Bed
              </button>
            </div>

            {beds.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                No beds configured for this ward.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
                {beds.map(bed => {
                  const colors = getStatusColor(bed.status);
                  return (
                    <div
                      key={bed.id}
                      onClick={() => handleOpenBedModal(bed)}
                      style={{
                        background: colors.bg,
                        border: `1.5px solid ${colors.border}`,
                        borderRadius: '12px',
                        padding: '16px 10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.1s'
                      }}
                      title={`Status: ${bed.status}`}
                    >
                      <BedDouble size={28} color={colors.text} style={{ marginBottom: '8px', opacity: 0.8 }} />
                      <div style={{ fontSize: '15px', fontWeight: '800', color: colors.text, marginBottom: '4px' }}>{bed.bed_number}</div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: colors.text, textTransform: 'uppercase' }}>{bed.status}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD/EDIT WARD MODAL */}
      {showWardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '20px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>{editingWard ? 'Edit Ward' : 'Add New Ward'}</h2>
            <form onSubmit={handleSaveWard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Ward Name *</label>
                <input type="text" required value={wardForm.name} onChange={e => setWardForm({...wardForm, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Room Type</label>
                <select value={wardForm.room_type} onChange={e => setWardForm({...wardForm, room_type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="General">General</option>
                  <option value="Semi-Private">Semi-Private</option>
                  <option value="Private">Private</option>
                  <option value="ICU">ICU</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="NICU">NICU</option>
                  <option value="PICU">PICU</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Daily Rate (₹) *</label>
                  <input type="number" step="0.01" required value={wardForm.daily_rate} onChange={e => setWardForm({...wardForm, daily_rate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Total Beds *</label>
                  <input type="number" required value={wardForm.total_beds} onChange={e => setWardForm({...wardForm, total_beds: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} disabled={!!editingWard} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowWardModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#0070c0', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>Save Ward</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BED STATUS MODAL */}
      {showBedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '20px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Change Bed Status: {editingBed?.bed_number}</h2>
            <form onSubmit={handleSaveBedStatus} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Status</label>
                <select value={bedStatus} onChange={e => setBedStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowBedModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#0070c0', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD BED MODAL */}
      {showAddBedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '20px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Add Bed to {selectedWard?.name}</h2>
            <form onSubmit={handleAddBed} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Bed Number / Identifier *</label>
                <input type="text" required value={newBedNumber} onChange={e => setNewBedNumber(e.target.value)} placeholder="e.g. B-101" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddBedModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#0070c0', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>Add Bed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
