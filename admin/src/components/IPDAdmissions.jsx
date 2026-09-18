import React, { useState, useEffect } from 'react';
import { BedDouble, Plus, Search, User, UserCheck, CheckCircle2, FileText, Calendar, Activity, X } from 'lucide-react';

import { API_BASE_URL, getFileUrl } from '../config/api';

export default function IPDAdmissions({ authFetch, user }) {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState('LIST'); // LIST, DETAIL
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  
  // New Admission Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchMobile, setSearchMobile] = useState('');
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [patientFound, setPatientFound] = useState(false);
  
  const [doctors, setDoctors] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [groupedBeds, setGroupedBeds] = useState({});
  
  const [admForm, setAdmForm] = useState({
    patient_id: '',
    name: '',
    mobile: '',
    doctor_id: '',
    bed_id: '',
    admission_reason: '',
    expected_discharge_date: ''
  });

  // Notes & Discharge
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ note_type: 'GENERAL_NOTE', content: '', temperature: '', blood_pressure: '', pulse: '', spo2: '' });
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargeForm, setDischargeForm] = useState({ diagnosis: '', treatment_summary: '', discharge_instructions: '', follow_up_date: '' });
  const [activeDetailTab, setActiveDetailTab] = useState('rounds');
  const [bill, setBill] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [newBillItem, setNewBillItem] = useState({ category: 'LABORATORY', description: '', amount: '', quantity: '1' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', quantity: '' });

  useEffect(() => {
    if (viewState === 'LIST') fetchAdmissions();
  }, [statusFilter, searchQuery, viewState]);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const q = `status=${statusFilter !== 'ALL' ? statusFilter : ''}&search=${encodeURIComponent(searchQuery)}`;
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/admissions?${q}`);
      const data = await res.json();
      if (data.success) setAdmissions(data.data || []);
    } catch (err) {
      console.error('Error fetching admissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewModal = async () => {
    setShowNewModal(true);
    setSearchMobile('');
    setPatientFound(false);
    setAdmForm({ patient_id: '', name: '', mobile: '', doctor_id: '', bed_id: '', admission_reason: '', expected_discharge_date: '' });
    
    try {
      const docRes = await authFetch(`${API_BASE_URL}/doctors`);
      const docData = await docRes.json();
      if (docData.success) setDoctors(docData.data || []);
      
      const bedRes = await authFetch(`${API_BASE_URL}/admin/ipd/beds?status=AVAILABLE`);
      const bedData = await bedRes.json();
      if (bedData.success) {
        setAvailableBeds(bedData.data || []);
        const grouped = {};
        bedData.data.forEach(b => {
          if (!grouped[b.ward_name]) grouped[b.ward_name] = [];
          grouped[b.ward_name].push(b);
        });
        setGroupedBeds(grouped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePatientSearch = async () => {
    if (!searchMobile.trim()) return;
    setSearchingPatient(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/patients?search=${encodeURIComponent(searchMobile.trim())}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const p = data.data[0];
        setPatientFound(true);
        setAdmForm(prev => ({ ...prev, patient_id: p.id, name: p.name, mobile: p.mobile }));
      } else {
        setPatientFound(false);
        setAdmForm(prev => ({ ...prev, patient_id: '', name: '', mobile: searchMobile }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleNewAdmissionSubmit = async (e) => {
    e.preventDefault();
    if (!admForm.name || !admForm.mobile || !admForm.bed_id || !admForm.doctor_id) {
      alert('Required fields missing.');
      return;
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/admissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowNewModal(false);
        fetchAdmissions();
      } else {
        alert(data.error || 'Admission failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotes = async (admId) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/admissions/${admId}/notes`);
      const data = await res.json();
      if (data.success) setNotes(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBillDetails = async (admId) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/admissions/${admId}/bill`);
      const data = await res.json();
      if (data.success) {
        setBill(data.bill);
        setBillItems(data.items || []);
        if (data.bill) {
          const outstanding = Math.max(0, (data.bill.total_amount || 0) - (data.bill.paid_amount || 0));
          setPaymentAmount(outstanding.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching bill:', err);
    }
  };

  const handleAddBillItem = async (e, categoryOverride = null) => {
    if (e) e.preventDefault();
    const category = categoryOverride || newBillItem.category;
    const description = newBillItem.description;
    const amount = newBillItem.amount;
    const quantity = newBillItem.quantity;

    if (!description || amount === '') {
      alert('Description and amount are required.');
      return;
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/admissions/${selectedAdmission.id}/bill-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, description, amount, quantity })
      });
      const data = await res.json();
      if (data.success) {
        setNewBillItem({ category: category, description: '', amount: '', quantity: '1' });
        await fetchBillDetails(selectedAdmission.id);
        alert('Service added to consolidated IPD bill successfully!');
      } else {
        alert(data.error || 'Failed to add charge');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditForm({ description: item.description, amount: item.amount, quantity: item.quantity });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditForm({ description: '', amount: '', quantity: '' });
  };

  const handleSaveEdit = async (itemId) => {
    if (!editForm.description || editForm.amount === '' || parseInt(editForm.quantity) <= 0) {
      alert('Valid description, amount and quantity are required');
      return;
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/admissions/${selectedAdmission.id}/bill-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editForm.description,
          amount: parseFloat(editForm.amount),
          quantity: parseInt(editForm.quantity)
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingItemId(null);
        await fetchBillDetails(selectedAdmission.id);
      } else {
        alert(data.error || 'Failed to update item');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating item');
    }
  };

  const handleDeleteBillItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/admissions/${selectedAdmission.id}/bill-items/${itemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await fetchBillDetails(selectedAdmission.id);
      } else {
        alert(data.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting item');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!bill || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Valid payment amount is required');
      return;
    }
    setProcessingPayment(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/bills/${bill.id}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(paymentAmount), paymentMethod })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Payment recorded successfully!');
        await fetchBillDetails(selectedAdmission.id);
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!bill) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/bills/${bill.id}/pdf`);
      const data = await res.json();
      if (data.success && data.pdfUrl) {
        window.open(getFileUrl(data.pdfUrl), '_blank');
      } else {
        alert(data.error || 'Failed to generate PDF');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetail = async (adm) => {
    setSelectedAdmission(adm);
    setViewState('DETAIL');
    setActiveDetailTab('rounds');
    await Promise.all([fetchNotes(adm.id), fetchBillDetails(adm.id)]);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/admissions/${selectedAdmission.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote)
      });
      const data = await res.json();
      if (data.success) {
        setNewNote({ note_type: 'GENERAL_NOTE', content: '', temperature: '', blood_pressure: '', pulse: '', spo2: '' });
        fetchNotes(selectedAdmission.id);
      } else {
        alert(data.error || 'Failed to add note');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/ipd/admissions/${selectedAdmission.id}/discharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dischargeForm)
      });
      const data = await res.json();
      if (data.success) {
        alert('Patient discharged successfully!');
        setShowDischargeModal(false);
        setViewState('LIST');
      } else {
        alert(data.error || 'Discharge failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'ADMITTED') return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#dcfce7', color: '#15803d' }}>ADMITTED</span>;
    if (status === 'DISCHARGED') return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#e0f2fe', color: '#0369a1' }}>DISCHARGED</span>;
    if (status === 'TRANSFERRED') return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: '#fef3c7', color: '#b45309' }}>TRANSFERRED</span>;
    return <span>{status}</span>;
  };

  if (viewState === 'DETAIL' && selectedAdmission) {
    return (
      <div style={{ padding: '24px' }}>
        <button onClick={() => setViewState('LIST')} style={{ background: 'none', border: 'none', color: '#0070c0', cursor: 'pointer', marginBottom: '16px', fontWeight: '700' }}>← Back to List</button>
        
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{selectedAdmission.patient_name}</h1>
              <p style={{ margin: 0, color: '#64748b' }}>UHID: <strong>{selectedAdmission.uhid}</strong> | Mobile: {selectedAdmission.mobile}</p>
              <div style={{ marginTop: '12px' }}>{getStatusBadge(selectedAdmission.status)}</div>
            </div>
            {(user?.role === 'DOCTOR' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'SUPER_ADMIN') && selectedAdmission.status === 'ADMITTED' && (
              <button onClick={() => setShowDischargeModal(true)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Discharge Patient</button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Ward / Bed</div>
              <div style={{ fontWeight: '800', color: '#0f172a' }}>{selectedAdmission.ward_name} - {selectedAdmission.bed_number}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Attending Doctor</div>
              <div style={{ fontWeight: '800', color: '#0f172a' }}>{selectedAdmission.doctor_name || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Admission Date</div>
              <div style={{ fontWeight: '800', color: '#0f172a' }}>{new Date(selectedAdmission.admission_date).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Scrollbar and UI Custom Styling */}
        <style>{`
          .ipd-tabs-container::-webkit-scrollbar {
            height: 5px;
          }
          .ipd-tabs-container::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .ipd-tabs-container::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .ipd-tabs-container::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .ipd-detail-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
          }
          @media (min-width: 1024px) {
            .ipd-detail-grid {
              grid-template-columns: minmax(0, 2.3fr) minmax(320px, 1fr);
            }
          }
        `}</style>

        {/* Detail Tabs Bar */}
        <div className="ipd-tabs-container" style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
          <button 
            type="button"
            onClick={() => setActiveDetailTab('rounds')} 
            style={{ padding: '12px 18px', background: 'none', border: 'none', borderBottom: activeDetailTab === 'rounds' ? '3px solid #0070c0' : 'none', color: activeDetailTab === 'rounds' ? '#0070c0' : '#64748b', fontWeight: '750', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
          >
            🩺 Doctor Rounds & Timeline
          </button>
          <button 
            type="button"
            onClick={() => {
              setActiveDetailTab('laboratory');
              setNewBillItem({ category: 'LABORATORY', description: '', amount: '', quantity: '1' });
            }} 
            style={{ padding: '12px 18px', background: 'none', border: 'none', borderBottom: activeDetailTab === 'laboratory' ? '3px solid #0070c0' : 'none', color: activeDetailTab === 'laboratory' ? '#0070c0' : '#64748b', fontWeight: '750', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
          >
            🧪 Laboratory
          </button>
          <button 
            type="button"
            onClick={() => {
              setActiveDetailTab('pharmacy');
              setNewBillItem({ category: 'PHARMACY', description: '', amount: '', quantity: '1' });
            }} 
            style={{ padding: '12px 18px', background: 'none', border: 'none', borderBottom: activeDetailTab === 'pharmacy' ? '3px solid #0070c0' : 'none', color: activeDetailTab === 'pharmacy' ? '#0070c0' : '#64748b', fontWeight: '750', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
          >
            💊 Pharmacy
          </button>
          <button 
            type="button"
            onClick={() => {
              setActiveDetailTab('radiology');
              setNewBillItem({ category: 'RADIOLOGY', description: '', amount: '', quantity: '1' });
            }} 
            style={{ padding: '12px 18px', background: 'none', border: 'none', borderBottom: activeDetailTab === 'radiology' ? '3px solid #0070c0' : 'none', color: activeDetailTab === 'radiology' ? '#0070c0' : '#64748b', fontWeight: '750', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
          >
            📷 Radiology
          </button>
          <button 
            type="button"
            onClick={() => {
              setActiveDetailTab('procedures');
              setNewBillItem({ category: 'PROCEDURE', description: '', amount: '', quantity: '1' });
            }} 
            style={{ padding: '12px 18px', background: 'none', border: 'none', borderBottom: activeDetailTab === 'procedures' ? '3px solid #0070c0' : 'none', color: activeDetailTab === 'procedures' ? '#0070c0' : '#64748b', fontWeight: '750', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
          >
            🔪 Procedures & Services
          </button>
          {(user?.role !== 'RECEPTIONIST' || selectedAdmission.status === 'DISCHARGED') && (
            <button 
              type="button"
              onClick={() => setActiveDetailTab('billing')} 
              style={{ padding: '12px 18px', background: 'none', border: 'none', borderBottom: activeDetailTab === 'billing' ? '3px solid #0070c0' : 'none', color: activeDetailTab === 'billing' ? '#0070c0' : '#64748b', fontWeight: '750', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            >
              🧾 Consolidated Billing
            </button>
          )}
        </div>

        {/* Tab Contents */}
        {activeDetailTab === 'rounds' && (
          <div className="ipd-detail-grid">
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Nursing Notes & Timeline</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {notes.length === 0 ? <p style={{ color: '#64748b' }}>No notes yet.</p> : notes.map(note => (
                  <div key={note.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', borderLeft: note.note_type === 'VITALS' ? '4px solid #0284c7' : note.note_type === 'MEDICATION_GIVEN' ? '4px solid #16a34a' : note.note_type === 'DOCTOR_ROUND' ? '4px solid #8b5cf6' : '4px solid #64748b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                        {note.note_type === 'DOCTOR_ROUND' ? 'DOCTOR ROUND' : note.note_type === 'GENERAL_NOTE' ? 'GENERAL NOTE' : note.note_type === 'MEDICATION_GIVEN' ? 'MEDICATION GIVEN' : note.note_type}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(note.recorded_at || note.created_at).toLocaleString()}</span>
                    </div>
                    {note.note && <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#334155' }}>{note.note}</p>}
                    {note.note_type === 'VITALS' && note.vitals && (
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#475569', background: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        {note.vitals.temperature && <span>Temp: <strong>{note.vitals.temperature}°F</strong></span>}
                        {note.vitals.bloodPressure && <span>BP: <strong>{note.vitals.bloodPressure}</strong></span>}
                        {note.vitals.pulse && <span>Pulse: <strong>{note.vitals.pulse} bpm</strong></span>}
                        {note.vitals.spo2 && <span>SpO2: <strong>{note.vitals.spo2}%</strong></span>}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', textAlign: 'right' }}>Logged by: {note.recorded_by_name || 'Medical Staff'}</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedAdmission.status === 'ADMITTED' && (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', alignSelf: 'start' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Add Note / Round Details</h3>
                <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <select value={newNote.note_type} onChange={e => setNewNote({...newNote, note_type: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="GENERAL_NOTE">General Note</option>
                    <option value="VITALS">Vitals Log</option>
                    <option value="MEDICATION_GIVEN">Medication Given</option>
                    <option value="DOCTOR_ROUND">Doctor Round Summary</option>
                  </select>
                  
                  {newNote.note_type === 'VITALS' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input type="text" placeholder="Temp (°F)" value={newNote.temperature} onChange={e => setNewNote({...newNote, temperature: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="BP (mmHg)" value={newNote.blood_pressure} onChange={e => setNewNote({...newNote, blood_pressure: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="Pulse (bpm)" value={newNote.pulse} onChange={e => setNewNote({...newNote, pulse: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <input type="text" placeholder="SpO2 (%)" value={newNote.spo2} onChange={e => setNewNote({...newNote, spo2: e.target.value})} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                  )}
                  
                  <textarea 
                    placeholder="Describe notes, vitals, or clinical round feedback..." 
                    required
                    value={newNote.content} 
                    onChange={e => setNewNote({...newNote, content: e.target.value})} 
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '85px' }}
                  />
                  
                  <button type="submit" style={{ background: '#0070c0', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Submit Entry</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'laboratory' && (
          <div className="ipd-detail-grid">
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Laboratory Test Orders</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
                      <th style={{ padding: '10px' }}>Test Description</th>
                      <th style={{ padding: '10px' }}>Date & Time</th>
                      <th style={{ padding: '10px' }}>Rate</th>
                      <th style={{ padding: '10px' }}>Qty</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total Cost</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.filter(item => item.category === 'LABORATORY').length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No laboratory tests ordered yet.</td></tr>
                    ) : (
                      billItems.filter(item => item.category === 'LABORATORY').map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {editingItemId === item.id ? (
                            <>
                              <td style={{ padding: '12px' }}>
                                <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }} />
                              </td>
                              <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(item.created_at)}</td>
                              <td style={{ padding: '12px' }}>
                                <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '80px' }} />
                              </td>
                              <td style={{ padding: '12px' }}>
                                <input type="number" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '60px' }} />
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{(parseFloat(editForm.amount || 0) * parseInt(editForm.quantity || 0)).toFixed(2)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <button onClick={() => handleSaveEdit(item.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontWeight: 'bold' }}>Save</button>
                                <button onClick={handleCancelEdit} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '12px', fontWeight: '600' }}>{item.description}</td>
                              <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(item.created_at)}</td>
                              <td style={{ padding: '12px' }}>₹{item.amount}</td>
                              <td style={{ padding: '12px' }}>{item.quantity}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{(item.amount * item.quantity).toFixed(2)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <button onClick={() => handleStartEdit(item)} style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                                <button onClick={() => handleDeleteBillItem(item.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedAdmission.status === 'ADMITTED' && (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', alignSelf: 'start' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Order Lab Test</h3>
                <form onSubmit={e => handleAddBillItem(e, 'LABORATORY')} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Test Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Complete Blood Count (CBC)" 
                      value={newBillItem.description} 
                      onChange={e => setNewBillItem({...newBillItem, description: e.target.value})} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Rate (₹) *</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Cost in rupees" 
                      value={newBillItem.amount} 
                      onChange={e => setNewBillItem({...newBillItem, amount: e.target.value})} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <button type="submit" style={{ background: '#0070c0', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>Order Lab Test</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'pharmacy' && (
          <div className="ipd-detail-grid">
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Pharmacy & Medicines</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
                      <th style={{ padding: '10px' }}>Medicine Name</th>
                      <th style={{ padding: '10px' }}>Date & Time</th>
                      <th style={{ padding: '10px' }}>Unit Price</th>
                      <th style={{ padding: '10px' }}>Qty</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total Cost</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.filter(item => item.category === 'PHARMACY').length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No medicines issued yet.</td></tr>
                    ) : (
                      billItems.filter(item => item.category === 'PHARMACY').map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {editingItemId === item.id ? (
                            <>
                              <td style={{ padding: '12px' }}>
                                <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }} />
                              </td>
                              <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(item.created_at)}</td>
                              <td style={{ padding: '12px' }}>
                                <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '80px' }} />
                              </td>
                              <td style={{ padding: '12px' }}>
                                <input type="number" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '60px' }} />
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{(parseFloat(editForm.amount || 0) * parseInt(editForm.quantity || 0)).toFixed(2)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <button onClick={() => handleSaveEdit(item.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontWeight: 'bold' }}>Save</button>
                                <button onClick={handleCancelEdit} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '12px', fontWeight: '600' }}>{item.description}</td>
                              <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(item.created_at)}</td>
                              <td style={{ padding: '12px' }}>₹{item.amount}</td>
                              <td style={{ padding: '12px' }}>{item.quantity}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{(item.amount * item.quantity).toFixed(2)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <button onClick={() => handleStartEdit(item)} style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                                <button onClick={() => handleDeleteBillItem(item.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedAdmission.status === 'ADMITTED' && (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', alignSelf: 'start' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Issue Medicine</h3>
                <form onSubmit={e => handleAddBillItem(e, 'PHARMACY')} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Medicine Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Paracetamol 650mg" 
                      value={newBillItem.description} 
                      onChange={e => setNewBillItem({...newBillItem, description: e.target.value})} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Unit Price (₹) *</label>
                      <input 
                        type="number" 
                        required
                        placeholder="Cost" 
                        value={newBillItem.amount} 
                        onChange={e => setNewBillItem({...newBillItem, amount: e.target.value})} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Quantity *</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="Qty" 
                        value={newBillItem.quantity} 
                        onChange={e => setNewBillItem({...newBillItem, quantity: e.target.value})} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                  <button type="submit" style={{ background: '#0070c0', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>Issue Medicine</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'radiology' && (
          <div className="ipd-detail-grid">
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Radiology Scan Orders</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
                      <th style={{ padding: '10px' }}>Scan Description</th>
                      <th style={{ padding: '10px' }}>Date & Time</th>
                      <th style={{ padding: '10px' }}>Rate</th>
                      <th style={{ padding: '10px' }}>Qty</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total Cost</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.filter(item => item.category === 'RADIOLOGY').length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No radiology scans ordered yet.</td></tr>
                    ) : (
                      billItems.filter(item => item.category === 'RADIOLOGY').map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {editingItemId === item.id ? (
                            <>
                              <td style={{ padding: '12px' }}>
                                <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }} />
                              </td>
                              <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(item.created_at)}</td>
                              <td style={{ padding: '12px' }}>
                                <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '80px' }} />
                              </td>
                              <td style={{ padding: '12px' }}>
                                <input type="number" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '60px' }} />
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{(parseFloat(editForm.amount || 0) * parseInt(editForm.quantity || 0)).toFixed(2)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <button onClick={() => handleSaveEdit(item.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontWeight: 'bold' }}>Save</button>
                                <button onClick={handleCancelEdit} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '12px', fontWeight: '600' }}>{item.description}</td>
                              <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(item.created_at)}</td>
                              <td style={{ padding: '12px' }}>₹{item.amount}</td>
                              <td style={{ padding: '12px' }}>{item.quantity}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{(item.amount * item.quantity).toFixed(2)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <button onClick={() => handleStartEdit(item)} style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                                <button onClick={() => handleDeleteBillItem(item.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedAdmission.status === 'ADMITTED' && (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', alignSelf: 'start' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Order Radiology Scan</h3>
                <form onSubmit={e => handleAddBillItem(e, 'RADIOLOGY')} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Scan Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Chest X-Ray PA View" 
                      value={newBillItem.description} 
                      onChange={e => setNewBillItem({...newBillItem, description: e.target.value})} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Rate (₹) *</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Cost of scan" 
                      value={newBillItem.amount} 
                      onChange={e => setNewBillItem({...newBillItem, amount: e.target.value})} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <button type="submit" style={{ background: '#0070c0', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>Order Scan</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'procedures' && (
          <div className="ipd-detail-grid">
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Procedures, Nursing & Services</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
                      <th style={{ padding: '10px' }}>Category</th>
                      <th style={{ padding: '10px' }}>Description</th>
                      <th style={{ padding: '10px' }}>Date & Time</th>
                      <th style={{ padding: '10px' }}>Rate</th>
                      <th style={{ padding: '10px' }}>Qty</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total Cost</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.filter(item => ['PROCEDURE', 'NURSING_CHARGE', 'OTHER'].includes(item.category)).length === 0 ? (
                      <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No procedures, nursing services, or other charges logged yet.</td></tr>
                    ) : (
                      billItems.filter(item => ['PROCEDURE', 'NURSING_CHARGE', 'OTHER'].includes(item.category)).map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {editingItemId === item.id ? (
                            <>
                              <td style={{ padding: '12px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', background: item.category === 'NURSING_CHARGE' ? '#e0f2fe' : item.category === 'PROCEDURE' ? '#ffe4e6' : '#f1f5f9', color: item.category === 'NURSING_CHARGE' ? '#0369a1' : item.category === 'PROCEDURE' ? '#e11d48' : '#475569' }}>
                                  {item.category === 'NURSING_CHARGE' ? 'NURSING' : item.category}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }} />
                              </td>
                              <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(item.created_at)}</td>
                              <td style={{ padding: '12px' }}>
                                <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '80px' }} />
                              </td>
                              <td style={{ padding: '12px' }}>
                                <input type="number" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '60px' }} />
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{(parseFloat(editForm.amount || 0) * parseInt(editForm.quantity || 0)).toFixed(2)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <button onClick={() => handleSaveEdit(item.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontWeight: 'bold' }}>Save</button>
                                <button onClick={handleCancelEdit} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '12px' }}>
                                <span style={{ 
                                  padding: '2px 8px', 
                                  borderRadius: '10px', 
                                  fontSize: '10px', 
                                  fontWeight: '800',
                                  background: item.category === 'NURSING_CHARGE' ? '#e0f2fe' : item.category === 'PROCEDURE' ? '#ffe4e6' : '#f1f5f9',
                                  color: item.category === 'NURSING_CHARGE' ? '#0369a1' : item.category === 'PROCEDURE' ? '#e11d48' : '#475569'
                                }}>
                                  {item.category === 'NURSING_CHARGE' ? 'NURSING' : item.category}
                                </span>
                              </td>
                              <td style={{ padding: '12px', fontWeight: '600' }}>{item.description}</td>
                              <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(item.created_at)}</td>
                              <td style={{ padding: '12px' }}>₹{item.amount}</td>
                              <td style={{ padding: '12px' }}>{item.quantity}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{(item.amount * item.quantity).toFixed(2)}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                {selectedAdmission.status === 'ADMITTED' && (
                                  <>
                                    <button onClick={() => handleStartEdit(item)} style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                                    <button onClick={() => handleDeleteBillItem(item.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                                  </>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedAdmission.status === 'ADMITTED' && (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', alignSelf: 'start' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Log Service / Charge</h3>
                <form onSubmit={e => handleAddBillItem(e, newBillItem.category)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Service Category *</label>
                    <select 
                      value={newBillItem.category} 
                      onChange={e => setNewBillItem({...newBillItem, category: e.target.value})} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="PROCEDURE">Procedure / Surgery</option>
                      <option value="NURSING_CHARGE">Nursing / Consumables (e.g. IV Drip)</option>
                      <option value="OTHER">Other Hospital Service</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Description *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. IV Saline / Dressing / Consultation" 
                      value={newBillItem.description} 
                      onChange={e => setNewBillItem({...newBillItem, description: e.target.value})} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Rate (₹) *</label>
                      <input 
                        type="number" 
                        required
                        placeholder="Cost" 
                        value={newBillItem.amount} 
                        onChange={e => setNewBillItem({...newBillItem, amount: e.target.value})} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Quantity *</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="Qty" 
                        value={newBillItem.quantity} 
                        onChange={e => setNewBillItem({...newBillItem, quantity: e.target.value})} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                  <button type="submit" style={{ background: '#0070c0', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>Log Service</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'billing' && bill && (
          <div className="ipd-detail-grid">
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Consolidated IPD Invoice Details</h3>
                <button type="button" onClick={handleDownloadInvoice} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Download Invoice PDF</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block' }}>INVOICE NUMBER</span>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{bill.bill_number}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block' }}>BILLING STATUS</span>
                  {bill.status === 'PAID' ? (
                    <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: '800' }}>PAID</span>
                  ) : (
                    <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#fff7ed', color: '#ea580c', fontSize: '11px', fontWeight: '800' }}>PENDING</span>
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block' }}>OUTSTANDING</span>
                  <strong style={{ fontSize: '14px', color: '#ef4444' }}>₹{parseFloat(bill.total_amount - bill.paid_amount || 0).toFixed(2)}</strong>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
                      <th style={{ padding: '10px' }}>Category</th>
                      <th style={{ padding: '10px' }}>Description</th>
                      <th style={{ padding: '10px' }}>Date & Time</th>
                      <th style={{ padding: '10px' }}>Unit Cost</th>
                      <th style={{ padding: '10px' }}>Qty</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {editingItemId === item.id ? (
                          <>
                            <td style={{ padding: '12px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', background: item.category === 'ROOM_CHARGE' ? '#e0e7ff' : item.category === 'LABORATORY' ? '#dbeafe' : item.category === 'PHARMACY' ? '#ccfbf1' : item.category === 'RADIOLOGY' ? '#f3e8ff' : item.category === 'PROCEDURE' ? '#ffe4e6' : '#f1f5f9', color: item.category === 'ROOM_CHARGE' ? '#4f46e5' : item.category === 'LABORATORY' ? '#2563eb' : item.category === 'PHARMACY' ? '#0d9488' : item.category === 'RADIOLOGY' ? '#7c3aed' : item.category === 'PROCEDURE' ? '#e11d48' : '#475569' }}>
                                {item.category}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }} />
                            </td>
                            <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(item.created_at)}</td>
                            <td style={{ padding: '12px' }}>
                              <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '80px' }} />
                            </td>
                            <td style={{ padding: '12px' }}>
                              <input type="number" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '60px' }} />
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '750' }}>₹{(parseFloat(editForm.amount || 0) * parseInt(editForm.quantity || 0)).toFixed(2)}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button onClick={() => handleSaveEdit(item.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px', fontWeight: 'bold' }}>Save</button>
                              <button onClick={handleCancelEdit} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '12px' }}>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: '10px', 
                                fontSize: '10px', 
                                fontWeight: '800',
                                background: item.category === 'ROOM_CHARGE' ? '#e0e7ff' : item.category === 'LABORATORY' ? '#dbeafe' : item.category === 'PHARMACY' ? '#ccfbf1' : item.category === 'RADIOLOGY' ? '#f3e8ff' : item.category === 'PROCEDURE' ? '#ffe4e6' : '#f1f5f9',
                                color: item.category === 'ROOM_CHARGE' ? '#4f46e5' : item.category === 'LABORATORY' ? '#2563eb' : item.category === 'PHARMACY' ? '#0d9488' : item.category === 'RADIOLOGY' ? '#7c3aed' : item.category === 'PROCEDURE' ? '#e11d48' : '#475569'
                              }}>
                                {item.category}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: '600' }}>{item.description}</td>
                            <td style={{ padding: '12px', color: '#64748b' }}>{formatDateTime(item.created_at)}</td>
                            <td style={{ padding: '12px' }}>₹{item.amount}</td>
                            <td style={{ padding: '12px' }}>{item.quantity}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '750' }}>₹{(item.amount * item.quantity).toFixed(2)}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button onClick={() => handleStartEdit(item)} style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                              <button onClick={() => handleDeleteBillItem(item.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'right', borderTop: '2px dashed #e2e8f0', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>SUBTOTAL: <span style={{ color: '#0f172a' }}>₹{parseFloat(bill.total_amount || 0).toFixed(2)}</span></div>
                <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: '700', marginTop: '6px' }}>PAID AMOUNT: <span>₹{parseFloat(bill.paid_amount || 0).toFixed(2)}</span></div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginTop: '10px' }}>GRAND TOTAL: <span style={{ color: '#0070c0' }}>₹{parseFloat(bill.total_amount || 0).toFixed(2)}</span></div>
              </div>
            </div>

            {selectedAdmission.status === 'DISCHARGED' && bill.status !== 'PAID' && (
              user?.role === 'RECEPTIONIST' ? (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', alignSelf: 'start' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>Record Bill Payment</h3>
                  <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Payment Amount (₹)</label>
                      <input 
                        type="number" 
                        required
                        placeholder="Amount to collect" 
                        value={paymentAmount} 
                        onChange={e => setPaymentAmount(e.target.value)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '750', color: '#475569', display: 'block', marginBottom: '6px' }}>Payment Method</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>
                    <button type="submit" disabled={processingPayment} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginTop: '12px', fontSize: '14px' }}>
                      {processingPayment ? 'Processing...' : 'Collect Payment'}
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', alignSelf: 'start', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#64748b', margin: '0 0 8px 0' }}>Consolidated Bill</h3>
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>Only Receptionists can manage billing payments and collect cash/cards.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Discharge Modal */}
        {showDischargeModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '28px', borderRadius: '20px', width: '100%', maxWidth: '600px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Discharge Patient</h2>
              <form onSubmit={handleDischargeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Diagnosis *</label>
                  <textarea required value={dischargeForm.diagnosis} onChange={e => setDischargeForm({...dischargeForm, diagnosis: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Treatment Summary</label>
                  <textarea value={dischargeForm.treatment_summary} onChange={e => setDischargeForm({...dischargeForm, treatment_summary: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Discharge Instructions</label>
                  <textarea value={dischargeForm.discharge_instructions} onChange={e => setDischargeForm({...dischargeForm, discharge_instructions: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Follow-up Date (Optional)</label>
                  <input type="date" value={dischargeForm.follow_up_date} onChange={e => setDischargeForm({...dischargeForm, follow_up_date: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setShowDischargeModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                  <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>Confirm Discharge</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>IPD Admissions</h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Manage in-patient admissions, wards, and discharges</p>
        </div>
        {(user?.role === 'RECEPTIONIST' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <button
            onClick={handleOpenNewModal}
            style={{ background: 'linear-gradient(135deg, #0070c0, #004861)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> New Admission
          </button>
        )}
      </div>

      <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600' }}>
          <option value="ALL">All Status</option>
          <option value="ADMITTED">Admitted</option>
          <option value="DISCHARGED">Discharged</option>
          <option value="TRANSFERRED">Transferred</option>
        </select>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input 
            type="text" 
            placeholder="Search patient name, mobile, UHID..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '13px' }}>
              <th style={{ padding: '14px' }}>Patient Name</th>
              <th style={{ padding: '14px' }}>UHID</th>
              <th style={{ padding: '14px' }}>Ward/Bed</th>
              <th style={{ padding: '14px' }}>Doctor</th>
              <th style={{ padding: '14px' }}>Admission Date</th>
              <th style={{ padding: '14px' }}>LOS</th>
              <th style={{ padding: '14px' }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
            ) : admissions.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No admissions found.</td></tr>
            ) : (
              admissions.map(adm => {
                const admDate = new Date(adm.admission_date);
                const endDate = adm.discharge_date ? new Date(adm.discharge_date) : new Date();
                const los = Math.max(1, Math.ceil((endDate - admDate) / (1000 * 60 * 60 * 24)));
                
                return (
                  <tr key={adm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px' }}>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{adm.patient_name}</strong>
                      {adm.mobile && <span style={{ fontSize: '11px', color: '#64748b' }}>{adm.mobile}</span>}
                    </td>
                    <td style={{ padding: '14px', fontSize: '12px' }}>{adm.uhid}</td>
                    <td style={{ padding: '14px', fontSize: '13px', color: '#0284c7', fontWeight: '600' }}>{adm.ward_name} - {adm.bed_number}</td>
                    <td style={{ padding: '14px', fontSize: '13px' }}>{adm.doctor_name || '-'}</td>
                    <td style={{ padding: '14px', fontSize: '13px' }}>{admDate.toLocaleDateString()}</td>
                    <td style={{ padding: '14px', fontSize: '13px' }}>{los} day(s)</td>
                    <td style={{ padding: '14px' }}>{getStatusBadge(adm.status)}</td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button onClick={() => handleViewDetail(adm)} style={{ background: '#f1f5f9', color: '#0284c7', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>View</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* NEW ADMISSION MODAL */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>New IPD Admission</h2>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>Search Existing Patient by Mobile</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Mobile number..." value={searchMobile} onChange={e => setSearchMobile(e.target.value)} style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                <button onClick={handlePatientSearch} disabled={searchingPatient} style={{ background: '#0070c0', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Search</button>
              </div>
              {patientFound && <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: '700', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={15}/> Patient found!</div>}
            </div>

            <form onSubmit={handleNewAdmissionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Patient Name *</label>
                  <input type="text" required value={admForm.name} onChange={e => setAdmForm({...admForm, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} disabled={patientFound} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Mobile Number *</label>
                  <input type="text" required value={admForm.mobile} onChange={e => setAdmForm({...admForm, mobile: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} disabled={patientFound} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Attending Doctor *</label>
                  <select required value={admForm.doctor_id} onChange={e => setAdmForm({...admForm, doctor_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Assign Bed *</label>
                  <select required value={admForm.bed_id} onChange={e => setAdmForm({...admForm, bed_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="">Select Available Bed</option>
                    {Object.keys(groupedBeds).map(ward => (
                      <optgroup key={ward} label={ward}>
                        {groupedBeds[ward].map(b => <option key={b.id} value={b.id}>{b.bed_number} (₹{b.daily_rate}/day)</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Reason for Admission *</label>
                <textarea required value={admForm.admission_reason} onChange={e => setAdmForm({...admForm, admission_reason: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '60px' }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Expected Discharge Date (Optional)</label>
                <input type="date" value={admForm.expected_discharge_date} onChange={e => setAdmForm({...admForm, expected_discharge_date: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowNewModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#0070c0', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>Admit Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
