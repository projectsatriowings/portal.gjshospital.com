import React, { useState } from 'react';
import { X, PackagePlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function StockInModal({ isOpen, onClose, medicine, authFetch, onStockUpdated }) {
  if (!isOpen || !medicine) return null;

  const [quantity, setQuantity] = useState(10);
  const [reference, setReference] = useState('Supplier Stock Invoice #');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await authFetch(`${API_BASE_URL}/admin/medicines/stock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicine_id: medicine.id,
          quantity: parseInt(quantity, 10),
          reference,
          batch_number: batchNumber,
          expiry_date: expiryDate || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setMsg(`✅ +${quantity} units added! New stock: ${data.medicine.current_stock}`);
        if (onStockUpdated) onStockUpdated(data.medicine);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMsg(`⚠️ ${data.error || 'Failed to record stock in.'}`);
      }
    } catch (err) {
      console.error('Error submitting stock-in:', err);
      setMsg('⚠️ Network error saving stock-in.');
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
        width: '100%', maxWidth: '480px', background: '#ffffff', borderRadius: '18px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden'
      }}>
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackagePlus size={20} />
              <span>Stock In (Receive Inventory)</span>
            </h3>
            <span style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px', display: 'block' }}>
              {medicine.name} ({medicine.unit || 'unit'})
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {msg && (
            <div style={{ background: msg.includes('⚠️') ? '#fef2f2' : '#f0fdf4', color: msg.includes('⚠️') ? '#dc2626' : '#15803d', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}>
              {msg}
            </div>
          )}

          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span>Current Available Stock:</span>
            <strong style={{ fontSize: '16px', color: medicine.current_stock > 0 ? '#15803d' : '#dc2626' }}>
              {medicine.current_stock || 0} {medicine.unit || 'units'}
            </strong>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Quantity Received (+ Units)</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '700', color: '#16a34a' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Batch Number</label>
              <input
                type="text"
                placeholder="e.g. BAT-908"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Expiry Date</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={{ width: '100%', padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Supplier Reference / Invoice Note</label>
            <input
              type="text"
              placeholder="e.g. Supplier Invoice #1042"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
              {loading ? 'Recording...' : 'Confirm Stock In'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
