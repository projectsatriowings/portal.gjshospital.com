import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Plus, Trash2, Printer, FileText, UserCheck, CheckCircle2, Lock, Users, Eye, AlertTriangle, Pill, Check, X, FilePlus, ShoppingCart, Clock } from 'lucide-react';
import { API_BASE_URL, getFileUrl } from '../config/api';

// ─── Prescription Medicine Row Component ─────────────────────────────────────
// Each doctor-prescribed medicine row has:
//   • Editable Qty input (default = doctor's prescribed duration)
//   • Amount preview (qty × unit price from catalog)
//   • Green "Dispense" button (deducts stock, adds to bill at entered qty)
//   • Orange "Buy Outside" button (marks NOT_DISPENSED, excluded from bill)
function PrescriptionMedicineRows({ medicines, catalog, onDispense, onBuyOutside }) {
  // Local state: qty per medicine row, keyed by medicine id
  const [qtys, setQtys] = useState(() => {
    const init = {};
    medicines.forEach(m => {
      // Default qty = doctor-prescribed duration (parse number from string like "5 days" → 5)
      const defaultQty = parseInt((m.duration || '1'), 10) || 1;
      init[m.id] = defaultQty;
    });
    return init;
  });

  const handleQtyChange = (id, val) => {
    const n = Math.max(1, parseInt(val, 10) || 1);
    setQtys(prev => ({ ...prev, [id]: n }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {medicines.map((m) => {
        const catalogMatch = catalog.find(c =>
          c.name.toLowerCase().includes((m.name || '').toLowerCase()) ||
          (m.name || '').toLowerCase().includes(c.name.toLowerCase())
        );
        const currentStock = catalogMatch ? catalogMatch.current_stock : null;
        const unitPrice = catalogMatch ? parseFloat(catalogMatch.unit_price || 0) : 0;
        const qty = qtys[m.id] || 1;
        const amountPreview = (unitPrice * qty).toFixed(2);
        const isOutOfStock = currentStock !== null && currentStock <= 0;
        const isLowStock = currentStock !== null && !isOutOfStock && currentStock < qty;
        const notInCatalog = currentStock === null;
        const status = m.dispensed_status || 'PENDING';

        return (
          <div key={m.id} style={{
            background: '#ffffff',
            padding: '14px 16px',
            borderRadius: '12px',
            border: isOutOfStock ? '1.5px solid #fca5a5' : isLowStock ? '1.5px solid #fde68a' : '1px solid #d8b4fe',
            transition: 'border-color 0.2s'
          }}>
            {/* Medicine name + stock badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{m.name}</strong>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  Dosage: <b>{m.dosage || 'N/A'}</b> &nbsp;|&nbsp; Doctor suggested: <b>{m.duration || 'N/A'}</b> &nbsp;|&nbsp; {m.instructions || ''}
                </div>
              </div>

              {/* Stock status badge */}
              {notInCatalog ? (
                <span style={{ padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                  Not in Catalog
                </span>
              ) : isOutOfStock ? (
                <span style={{ padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                  ⚠️ Out of Stock
                </span>
              ) : isLowStock ? (
                <span style={{ padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                  ⚠️ Low Stock ({currentStock})
                </span>
              ) : (
                <span style={{ padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                  ✓ {currentStock} in stock
                </span>
              )}
            </div>

            {/* Already handled states */}
            {status === 'DISPENSED' || status === 'PARTIALLY_DISPENSED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} /> Dispensed — {m.dispensed_quantity || qty} units @ ₹{unitPrice.toFixed(2)} = ₹{(unitPrice * (m.dispensed_quantity || qty)).toFixed(2)}
                </span>
              </div>
            ) : status === 'NOT_DISPENSED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ background: '#fff7ed', color: '#c2410c', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShoppingCart size={14} /> Buy Outside — {m.dispensed_note || 'Patient to buy outside'}
                </span>
              </div>
            ) : (
              /* ─── ACTIVE ACTION ROW ─── */
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>

                {/* QTY INPUT */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '4px 10px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap' }}>Qty:</label>
                  <input
                    type="number"
                    min="1"
                    max={currentStock !== null ? currentStock : 9999}
                    value={qty}
                    onChange={e => handleQtyChange(m.id, e.target.value)}
                    style={{ width: '54px', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: '800', color: '#0f172a', textAlign: 'center', outline: 'none' }}
                  />
                </div>

                {/* AMOUNT PREVIEW */}
                {!notInCatalog && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: '800', color: '#15803d' }}>
                    ₹{unitPrice.toFixed(2)} × {qty} = <span style={{ fontSize: '13px' }}>₹{amountPreview}</span>
                  </div>
                )}

                {/* DISPENSE BUTTON */}
                <button
                  type="button"
                  onClick={() => onDispense(m, qty)}
                  disabled={isOutOfStock || notInCatalog}
                  title={isOutOfStock ? 'Out of stock — mark as Buy Outside' : notInCatalog ? 'Add this medicine to catalog first' : `Dispense ${qty} units and add ₹${amountPreview} to bill`}
                  style={{
                    background: (isOutOfStock || notInCatalog) ? '#e2e8f0' : '#16a34a',
                    color: (isOutOfStock || notInCatalog) ? '#94a3b8' : '#fff',
                    border: 'none', padding: '6px 14px', borderRadius: '7px',
                    fontSize: '12px', fontWeight: '700',
                    cursor: (isOutOfStock || notInCatalog) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    transition: 'background 0.15s'
                  }}
                >
                  <Check size={13} /> Dispense
                </button>

                {/* BUY OUTSIDE BUTTON — always visible */}
                <button
                  type="button"
                  onClick={() => onBuyOutside(m, isOutOfStock ? 'Out of stock — patient to buy outside' : 'Patient opted to buy outside')}
                  title="Mark as Buy Outside — excluded from hospital bill, printed on Buy-Outside note"
                  style={{
                    background: isOutOfStock ? '#ea580c' : '#f97316',
                    color: '#fff',
                    border: 'none', padding: '6px 14px', borderRadius: '7px',
                    fontSize: '12px', fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    transition: 'background 0.15s'
                  }}
                >
                  <ShoppingCart size={13} /> Buy Outside
                </button>

                {/* Out of stock warning inline */}
                {isOutOfStock && (
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>
                    No stock — dispense blocked. Mark Buy Outside or restock first.
                  </span>
                )}
                {isLowStock && (
                  <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '600' }}>
                    ⚠️ Only {currentStock} in stock. You entered {qty}.
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PharmacyDispensing({ authFetch, user }) {
  const [patientSearch, setPatientSearch] = useState('');
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patients, setPatients] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Active Visit Bill & Prescription
  const [activeBill, setActiveBill] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [msg, setMsg] = useState('');
  const [previousBills, setPreviousBills] = useState([]);

  // Medicine Catalog & Dispensing Form
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [medQty, setMedQty] = useState(1);
  const [addingItem, setAddingItem] = useState(false);

  // Buy Outside PDF State
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Fetch recent patients & catalog on mount
  useEffect(() => {
    fetchRecentPatients();
    fetchMedicineCatalog();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/medicines/categories`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories in dispensing desk:', err);
    }
  };

  const fetchMedicineCatalog = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/medicines?status=ACTIVE`);
      const data = await res.json();
      if (data.success) {
        setCatalog(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching medicine catalog:', err);
    }
  };

  // Add new medicine form state
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedUnit, setNewMedUnit] = useState('tablet');
  const [newMedPrice, setNewMedPrice] = useState('');
  const [newMedReorder, setNewMedReorder] = useState(10);
  const [savingNewMed, setSavingNewMed] = useState(false);

  const handleAddNewMedicine = async (e) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedPrice) {
      alert('Name and unit price are required.');
      return;
    }
    setSavingNewMed(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMedName.trim(),
          unit: newMedUnit,
          unit_price: parseFloat(newMedPrice),
          reorder_level: parseInt(newMedReorder, 10) || 10,
          status: 'ACTIVE'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ Added "${newMedName}" to medicine catalog!`);
        setNewMedName('');
        setNewMedPrice('');
        setShowAddMedicine(false);
        await fetchMedicineCatalog(); // Reload dropdown
      } else {
        alert(data.error || 'Failed to add medicine to catalog.');
      }
    } catch (err) {
      console.error('Error adding new medicine:', err);
      alert('Network error adding medicine.');
    } finally {
      setSavingNewMed(false);
    }
  };

  const fetchRecentPatients = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/patients?limit=8`);
      const data = await res.json();
      if (data.success) {
        setRecentPatients(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching recent patients:', err);
    }
  };

  // Search Patients
  const handleSearchPatients = async (e) => {
    if (e) e.preventDefault();
    if (!patientSearch.trim()) return;
    setSearchingPatients(true);
    setHasSearched(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/patients?search=${encodeURIComponent(patientSearch.trim())}`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.data || []);
      }
    } catch (err) {
      console.error('Error searching patients:', err);
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setPatientSearch(val);
    if (!val.trim()) {
      setHasSearched(false);
      setPatients([]);
    }
  };

  // Select Patient → Fetch Visit Bill & Doctor Prescription
  const handleSelectPatient = async (pt) => {
    setSelectedPatient(pt);
    setMsg('');
    setLoadingBill(true);
    setActiveBill(null);
    setPrescription(null);

    try {
      // 1. Fetch active visit bill (most recent PENDING bill for this patient)
      const billRes = await authFetch(`${API_BASE_URL}/admin/bills/active-visit/${pt.id}`);
      const billData = await billRes.json();
      if (billData.success) {
        setActiveBill(billData.activeBill || null);
        setPreviousBills(billData.previousBills || []);
      }

      // 2. Fetch most recent appointment with prescription for this patient
      const rxRes = await authFetch(`${API_BASE_URL}/admin/appointments?patientId=${pt.id}`);
      const rxData = await rxRes.json();
      if (rxData.success && Array.isArray(rxData.data)) {
        // Find the most recent appointment that has a prescription
        const appWithRx = rxData.data.find(a => a.prescription_id);
        if (appWithRx && appWithRx.prescription_id) {
          // Fetch full prescription with medicines via pharmacy-accessible endpoint
          const detailRes = await authFetch(
            `${API_BASE_URL}/admin/medicines/prescription/by-appointment/${appWithRx.id}`
          );
          const detailData = await detailRes.json();
          if (detailData.success && detailData.data) {
            setPrescription(detailData.data);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching patient bill & prescription:', err);
    } finally {
      setLoadingBill(false);
    }
  };

  // Refresh active bill & prescription
  const refreshPatientData = async () => {
    if (selectedPatient) {
      await handleSelectPatient(selectedPatient);
      await fetchMedicineCatalog();
    }
  };

  // Create Standalone Pharmacy Bill if none active
  const handleCreateStandaloneBill = async (appointmentId = null, forceNew = false) => {
    if (!selectedPatient) return;
    setLoadingBill(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/bills/create-standalone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          appointment_id: appointmentId,
          force_new: forceNew
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveBill(data.data);
        setMsg(`Created new Pharmacy Bill #${data.data.bill_number}`);
      } else {
        setMsg(`⚠️ ${data.error || 'Failed to create bill.'}`);
      }
    } catch (err) {
      console.error('Error creating bill:', err);
      setMsg('⚠️ Network error creating bill.');
    } finally {
      setLoadingBill(false);
    }
  };

  // Dispense Prescription Medicine (Part 3a)
  const handleDispenseMedicine = async (medItem, qtyToDispense) => {
    if (!activeBill) {
      alert('Please create or select an active bill first.');
      return;
    }

    if (activeBill.status === 'PAID') {
      const confirmNew = window.confirm('⚠️ This bill is already PAID. Would you like to create a new separate bill for this patient to add new medicines?');
      if (confirmNew) {
        await handleCreateStandaloneBill(null, true);
      }
      return;
    }

    const catalogMed = catalog.find(m => m.name.toLowerCase().includes((medItem.name || '').toLowerCase()) || (medItem.name || '').toLowerCase().includes(m.name.toLowerCase()));
    if (!catalogMed) {
      alert(`Medicine '${medItem.name}' not found in catalog. Please add it to Medicine Catalog first.`);
      return;
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/admin/medicines/dispense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_medicine_id: medItem.id,
          medicine_id: catalogMed.id,
          bill_id: activeBill.id,
          quantity: parseInt(qtyToDispense, 10),
          prescribed_quantity: parseInt(medItem.duration || qtyToDispense, 10)
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Dispensed successfully! Added ${qtyToDispense} units to Bill #${activeBill.bill_number}.`);
        setMsg(`✅ ${data.message}`);
        await refreshPatientData();
      } else {
        if (data.error && data.error.includes('PAID')) {
          const confirmNew = window.confirm('⚠️ This bill is already PAID. Would you like to create a new separate bill for this patient?');
          if (confirmNew) {
            await handleCreateStandaloneBill(null, true);
          }
        } else {
          alert(`⚠️ ${data.error || 'Failed to dispense medicine.'}`);
        }
      }
    } catch (err) {
      console.error('Error dispensing medicine:', err);
      alert('⚠️ Network error dispensing medicine.');
    }
  };

  // Mark Buy Outside (Part 3b)
  const handleMarkBuyOutside = async (medItem, note) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/medicines/buy-outside`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_medicine_id: medItem.id,
          note: note || 'Out of stock / Patient opted to buy outside'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Marked "${medItem.name}" as Buy Outside successfully!`);
        setMsg(`ℹ️ ${data.message}`);
        await refreshPatientData();
      } else {
        alert(`⚠️ ${data.error || 'Failed to mark buy outside.'}`);
      }
    } catch (err) {
      console.error('Error marking buy outside:', err);
      alert('⚠️ Network error marking buy outside.');
    }
  };

  // Download/Print Previous Bill Receipt PDF
  const handleDownloadReceipt = async (billObj) => {
    if (billObj.pdf_url) {
      window.open(getFileUrl(billObj.pdf_url), '_blank');
    } else {
      try {
        const res = await authFetch(`${API_BASE_URL}/admin/bills/${billObj.id}/pdf`);
        const data = await res.json();
        if (data.success && data.pdfUrl) {
          window.open(getFileUrl(data.pdfUrl), '_blank');
        } else {
          alert('Failed to generate receipt PDF');
        }
      } catch (err) {
        console.error('Error generating PDF:', err);
        alert('Error downloading receipt PDF');
      }
    }
  };

  // Print Buy Outside Note PDF (Part 4)
  const handlePrintBuyOutsideNote = async () => {
    if (!prescription) return;
    setGeneratingPdf(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/medicines/buy-outside-pdf/${prescription.id}`);
      const data = await res.json();
      if (data.success && data.pdfUrl) {
        window.open(getFileUrl(data.pdfUrl), '_blank');
      } else {
        alert(data.error || 'Failed to generate Buy Outside Note PDF.');
      }
    } catch (err) {
      console.error('Error generating PDF note:', err);
      alert('Network error generating PDF note.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Mark a catalog medicine as Buy Outside (adding as a ₹0.00 line item to the bill)
  const handleMarkCatalogMedicineBuyOutside = async () => {
    if (!activeBill) {
      alert('Please select or create an active bill first.');
      return;
    }

    if (activeBill.status === 'PAID') {
      const confirmNew = window.confirm('⚠️ This bill is already PAID. Would you like to create a new separate bill for this patient to add new medicines?');
      if (confirmNew) {
        await handleCreateStandaloneBill(null, true);
      }
      return;
    }

    const med = catalog.find(m => String(m.id) === String(selectedMedId));
    if (!med) {
      alert('Please select a medicine.');
      return;
    }

    const qty = parseInt(medQty, 10) || 1;
    setAddingItem(true);
    setMsg('');

    try {
      const res = await authFetch(`${API_BASE_URL}/admin/bills/${activeBill.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'PHARMACY',
          description: `Pharmacy: [OUTSIDE] ${med.name} (${med.unit || 'unit'}) (Unavailable)`,
          amount: 0.00,
          quantity: qty
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Marked ${qty}x ${med.name} as Buy Outside successfully!`);
        setMsg(`✅ Marked ${qty}x ${med.name} as Buy Outside! Added to invoice receipt table with ₹0.00 charges.`);
        setSelectedMedId('');
        setMedQty(1);
        await refreshPatientData();
      } else {
        if (data.error && data.error.includes('PAID')) {
          const confirmNew = window.confirm('⚠️ This bill is already PAID. Would you like to create a new separate bill for this patient?');
          if (confirmNew) {
            await handleCreateStandaloneBill(null, true);
          }
        } else {
          alert(`⚠️ ${data.error || 'Failed to mark buy outside.'}`);
        }
      }
    } catch (err) {
      console.error('Error marking catalog medicine as buy outside:', err);
      alert('⚠️ Network error marking buy outside.');
    } finally {
      setAddingItem(false);
    }
  };

  // Add Manual Medicine to Bill
  const handleAddMedicineToBill = async (e) => {
    e.preventDefault();
    if (!activeBill) {
      alert('Please select or create an active bill first.');
      return;
    }

    if (activeBill.status === 'PAID') {
      const confirmNew = window.confirm('⚠️ This bill is already PAID. Would you like to create a new separate bill for this patient to add new medicines?');
      if (confirmNew) {
        await handleCreateStandaloneBill(null, true);
      }
      return;
    }

    if (!selectedMedId) {
      alert('Please select a medicine.');
      return;
    }

    const med = catalog.find(m => String(m.id) === String(selectedMedId));
    if (!med) return;

    const qty = parseInt(medQty, 10) || 1;
    setAddingItem(true);
    setMsg('');

    try {
      const res = await authFetch(`${API_BASE_URL}/admin/medicines/dispense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_id: med.id,
          bill_id: activeBill.id,
          quantity: qty
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Dispensed successfully! Added ${qty}x ${med.name} to Bill #${activeBill.bill_number}.`);
        setMsg(`✅ Dispensed ${qty}x ${med.name}! Added ₹${(parseFloat(med.unit_price) * qty).toFixed(2)} to bill #${activeBill.bill_number}.`);
        setSelectedMedId('');
        setMedQty(1);
        await refreshPatientData();
      } else {
        if (data.error && data.error.includes('PAID')) {
          const confirmNew = window.confirm('⚠️ This bill is already PAID. Would you like to create a new separate bill for this patient?');
          if (confirmNew) {
            await handleCreateStandaloneBill(null, true);
          }
        } else {
          alert(`⚠️ ${data.error || 'Failed to add medicine to bill.'}`);
        }
      }
    } catch (err) {
      console.error('Error adding medicine:', err);
      alert('⚠️ Network error adding medicine to bill.');
    } finally {
      setAddingItem(false);
    }
  };

  // Confirm Pharmacy draft items & send to billing center
  const handleConfirmPharmacyIssue = async () => {
    if (!activeBill) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/bills/${activeBill.id}/confirm-pharmacy`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Pharmacy items confirmed! The billing center/receptionist can now see these items and collect payment.');
        await refreshPatientData();
      } else {
        alert(data.error || 'Failed to confirm pharmacy items.');
      }
    } catch (err) {
      console.error('Error confirming pharmacy items:', err);
      alert('Network error confirming pharmacy items.');
    }
  };

  // Remove PHARMACY item from bill
  const handleRemoveItem = async (itemId) => {
    if (!activeBill) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/bills/${activeBill.id}/items/${itemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Item removed from bill.');
        await refreshPatientData();
      } else {
        setMsg(`⚠️ ${data.error || 'Failed to remove item.'}`);
      }
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  // Update item quantity on bill directly (optimized for instant UI reaction)
  const handleUpdateItemQty = async (itemId, newQty) => {
    if (!activeBill) return;
    const qtyVal = parseInt(newQty, 10);
    if (isNaN(qtyVal) || qtyVal <= 0) return;

    // 1. Instantly update local UI state so the input and total update with zero latency
    setActiveBill(prev => {
      if (!prev || !prev.items) return prev;
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: qtyVal };
        }
        return item;
      });
      const newTotal = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) * parseInt(item.quantity || 1, 10)), 0);
      return { ...prev, items: updatedItems, total_amount: newTotal };
    });

    // 2. Sync to backend database silently in the background
    try {
      await authFetch(`${API_BASE_URL}/admin/bills/${activeBill.id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qtyVal })
      });
    } catch (err) {
      console.error('Error syncing quantity to backend:', err);
    }
  };

  const selectedMed = catalog.find(m => String(m.id) === String(selectedMedId));
  const estimatedAmount = selectedMed ? (parseFloat(selectedMed.unit_price) * (parseInt(medQty, 10) || 1)).toFixed(2) : '0.00';

  const notDispensedCount = prescription?.medicines?.filter(m => m.dispensed_status === 'NOT_DISPENSED').length || 0;

  return (
    <div style={{ padding: '24px' }}>
      <style>{`
        /* Responsive Pharmacy Layouts */
        .pharmacy-workspace-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .pharmacy-workspace-grid {
            grid-template-columns: 1fr 1.3fr;
          }
        }

        /* Direct Dispense Form */
        .direct-dispense-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .direct-dispense-row-1 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .direct-dispense-row-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          align-items: flex-end;
        }
        @media (min-width: 640px) {
          .direct-dispense-row-1 {
            grid-template-columns: 1fr 2.2fr;
          }
          .direct-dispense-row-2 {
            grid-template-columns: 1fr 1.2fr auto;
          }
        }

        /* Inline Add Medicine Form */
        .add-medicine-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          align-items: flex-end;
        }
        @media (min-width: 640px) {
          .add-medicine-grid {
            grid-template-columns: 2.2fr 1fr 1.2fr auto;
          }
        }
      `}</style>
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingBag size={26} color="#0284c7" />
          <span>Pharmacy Stock Check & Dispensing Desk</span>
        </h2>
        <span style={{ fontSize: '13.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
          Mark available medicines, deduct inventory, generate hospital bill line items, or print <strong>"Buy Outside" notes</strong> for exempt items.
        </span>
      </div>

      {/* SEARCH PATIENT SECTION */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <form onSubmit={handleSearchPatients} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search Patient by Name, Mobile Number, or UHID (e.g. Ramesh, 9988776655, GJS-P-1002)"
              value={patientSearch}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
            />
          </div>
          <button
            type="submit"
            disabled={searchingPatients}
            style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' }}
          >
            {searchingPatients ? 'Searching...' : 'Search Patient'}
          </button>
        </form>

        {/* RECENT PATIENTS QUICK SELECT */}
        {recentPatients.length > 0 && !hasSearched && !selectedPatient && (
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <Users size={14} /> Quick Select Recent OPD Patients:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {recentPatients.slice(0, 6).map(pt => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => handleSelectPatient(pt)}
                  style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  👤 {pt.name} ({pt.mobile || 'Patient'})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {hasSearched && (
          <div style={{ marginTop: '16px' }}>
            {patients.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No matching patients found.</p>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {patients.map(pt => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => handleSelectPatient(pt)}
                    style={{ background: selectedPatient?.id === pt.id ? '#0284c7' : '#f8fafc', color: selectedPatient?.id === pt.id ? '#fff' : '#0f172a', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>{pt.name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>UHID: {pt.uhid || 'N/A'} | {pt.mobile}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* WORKSPACE FOR SELECTED PATIENT */}
      {selectedPatient && (
        <div className="pharmacy-workspace-grid">
          
          {/* LEFT PANEL: PATIENT & PRESCRIPTION DISPENSING DESK */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* PATIENT INFO CARD */}
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} /> Selected Patient Details
              </h4>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{selectedPatient.name}</div>
              <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '16px' }}>
                <div>UHID: <strong>{selectedPatient.uhid || 'N/A'}</strong></div>
                <div>Mobile: <strong>{selectedPatient.mobile}</strong></div>
              </div>
            </div>

            {/* PAST PAID TRANSACTIONS HISTORY */}
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> Paid / Previous Bill History
              </h4>
              
              {previousBills.length === 0 ? (
                <div style={{ fontSize: '12.5px', color: '#64748b', textAlign: 'center', padding: '10px' }}>
                  No previous paid transactions found for this patient.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                  {previousBills.map(b => {
                    const billTotal = parseFloat(b.total_amount || 0);
                    return (
                      <div
                        key={b.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0284c7' }}>
                            {b.bill_number}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            Paid on: <strong>{new Date(b.created_at).toLocaleString()}</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#15803d' }}>
                              ₹{billTotal.toFixed(2)}
                            </div>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '9.5px',
                              fontWeight: '800',
                              background: '#dcfce7',
                              color: '#15803d',
                              display: 'inline-block',
                              marginTop: '2px'
                            }}>
                              PAID
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(b)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Printer size={12} /> Print Receipt
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PRESCRIPTION MEDICINE DISPENSING DESK (PARTS 2, 3 & 4) */}
            <div style={{ background: '#faf5ff', padding: '20px', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#7e22ce', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Pill size={18} /> Doctor Prescription Medicine Desk
                </h4>

                {notDispensedCount > 0 && (
                  <button
                    type="button"
                    onClick={handlePrintBuyOutsideNote}
                    disabled={generatingPdf}
                    style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={14} /> Print Buy Outside Note ({notDispensedCount})
                  </button>
                )}
              </div>

              {prescription ? (
                <div>
                  <div style={{ fontSize: '12.5px', color: '#581c87', fontWeight: '700', marginBottom: '12px' }}>
                    Diagnosis: {prescription.diagnosis || 'OPD Consultation'} ({prescription.rx_type === 'PAPER' ? 'Handwritten Paper Scan' : 'Digital E-Rx'})
                  </div>

                  {/* DIGITAL PRESCRIPTION MEDICINES LIST */}
                  {prescription.medicines && prescription.medicines.length > 0 ? (
                    <PrescriptionMedicineRows
                      medicines={prescription.medicines}
                      catalog={catalog}
                      onDispense={handleDispenseMedicine}
                      onBuyOutside={handleMarkBuyOutside}
                    />
                  ) : prescription.rx_type === 'PAPER' && prescription.paper_rx_url ? (
                    <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', border: '1px solid #d8b4fe', textAlign: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#7e22ce', display: 'block', marginBottom: '8px' }}>📝 Handwritten Paper Prescription Photo</span>
                      <a href={prescription.paper_rx_url} target="_blank" rel="noreferrer" style={{ background: '#7e22ce', color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={16} /> View Paper Photo Scan
                      </a>
                      <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '10px', marginBottom: 0 }}>
                        Pharmacist Note: Read the photo and select medicines from the Catalog on the right to dispense or bill.
                      </p>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12.5px', color: '#7e22ce' }}>No line items recorded on prescription.</div>
                  )}

                </div>
              ) : (
                <div style={{ fontSize: '12.5px', color: '#6b21a8' }}>No active prescription found for this visit.</div>
              )}
            </div>

          </div>

          {/* RIGHT PANEL: BILL & MANUAL DISPENSING FORM */}
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            
            {msg && (
              <div style={{ background: msg.includes('⚠️') ? '#fef2f2' : '#f0fdf4', color: msg.includes('⚠️') ? '#dc2626' : '#15803d', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
                {msg}
              </div>
            )}

            {loadingBill ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading active visit bill...</div>
            ) : !activeBill ? (
              <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px border-dashed #cbd5e1' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#64748b', fontWeight: '600' }}>
                  No open visit bill found for <strong>{selectedPatient.name}</strong> today.
                </p>
                <button
                  type="button"
                  onClick={() => handleCreateStandaloneBill(null, true)}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Create Standalone Pharmacy Bill
                </button>
              </div>
            ) : (
              <div>
                {/* BILL METADATA BAR */}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '14px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>Active Visit Bill</span>
                    <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>#{activeBill.bill_number}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Date: {new Date(activeBill.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>Running Bill Total</span>
                    <strong style={{ fontSize: '20px', color: '#15803d', display: 'block' }}>₹{parseFloat(activeBill.total_amount || 0).toFixed(2)}</strong>
                  </div>
                </div>

                {/* MANUAL DISPENSE FROM CATALOG */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Pill size={16} color="#0284c7" /> Dispense Directly from Catalog
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddMedicine(!showAddMedicine)}
                      style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {showAddMedicine ? '✕ Close Form' : '＋ Add Medicine to Catalog'}
                    </button>
                  </div>

                  {showAddMedicine && (
                    <form onSubmit={handleAddNewMedicine} style={{ background: '#ffffff', border: '1.5px solid #0284c7', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', display: 'block', marginBottom: '10px' }}>Add Medicine to Hospital Catalog Database</span>
                      <div className="add-medicine-grid">
                        <div>
                          <label style={{ display: 'block', fontSize: '10.5px', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Medicine Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Paracetamol 500mg"
                            value={newMedName}
                            onChange={(e) => setNewMedName(e.target.value)}
                            style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10.5px', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Unit</label>
                          <select
                            value={newMedUnit}
                            onChange={(e) => setNewMedUnit(e.target.value)}
                            style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          >
                            <option value="tablet">tablet</option>
                            <option value="bottle">bottle</option>
                            <option value="strip">strip</option>
                            <option value="vial">vial</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10.5px', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Unit Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Price"
                            value={newMedPrice}
                            onChange={(e) => setNewMedPrice(e.target.value)}
                            style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={savingNewMed}
                          style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                        >
                          {savingNewMed ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </form>
                  )}

                  <form onSubmit={handleAddMedicineToBill} className="direct-dispense-form">
                    <div className="direct-dispense-row-1">
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Category Filter</label>
                        <select
                          value={selectedCategoryFilter}
                          onChange={(e) => {
                            setSelectedCategoryFilter(e.target.value);
                            setSelectedMedId('');
                          }}
                          style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
                        >
                          <option value="all">All Categories</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Select Medicine</label>
                        <select
                          required
                          value={selectedMedId}
                          onChange={(e) => setSelectedMedId(e.target.value)}
                          style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        >
                          <option value="">-- Choose Medicine --</option>
                          {catalog
                            .filter(m => selectedCategoryFilter === 'all' || String(m.category_id) === String(selectedCategoryFilter))
                            .map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} (₹{parseFloat(m.unit_price).toFixed(2)} / {m.unit || 'unit'}) - Stock: {m.current_stock}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="direct-dispense-row-2">
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Qty</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={medQty}
                          onChange={(e) => setMedQty(e.target.value)}
                          style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Amount</label>
                        <input
                          type="text"
                          disabled
                          value={`₹${estimatedAmount}`}
                          style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#e2e8f0', fontWeight: '700', color: '#15803d' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="submit"
                          disabled={addingItem}
                          style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                        >
                          {addingItem ? 'Dispensing...' : 'Dispense'}
                        </button>
                        <button
                          type="button"
                          onClick={handleMarkCatalogMedicineBuyOutside}
                          disabled={addingItem}
                          style={{ background: '#f97316', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                        >
                          Mark Buy Outside
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* CURRENT BILL ITEMS TABLE */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>Current Itemized Bill Charges</h4>
                  {(!activeBill.items || activeBill.items.length === 0) ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>No line items on this bill yet.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', minWidth: '450px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontWeight: '700' }}>
                            <th style={{ padding: '10px' }}>Category</th>
                            <th style={{ padding: '10px' }}>Description</th>
                            <th style={{ padding: '10px' }}>Qty</th>
                            <th style={{ padding: '10px' }}>Amount</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeBill.items.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px' }}>
                                <span style={{
                                  padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
                                  background: item.is_confirmed === false
                                    ? '#fffbeb'
                                    : (item.description || '').includes('[OUTSIDE]')
                                      ? '#fff7ed'
                                      : item.category === 'PHARMACY' ? '#faf5ff' : '#f0f9ff',
                                  color: item.is_confirmed === false
                                    ? '#d97706'
                                    : (item.description || '').includes('[OUTSIDE]')
                                      ? '#ea580c'
                                      : item.category === 'PHARMACY' ? '#7e22ce' : '#0284c7'
                                }}>
                                  {item.is_confirmed === false
                                    ? 'DRAFT'
                                    : (item.description || '').includes('[OUTSIDE]') ? 'OUTSIDE' : item.category}
                                </span>
                              </td>
                              <td style={{ padding: '10px', color: '#0f172a', fontWeight: '600' }}>{item.description}</td>
                              <td style={{ padding: '10px' }}>
                                {item.category === 'PHARMACY' && item.is_confirmed === false ? (
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity || 1}
                                    onChange={(e) => handleUpdateItemQty(item.id, e.target.value)}
                                    style={{
                                      width: '55px',
                                      padding: '4px 6px',
                                      borderRadius: '6px',
                                      border: '1.5px solid #cbd5e1',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      textAlign: 'center',
                                      outline: 'none'
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontWeight: '700' }}>{item.quantity || 1}</span>
                                )}
                              </td>
                              <td style={{ padding: '10px', fontWeight: '700', color: '#15803d' }}>₹{(parseFloat(item.amount) * parseInt(item.quantity || 1, 10)).toFixed(2)}</td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>
                                {item.category === 'PHARMACY' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Non-Pharmacy</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Confirm Pharmacy Issue button */}
                  {(() => {
                    const hasUnconfirmed = activeBill?.items?.some(item => item.category === 'PHARMACY' && item.is_confirmed === false);
                    if (!hasUnconfirmed) return null;
                    return (
                      <div style={{ marginTop: '16px', padding: '14px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '13px', color: '#b45309', fontWeight: '700' }}>
                          ⚠️ You have draft pharmacy items. These items will NOT show up in the Receptionist / Billing section until you click Confirm below!
                        </div>
                        <button
                          type="button"
                          onClick={handleConfirmPharmacyIssue}
                          style={{
                            background: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: '800',
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)'
                          }}
                        >
                          Confirm Pharmacy Issue & Send to Billing Center
                        </button>
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
