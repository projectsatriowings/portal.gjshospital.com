import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Stethoscope, Building, Ticket, FileText, CheckCircle2, AlertCircle, RotateCcw, XCircle, UserX, History, Printer, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

export default function AppointmentDetailModal({ isOpen, appointmentId, onClose, onRefresh }) {
  const { authFetch, user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Inline action forms
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ newDate: '', newTime: '10:00 AM - 11:00 AM' });

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchDetail = async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/${appointmentId}`);
      const data = await res.json();
      if (data.success) {
        setAppointment(data.data);
      } else {
        setError(data.error || 'Failed to fetch appointment details');
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
      setError('Network error loading details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && appointmentId) {
      setShowRescheduleForm(false);
      setShowCancelForm(false);
      fetchDetail();
    }
  }, [isOpen, appointmentId]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/${appointment.id}/confirm`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        fetchDetail();
        onRefresh();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to confirm appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleData.newDate || !rescheduleData.newTime) {
      setError('Please select new date and time slot.');
      return;
    }
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/${appointment.id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rescheduleData)
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        setShowRescheduleForm(false);
        fetchDetail();
        onRefresh();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to reschedule appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/${appointment.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        setShowCancelForm(false);
        fetchDetail();
        onRefresh();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/${appointment.id}/complete`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        fetchDetail();
        onRefresh();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to complete appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/${appointment.id}/no-show`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        fetchDetail();
        onRefresh();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to mark no-show');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/${appointment.id}/check-in`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Patient checked in successfully!');
        fetchDetail();
        onRefresh();
      } else {
        setError(data.error || 'Failed to check in patient');
      }
    } catch (err) {
      setError('Failed to check in patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintSlip = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/${appointment.id}/slip`);
      const data = await res.json();
      if (data.success && data.pdfUrl) {
        window.open(`http://localhost:5000${data.pdfUrl}`, '_blank');
      }
    } catch (err) {
      setError('Failed to generate printed appointment slip');
    }
  };

  const handleViewPrescription = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/${appointment.id}/prescription`);
      const data = await res.json();
      if (data.success && data.data?.pdf_url) {
        window.open(`http://localhost:5000${data.data.pdf_url}`, '_blank');
      } else if (data.success && data.data?.paper_rx_url) {
        window.open(data.data.paper_rx_url, '_blank');
      } else {
        setError('No prescription recorded for this appointment yet.');
      }
    } catch (err) {
      setError('No prescription found for this appointment.');
    }
  };

  const status = appointment?.status ? appointment.status.toUpperCase() : 'PENDING';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '750px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        border: '1px solid #cbd5e1'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #004861 100%)',
          color: '#ffffff',
          borderRadius: '20px 20px 0 0'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Appointment Details
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              #{appointment?.appointment_id || appointment?.id}
              {appointment?.token_number && (
                <span style={{ background: '#38bdf8', color: '#0f172a', padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: '800' }}>
                  Token #{appointment.token_number}
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Loading appointment details...</div>
        ) : appointment ? (
          <div style={{ padding: '24px 28px' }}>
            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '16px', border: '1px solid #fecaca' }}>
                ⚠️ {error}
              </div>
            )}

            {message && (
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
                ✅ {message}
              </div>
            )}

            {/* STATUS & ACTIONS BAR */}
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Current Status
                </span>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  background: status.includes('CONFIRM') ? '#dcfce7' : (status.includes('COMPLET') ? '#e0f2fe' : (status.includes('CANCEL') ? '#fef2f2' : '#fef3c7')),
                  color: status.includes('CONFIRM') ? '#15803d' : (status.includes('COMPLET') ? '#0369a1' : (status.includes('CANCEL') ? '#dc2626' : '#b45309'))
                }}>
                  {status}
                </span>
              </div>

              {/* ACTION BUTTONS BASED ON ROLE & STATUS */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {status.includes('PENDING') && (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={actionLoading}
                    style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
                  >
                    Confirm & Assign Token
                  </button>
                )}

                {(status.includes('PENDING') || status.includes('CONFIRM') || status.includes('RESCHED')) && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setShowRescheduleForm(!showRescheduleForm); setShowCancelForm(false); }}
                      disabled={actionLoading}
                      style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
                    >
                      Reschedule
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowCancelForm(!showCancelForm); setShowRescheduleForm(false); }}
                      disabled={actionLoading}
                      style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {(status.includes('CONFIRM') || status.includes('RESCHED')) && user?.role === 'DOCTOR' && (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={actionLoading}
                    style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
                  >
                    Mark Completed
                  </button>
                )}

                {(status.includes('CONFIRM') || status.includes('RESCHED')) && (
                  <button
                    type="button"
                    onClick={handleNoShow}
                    disabled={actionLoading}
                    style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
                  >
                    Mark No-Show
                  </button>
                )}

                {(status.includes('CONFIRM') || status.includes('RESCHED')) && !appointment.checked_in_at && (user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'RECEPTIONIST') && (
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <UserCheck size={15} /> Check In
                  </button>
                )}

                {appointment.checked_in_at && (
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <UserCheck size={15} /> Checked In ({new Date(appointment.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}

                {(status.includes('CONFIRM') || status.includes('COMPLET') || status.includes('RESCHED')) && (
                  <>
                    <button
                      type="button"
                      onClick={handleViewPrescription}
                      style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <FileText size={15} /> View Doctor Rx
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintSlip}
                      style={{ background: '#0f172a', color: '#38bdf8', border: '1px solid #334155', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Printer size={15} /> Print Slip
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* INLINE RESCHEDULE FORM */}
            {showRescheduleForm && (
              <form onSubmit={handleRescheduleSubmit} style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: '800', color: '#0369a1', margin: '0 0 10px 0' }}>🗓️ Reschedule Date & Time</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>New Date *</label>
                    <input
                      type="date"
                      required
                      value={rescheduleData.newDate}
                      onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>New Time Slot *</label>
                    <select
                      value={rescheduleData.newTime}
                      onChange={(e) => setRescheduleData({ ...rescheduleData, newTime: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    >
                      <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                      <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                      <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                      <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                      <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={actionLoading} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>
                  Confirm Reschedule
                </button>
              </form>
            )}

            {/* INLINE CANCEL FORM */}
            {showCancelForm && (
              <form onSubmit={handleCancelSubmit} style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '20px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: '800', color: '#991b1b', margin: '0 0 10px 0' }}>❌ Reason for Cancellation</h5>
                <input
                  type="text"
                  placeholder="Enter reason for patient notification..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginBottom: '10px' }}
                />
                <button type="submit" disabled={actionLoading} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>
                  Confirm Cancellation
                </button>
              </form>
            )}

            {/* DOCTOR AVAILABILITY & SLOT VERIFICATION CARD */}
            {appointment.slotVerification && (
              <div style={{
                background: appointment.slotVerification.isDoctorOnLeave ? '#fef2f2' : (appointment.slotVerification.existingSlotBookingsCount > 0 ? '#fffbebfb' : '#f0fdf4'),
                border: `1px solid ${appointment.slotVerification.isDoctorOnLeave ? '#fecaca' : (appointment.slotVerification.existingSlotBookingsCount > 0 ? '#fef08a' : '#bbf7d0')}`,
                padding: '14px 18px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Stethoscope size={18} color={appointment.slotVerification.isDoctorOnLeave ? '#dc2626' : (appointment.slotVerification.existingSlotBookingsCount > 0 ? '#b45309' : '#16a34a')} />
                    <div>
                      <strong style={{ fontSize: '13px', color: appointment.slotVerification.isDoctorOnLeave ? '#991b1b' : (appointment.slotVerification.existingSlotBookingsCount > 0 ? '#854d0e' : '#14532d') }}>
                        Slot Verification: {appointment.slotVerification.statusMessage}
                      </strong>
                      <span style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        Doctor: {appointment.doctor_name || 'Specialist'} | Date: {new Date(appointment.appointment_date || appointment.preferred_date).toLocaleDateString()} | Slot: {appointment.preferred_time}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: appointment.slotVerification.isDoctorOnLeave ? '#fee2e2' : (appointment.slotVerification.existingSlotBookingsCount > 0 ? '#fef9c3' : '#dcfce7'),
                    color: appointment.slotVerification.isDoctorOnLeave ? '#991b1b' : (appointment.slotVerification.existingSlotBookingsCount > 0 ? '#854d0e' : '#15803d')
                  }}>
                    {appointment.slotVerification.isDoctorOnLeave ? 'ON LEAVE' : (appointment.slotVerification.existingSlotBookingsCount > 0 ? `${appointment.slotVerification.existingSlotBookingsCount} BOOKED IN SLOT` : 'SLOT FREE')}
                  </span>
                </div>

                {appointment.slotVerification.existingSlotPatients?.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '12px', color: '#475569' }}>
                    <strong>Patients Already Confirmed in this Slot:</strong>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      {appointment.slotVerification.existingSlotPatients.map((p, idx) => (
                        <li key={idx}>
                          <strong>{p.patient_name}</strong> (Token #{p.token_number || 'N/A'}) — Status: {p.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* DETAILS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={{ background: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
                  Patient Information
                </h4>
                <p style={{ margin: '0 0 6px 0', fontSize: '13.5px' }}><strong>Name:</strong> {appointment.patient_name}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: '13.5px' }}><strong>Mobile:</strong> {appointment.mobile}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: '13.5px' }}><strong>Email:</strong> {appointment.email || 'N/A'}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: '13.5px' }}><strong>UHID:</strong> <span style={{ color: '#0284c7', fontWeight: '700' }}>{appointment.patient_uhid || 'N/A'}</span></p>
              </div>

              <div style={{ background: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
                  Consultation Info
                </h4>
                <p style={{ margin: '0 0 6px 0', fontSize: '13.5px' }}><strong>Doctor:</strong> {appointment.doctor_name || 'Assigned Specialist'}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: '13.5px' }}><strong>Department:</strong> {appointment.department_name || appointment.department || 'General'}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: '13.5px' }}><strong>Date:</strong> {new Date(appointment.preferred_date || appointment.appointment_date).toLocaleDateString()}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: '13.5px' }}><strong>Time Slot:</strong> {appointment.preferred_time || '10:00 AM'}</p>
              </div>
            </div>

            {/* REASON FOR VISIT */}
            <div style={{ marginBottom: '24px' }}>
              <strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Reason for Visit</strong>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#334155', border: '1px solid #e2e8f0' }}>
                {appointment.reason || appointment.message || 'General Medical Consultation'}
              </div>
            </div>

            {/* ACTION LOG / TIMELINE */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <History size={16} color="#0070c0" /> Action Log & Status Timeline
              </h4>

              {(!appointment.statusLogs || appointment.statusLogs.length === 0) ? (
                <div style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                  Initial booking record registered on {new Date(appointment.created_at).toLocaleString()}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {appointment.statusLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', borderLeft: '3px solid #0070c0' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                          Status changed to <span style={{ color: '#0070c0' }}>{log.new_status}</span> by {log.changed_by_name || 'Staff'}
                        </span>
                        {log.reason && (
                          <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Reason: {log.reason}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(log.changed_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
