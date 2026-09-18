import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, CheckCircle2, Zap, ShieldCheck, Check, AlertTriangle } from 'lucide-react';

const QUICK_TEMPLATES = [
  {
    name: '🤒 Fever & Cold Pack',
    diagnosis: 'Acute Viral Fever & URI',
    medicines: [
      { name: 'Dolo 650mg (Paracetamol)', dosage: '1-0-1', duration: '3 days', instructions: 'After food' },
      { name: 'Cetirizine 10mg', dosage: '0-0-1', duration: '5 days', instructions: 'At night' },
      { name: 'Pantoprazole 40mg', dosage: '1-0-0', duration: '5 days', instructions: 'Before food' }
    ]
  },
  {
    name: '🫁 Asthma & Cough Pack',
    diagnosis: 'Acute Bronchial Asthma / Cough',
    medicines: [
      { name: 'Asthalin Inhaler (100 mcg)', dosage: '2 puffs', duration: '7 days', instructions: 'When needed' },
      { name: 'Montair LC (Montelukast + Levocetirizine)', dosage: '0-0-1', duration: '5 days', instructions: 'At night' }
    ]
  },
  {
    name: '💊 Gastritis & Acidity Pack',
    diagnosis: 'Acute Acid Reflux & Dyspepsia',
    medicines: [
      { name: 'Pantoprazole 40mg', dosage: '1-0-0', duration: '7 days', instructions: 'Before breakfast' },
      { name: 'Gelusil MPS Syrup 200ml', dosage: '2 tsp', duration: '5 days', instructions: 'After meals' }
    ]
  },
  {
    name: '❤️ Hypertension Pack',
    diagnosis: 'Essential Hypertension',
    medicines: [
      { name: 'Amlodipine 5mg', dosage: '1-0-0', duration: '30 days', instructions: 'Morning after food' }
    ]
  }
];

export default function DoctorPrescriptionModal({ isOpen, onClose, appointment, authFetch, onPrescriptionSaved }) {
  if (!isOpen || !appointment) return null;

  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '1-0-1', duration: '5 days', instructions: 'After food' }
  ]);

  // Doctor Medicine Autocomplete State
  const [searchResults, setSearchResults] = useState([]);
  const [activeRowIdx, setActiveRowIdx] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search catalog medicines with availability status (Part 6)
  const searchMedicines = async (query, index) => {
    setActiveRowIdx(index);
    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await authFetch(`http://localhost:5000/api/doctor/medicines/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data || []);
      }
    } catch (err) {
      console.error('Error searching catalog medicines:', err);
    }
  };

  const applyTemplate = (tpl) => {
    setDiagnosis(tpl.diagnosis);
    setMedicines(tpl.medicines.map(m => ({ ...m })));
  };

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '1-0-1', duration: '5 days', instructions: 'After food' }]);
  };

  const removeMedicineRow = (index) => {
    setMedicines(medicines.filter((_, idx) => idx !== index));
    if (activeRowIdx === index) setSearchResults([]);
  };

  const handleMedChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);

    if (field === 'name') {
      searchMedicines(value, index);
    }
  };

  const selectCatalogMed = (med, index) => {
    const updated = [...medicines];
    updated[index].name = med.name;
    setMedicines(updated);
    setSearchResults([]);
    setActiveRowIdx(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await authFetch(`http://localhost:5000/api/doctor/appointments/${appointment.id}/prescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rxType: 'DIGITAL',
          diagnosis: diagnosis || 'OPD Consultation',
          notes,
          followUpDate: followUpDate || null,
          medicines: medicines.filter(m => m.name && m.name.trim())
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Digital Prescription saved and PDF letterhead generated successfully!');
        if (onPrescriptionSaved) onPrescriptionSaved(data.data);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(data.error || 'Failed to save prescription.');
      }
    } catch (err) {
      console.error('Error saving prescription:', err);
      setError('Network error saving prescription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: '820px', maxHeight: '92vh', background: '#ffffff',
        borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', padding: '20px 24px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={22} />
              <span>Digital E-Prescription</span>
            </h3>
            <span style={{ fontSize: '12.5px', opacity: 0.9, marginTop: '2px', display: 'block' }}>
              Prescribing for <strong>{appointment.patient_name}</strong> (Token #{appointment.token_number || 'N/A'})
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* WORKFLOW INFO BANNER */}
        <div style={{ background: '#f0fdf4', padding: '10px 24px', borderBottom: '1px solid #bbf7d0', fontSize: '12px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} />
          <span><strong>Doctor Note:</strong> Free-type any medicine or pick from catalog below. Stock availability hints are shown inline.</span>
        </div>

        {/* BODY FORM */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}>⚠️ {error}</div>}
          {successMsg && <div style={{ background: '#f0fdf4', color: '#15803d', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} /> {successMsg}</div>}

          {/* READ-ONLY PATIENT BAR */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '20px', fontSize: '12.5px', flexWrap: 'wrap' }}>
            <div><strong style={{ color: '#0369a1' }}>Patient Name:</strong> {appointment.patient_name}</div>
            <div><strong style={{ color: '#0369a1' }}>Age / Gender:</strong> {appointment.age || '-'} / {appointment.gender || '-'}</div>
            <div><strong style={{ color: '#0369a1' }}>UHID:</strong> {appointment.uhid || 'N/A'}</div>
          </div>

          {/* QUICK PRESCRIBING TEMPLATES */}
          <div style={{ background: '#faf5ff', padding: '14px', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
            <strong style={{ fontSize: '12.5px', color: '#7e22ce', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Zap size={16} /> 1-Click Quick Prescribing Templates:
            </strong>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {QUICK_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  style={{ background: '#ffffff', border: '1px solid #c084fc', color: '#6b21a8', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* DIAGNOSIS */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Clinical Diagnosis *</label>
            <input
              type="text"
              required
              placeholder="e.g. Acute Bronchial Asthma / Essential Hypertension / Viral Fever"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
            />
          </div>

          {/* MEDICINES LIST WITH PART 6 AUTOCOMPLETE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', margin: 0 }}>Prescribed Medicines</label>
              <button
                type="button"
                onClick={addMedicineRow}
                style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {medicines.map((med, idx) => (
                <div key={idx} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 2fr auto', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  
                  {/* MEDICINE INPUT + AUTOCOMPLETE */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Type Medicine Name..."
                      value={med.name}
                      onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                      onFocus={() => { if (med.name) searchMedicines(med.name, idx); }}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />

                    {/* SUGGESTIONS DROPDOWN WITH AVAILABILITY BADGES */}
                    {activeRowIdx === idx && searchResults.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                        background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)', marginTop: '4px', overflow: 'hidden'
                      }}>
                        {searchResults.map(item => (
                          <div
                            key={item.id}
                            onClick={() => selectCatalogMed(item, idx)}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}
                          >
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>{item.name} ({item.unit || 'unit'})</span>
                            <span style={{
                              padding: '2px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800',
                              background: item.isAvailable ? '#dcfce7' : '#fef2f2',
                              color: item.isAvailable ? '#15803d' : '#dc2626'
                            }}>
                              {item.isAvailable ? '✓ Available' : '⚠ Out of Stock'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Dosage (1-0-1)"
                    value={med.dosage}
                    onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                  <input
                    type="text"
                    placeholder="Duration (5 days)"
                    value={med.duration}
                    onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                  <input
                    type="text"
                    placeholder="Instructions (After food)"
                    value={med.instructions}
                    onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeMedicineRow(idx)}
                    disabled={medicines.length === 1}
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '6px 8px', borderRadius: '6px', cursor: medicines.length === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>

                </div>
              ))}
            </div>
          </div>

          {/* NOTES & FOLLOW-UP DATE */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Advice / Dietary Notes</label>
              <textarea
                rows="2"
                placeholder="e.g. Drink plenty of warm water, avoid cold beverages, take complete rest."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Follow-Up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* SUBMIT ACTIONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={18} />
              <span>{loading ? 'Saving Prescription...' : 'Save & Issue E-Prescription'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
