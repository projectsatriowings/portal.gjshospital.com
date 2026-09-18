import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Plus, Trash2, CreditCard, Download, Printer, CheckCircle2, Zap, FileText, Clock } from 'lucide-react';

export default function BillDetailModal({ isOpen, onClose, billId, authFetch, onBillUpdated }) {
  if (!isOpen || !billId) return null;

  const { user } = useAuth();
  const isReceptionist = user?.role === 'RECEPTIONIST';

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual item form state
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemCategory, setItemCategory] = useState('LAB');
  const [itemDesc, setItemDesc] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemQty, setItemQty] = useState('1');

  // Record payment state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');

  // Buy Outside indicator for Receptionist
  const [hasBuyOutsideItems, setHasBuyOutsideItems] = useState(false);
  const [previousBills, setPreviousBills] = useState([]);

  const fetchPatientHistory = async (patientId) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/admin/bills/active-visit/${patientId}`);
      const data = await res.json();
      if (data.success) {
        setPreviousBills(data.previousBills || []);
      }
    } catch (err) {
      console.error('Error fetching patient history:', err);
    }
  };

  const fetchBillDetail = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`http://localhost:5000/api/admin/bills/${billId}`);
      const data = await res.json();
      if (data.success) {
        setBill(data.data);
        fetchPatientHistory(data.data.patient_id);

        // Check if patient has Buy Outside items
        if (data.data.appointment_id) {
          try {
            const rxRes = await authFetch(`http://localhost:5000/api/admin/appointments/${data.data.appointment_id}/prescription`);
            const rxData = await rxRes.json();
            if (rxData.success && Array.isArray(rxData.data?.medicines)) {
              const hasOutside = rxData.data.medicines.some(m => m.dispensed_status === 'NOT_DISPENSED');
              setHasBuyOutsideItems(hasOutside);
            }
          } catch (e) {
            // Ignore error
          }
        }
      } else {
        setError(data.error || 'Failed to fetch bill detail.');
      }
    } catch (err) {
      console.error('Error fetching bill detail:', err);
      setError('Network error fetching bill detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillDetail();
  }, [billId]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const res = await authFetch(`http://localhost:5000/api/admin/bills/${billId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: itemCategory,
          description: itemDesc,
          amount: parseFloat(itemAmount),
          quantity: parseInt(itemQty, 10)
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Line item added successfully!');
        setShowAddItem(false);
        setItemDesc('');
        setItemAmount('');
        setItemQty('1');
        fetchBillDetail();
        if (onBillUpdated) onBillUpdated();
      } else {
        setError(data.error || 'Failed to add item.');
      }
    } catch (err) {
      setError('Network error adding line item.');
    }
  };

  const handleAddManualItem = async (cat, desc, amt) => {
    setError(null);
    setMessage(null);
    setActionLoading(true);
    try {
      const res = await authFetch(`http://localhost:5000/api/admin/bills/${billId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cat,
          description: desc,
          amount: parseFloat(amt),
          quantity: 1
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Line item added successfully!');
        fetchBillDetail();
        if (onBillUpdated) onBillUpdated();
      } else {
        setError(data.error || 'Failed to add item.');
      }
    } catch (err) {
      setError('Network error adding line item.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this line item?')) return;
    try {
      const res = await authFetch(`http://localhost:5000/api/admin/bills/${billId}/items/${itemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Line item removed.');
        fetchBillDetail();
        if (onBillUpdated) onBillUpdated();
      } else {
        setError(data.error || 'Failed to delete item.');
      }
    } catch (err) {
      setError('Error deleting line item.');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const res = await authFetch(`http://localhost:5000/api/admin/bills/${billId}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(payAmount),
          paymentMethod: payMethod
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage(data.message || 'Payment recorded!');
        setPayAmount('');
        fetchBillDetail();
        if (onBillUpdated) onBillUpdated();
      } else {
        setError(data.error || 'Failed to record payment.');
      }
    } catch (err) {
      setError('Network error recording payment.');
    }
  };

  const handleImportPrescription = async () => {
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await authFetch(`http://localhost:5000/api/admin/bills/${billId}/import-prescription`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        fetchBillDetail();
        if (onBillUpdated) onBillUpdated();
      } else {
        setError(data.error || 'Failed to import prescription.');
      }
    } catch (err) {
      setError('Network error importing prescription.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewPrescription = async () => {
    if (!bill?.appointment_id) {
      setError('No appointment linked to this bill.');
      return;
    }
    try {
      const res = await authFetch(`http://localhost:5000/api/admin/appointments/${bill.appointment_id}/prescription`);
      const data = await res.json();
      if (data.success && data.data?.pdf_url) {
        window.open(`http://localhost:5000${data.data.pdf_url}`, '_blank');
      } else if (data.success && data.data?.paper_rx_url) {
        window.open(data.data.paper_rx_url, '_blank');
      } else {
        setError('No prescription PDF or scan available for this appointment.');
      }
    } catch (err) {
      setError('No prescription found for this appointment.');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await authFetch(`http://localhost:5000/api/admin/bills/${billId}/pdf`);
      const data = await res.json();
      if (data.success && data.pdfUrl) {
        window.open(`http://localhost:5000${data.pdfUrl}`, '_blank');
      }
    } catch (err) {
      setError('Failed to download invoice PDF.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '780px',
        maxHeight: '92vh',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '20px 24px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={22} color="#38bdf8" />
              <span>Invoice #{bill?.bill_number || 'Details'}</span>
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              OPD Billing & Payment Management
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading bill details...</div>
        ) : bill ? (
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>⚠️ {error}</div>}
            {message && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} /> {message}</div>}

            {/* BUY OUTSIDE INDICATOR FOR RECEPTIONIST */}
            {hasBuyOutsideItems && (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '12.5px', color: '#c2410c', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={18} color="#ea580c" />
                <span>
                  <strong>Receptionist Reminder:</strong> Patient has <strong>"Buy Outside" medicines</strong> on their prescription. Please remind them to collect their printed <strong>Outside Pharmacy Purchase Slip</strong> if not already received.
                </span>
              </div>
            )}

            {/* BILL STATUS HEADER */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Billed Patient</span>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{bill.patient_name}</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>UHID: {bill.patient_uhid || 'N/A'} | Mobile: {bill.mobile || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  background: bill.status === 'PAID' ? '#dcfce7' : (bill.status === 'PARTIALLY_PAID' ? '#fef3c7' : '#fef2f2'),
                  color: bill.status === 'PAID' ? '#15803d' : (bill.status === 'PARTIALLY_PAID' ? '#b45309' : '#dc2626')
                }}>
                  {bill.status}
                </span>
                {bill.appointment_id && (
                  <button type="button" onClick={handleViewPrescription} style={{ background: '#7e22ce', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={15} /> Print Prescription
                  </button>
                )}
                <button type="button" onClick={handleDownloadPdf} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={15} /> Download PDF
                </button>
              </div>
            </div>

            {/* ITEMIZED TABLE */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>Itemized Charges</h4>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={handleViewPrescription} style={{ background: '#f8fafc', color: '#0284c7', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileText size={14} /> View Rx
                  </button>
                  {isReceptionist && (
                    <>
                      <button type="button" onClick={handleImportPrescription} disabled={actionLoading} style={{ background: '#faf5ff', color: '#7e22ce', border: '1px solid #d8b4fe', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={14} /> Auto-Import Digital Rx
                      </button>
                      <button type="button" onClick={() => setShowAddItem(!showAddItem)} style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={14} /> Add Line Item
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* QUICK PHARMACY & LAB CHARGES FOR PAPER PRESCRIPTIONS */}
              {isReceptionist && (
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b' }}>⚡ Quick Add Paper Rx Charges:</span>
                  {[
                    { cat: 'PHARMACY', desc: 'OPD Standard Medicine Pack', amt: 150 },
                    { cat: 'PHARMACY', desc: 'Injection & Syringe Charges', amt: 100 },
                    { cat: 'PHARMACY', desc: 'Dressing & Bandage Charge', amt: 150 },
                    { cat: 'LAB', desc: 'Routine Blood Test / Hemogram', amt: 300 }
                  ].map((x, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleAddManualItem(x.cat, x.desc, x.amt)}
                      style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      +{x.desc.split(' ')[0]} (₹{x.amt})
                    </button>
                  ))}
                </div>
              )}

              {/* INLINE ADD ITEM FORM */}
              {showAddItem && isReceptionist && (
                <form onSubmit={handleAddItem} style={{ background: '#f0f9ff', padding: '14px', borderRadius: '10px', border: '1px solid #bae6fd', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 80px', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Category</label>
                    <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                      <option value="CONSULTATION">CONSULTATION</option>
                      <option value="LAB">LAB</option>
                      <option value="PHARMACY">PHARMACY</option>
                      <option value="ADMISSION">ADMISSION</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Description *</label>
                    <input type="text" required placeholder="e.g. Complete Blood Count (CBC)" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Amount (₹) *</label>
                    <input type="number" step="0.01" required placeholder="500" value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Qty</label>
                    <input type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                  </div>
                  <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                </form>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', borderRadius: '8px 0 0 8px' }}>Category</th>
                    <th style={{ padding: '10px 12px' }}>Description</th>
                    <th style={{ padding: '10px 12px' }}>Qty</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Rate</th>
                    {isReceptionist && <th style={{ padding: '10px 12px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {bill.items?.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px' }}><span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>{item.category}</span></td>
                      <td style={{ padding: '10px 12px' }}><strong>{item.description}</strong></td>
                      <td style={{ padding: '10px 12px' }}>{item.quantity || 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '700' }}>₹{parseFloat(item.amount).toFixed(2)}</td>
                      {isReceptionist && (
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button type="button" onClick={() => handleDeleteItem(item.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALS & PAYMENT RECORDING */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#fafafa', padding: '18px', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
              <div>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Payment Summary</h5>
                <p style={{ margin: '0 0 6px 0', fontSize: '13px' }}><strong>Total Amount:</strong> ₹{parseFloat(bill.total_amount || 0).toFixed(2)}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#15803d' }}><strong>Paid Amount:</strong> ₹{parseFloat(bill.paid_amount || 0).toFixed(2)}</p>
                <p style={{ margin: '0', fontSize: '14px', color: (parseFloat(bill.total_amount) - parseFloat(bill.paid_amount)) > 0 ? '#dc2626' : '#15803d' }}>
                  <strong>Balance Due:</strong> ₹{(parseFloat(bill.total_amount || 0) - parseFloat(bill.paid_amount || 0)).toFixed(2)}
                </p>
              </div>

              {isReceptionist ? (
                <div>
                  <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Record Payment</h5>
                  <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Enter amount to pay..."
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}>
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI / GPay</option>
                      <option value="CARD">CARD (Credit/Debit)</option>
                      <option value="INSURANCE">INSURANCE</option>
                    </select>
                    <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>
                      Record Payment
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <CreditCard size={28} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>View-Only Mode</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Only Receptionists can manage payments.</span>
                </div>
              )}
            </div>

            {/* PAST PAID TRANSACTIONS HISTORY */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> Patient's Paid / Previous Bill History
              </h5>
              
              {previousBills.length === 0 ? (
                <div style={{ fontSize: '12.5px', color: '#64748b', textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                  No previous paid bills found for this patient.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                  {previousBills.map(b => {
                    const billTotal = parseFloat(b.total_amount || 0);
                    return (
                      <div
                        key={b.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '10px 14px',
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                            onClick={() => {
                              if (b.pdf_url) {
                                window.open(`http://localhost:5000${b.pdf_url}`, '_blank');
                              } else {
                                authFetch(`http://localhost:5000/api/admin/bills/${b.id}/pdf`)
                                  .then(r => r.json())
                                  .then(d => {
                                    if (d.success && d.pdfUrl) {
                                      window.open(`http://localhost:5000${d.pdfUrl}`, '_blank');
                                    }
                                  });
                              }
                            }}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Printer size={13} /> Print Invoice
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
