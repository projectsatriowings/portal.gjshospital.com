import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Stethoscope, Calendar, Users, Clock, CheckCircle2, XCircle, AlertCircle, 
  RefreshCw, Eye, Plus, Trash2, User, ChevronRight, Activity, FileText, Ban
} from 'lucide-react';
import DoctorPrescriptionModal from './DoctorPrescriptionModal';
import IPDAdmissions from './IPDAdmissions';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const DoctorDashboard = () => {
  const { user, logout, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ todayCount: 0, totalCount: 0, pendingCount: 0, patientCount: 0 });
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Prescription Modal State
  const [selectedPrescriptionApp, setSelectedPrescriptionApp] = useState(null);

  // Patient Profile Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);

  // Leave / Unavailability Form Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [blockedDate, setBlockedDate] = useState('');
  const [blockedSlot, setBlockedSlot] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [savingLeave, setSavingLeave] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Fetch Dashboard Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Stats
      const statsRes = await authFetch(`${API_BASE_URL}/doctor/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // 2. Appointments (Strictly Doctor's Own Appointments)
      const appRes = await authFetch(`${API_BASE_URL}/doctor/appointments`);
      const appData = await appRes.json();
      if (appData.success) {
        setAppointments(appData.data || []);
      }

      // 3. Availability / Leaves
      const availRes = await authFetch(`${API_BASE_URL}/doctor/availability`);
      const availData = await availRes.json();
      if (availData.success) {
        setAvailability(availData.data || []);
      }

    } catch (err) {
      console.error('Error fetching doctor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Status Change Handler
  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor/appointments/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  // View Patient Profile
  const handleViewPatient = async (patientId) => {
    if (!patientId) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor/patients/${patientId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedPatient(data.patient);
        setPatientAppointments(data.appointments || []);
      } else {
        alert(data.error || 'Could not load patient profile.');
      }
    } catch (err) {
      console.error('Error viewing patient profile:', err);
    }
  };

  // Add Leave / Unavailability
  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!blockedDate) return;
    setSavingLeave(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocked_date: blockedDate,
          blocked_time_slot: blockedSlot,
          reason: leaveReason
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowLeaveModal(false);
        setBlockedDate('');
        setBlockedSlot('');
        setLeaveReason('');
        fetchData();
      }
    } catch (err) {
      console.error('Error blocking slot:', err);
    } finally {
      setSavingLeave(false);
    }
  };

  // Remove Leave
  const handleRemoveLeave = async (leaveId) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor/availability/${leaveId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error removing leave:', err);
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return a.status.toLowerCase().includes('pending');
    if (filterStatus === 'confirmed') return a.status.toLowerCase().includes('confirm');
    if (filterStatus === 'completed') return a.status.toLowerCase().includes('complete');
    return true;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    }}>
      {/* DOCTOR NAVBAR */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0070c0 0%, #004b7a 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Stethoscope size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: 0 }}>
              G.J.S Hospital — Doctor Portal
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              Clinical Appointments & Consultation Management
            </span>
          </div>
        </div>

        {/* LOGGED IN DOCTOR BADGE & LOGOUT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            style={{
              background: '#f1f5f9',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '6px 14px', borderRadius: '30px', border: '1px solid #cbd5e1' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0070c0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
              {user?.name ? user.name.charAt(0) : 'D'}
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'block', lineHeight: '1.2' }}>
                {user?.name}
              </span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#0070c0', textTransform: 'uppercase' }}>
                DOCTOR
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Log Out"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: '6px' }}
            >
              ×
            </button>
          </div>
        </div>
      </header>

      {/* SUB-NAV TABS */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', display: 'flex', gap: '8px' }}>
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Activity },
          { id: 'myAppointments', label: `My Appointments (${appointments.length})`, icon: Calendar },
          { id: 'ipdAdmissions', label: 'IPD Admissions', icon: Stethoscope },
          { id: 'myPatients', label: `My Patients (${stats.patientCount})`, icon: Users },
          { id: 'availability', label: 'Mark Leave / Unavailability', icon: Ban }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '16px 20px',
                background: 'none',
                border: 'none',
                fontWeight: activeTab === t.id ? '800' : '600',
                color: activeTab === t.id ? '#0070c0' : '#64748b',
                borderBottom: activeTab === t.id ? '3px solid #0070c0' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Icon size={18} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 20px' }}>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>TODAY'S APPOINTMENTS</span>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} />
                  </div>
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f2b48', margin: 0 }}>
                  {stats.todayCount}
                </h2>
              </div>

              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>TOTAL APPOINTMENTS</span>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={20} />
                  </div>
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f2b48', margin: 0 }}>
                  {stats.totalCount}
                </h2>
              </div>

              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>UNIQUE PATIENTS</span>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} />
                  </div>
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f2b48', margin: 0 }}>
                  {stats.patientCount}
                </h2>
              </div>
            </div>

            {/* APPOINTMENTS LIST OVERVIEW */}
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: '0 0 16px 0' }}>
                Recent Patient Bookings
              </h3>

              {appointments.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>No appointment requests assigned to you yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {appointments.slice(0, 5).map((app) => (
                    <div key={app.id} style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>{app.patient_name}</strong>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                          Date: {new Date(app.appointment_date || app.preferred_date).toLocaleDateString()} • Slot: {app.preferred_time} • Mobile: {app.mobile}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800',
                          background: (app.status && app.status.toLowerCase().includes('confirm')) ? '#dcfce7' : ((app.status && app.status.toLowerCase().includes('complete')) ? '#e0f2fe' : '#fef3c7'),
                          color: (app.status && app.status.toLowerCase().includes('confirm')) ? '#15803d' : ((app.status && app.status.toLowerCase().includes('complete')) ? '#0369a1' : '#b45309')
                        }}>
                          {app.status}
                        </span>

                        {(app.status && (app.status.toLowerCase().includes('confirm') || app.status.toLowerCase().includes('rescheduled'))) && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedPrescriptionApp(app)}
                              style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileText size={14} /> Write Prescription
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(app.id, 'Completed')}
                              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                            >
                              Mark Completed
                            </button>
                          </>
                        )}

                        {(app.status && app.status.toLowerCase().includes('complete')) && (
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1' }}>
                            ✓ Consultation Done
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY APPOINTMENTS */}
        {activeTab === 'myAppointments' && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: 0 }}>
                My Assigned Appointments
              </h3>

              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'pending', 'confirmed', 'completed'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: filterStatus === st ? '#0070c0' : '#ffffff',
                      color: filterStatus === st ? '#ffffff' : '#475569',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredAppointments.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                No appointments matching the selected filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                      <th style={{ padding: '14px 18px' }}>ID / Token</th>
                      <th style={{ padding: '14px 18px' }}>Patient Name</th>
                      <th style={{ padding: '14px 18px' }}>Mobile</th>
                      <th style={{ padding: '14px 18px' }}>Date & Slot</th>
                      <th style={{ padding: '14px 18px' }}>Reason</th>
                      <th style={{ padding: '14px 18px' }}>Status</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ background: '#f0f9ff', color: '#0284c7', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '12px' }}>
                            #{a.appointment_id || a.id}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <strong style={{ color: '#0f172a' }}>{a.patient_name}</strong>
                          <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>{a.patient_uhid ? `UHID: ${a.patient_uhid}` : ''}</span>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '700' }}>{a.mobile}</td>
                        <td style={{ padding: '14px 18px', color: '#334155' }}>
                          {new Date(a.appointment_date || a.preferred_date).toLocaleDateString()}
                          <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>{a.preferred_time}</span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#475569' }}>{a.reason || a.message || 'Consultation'}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800',
                            background: (a.status && a.status.toLowerCase().includes('confirm')) ? '#dcfce7' : ((a.status && a.status.toLowerCase().includes('complete')) ? '#e0f2fe' : (a.status && a.status.toLowerCase().includes('cancel') ? '#fef2f2' : '#fef3c7')),
                            color: (a.status && a.status.toLowerCase().includes('confirm')) ? '#15803d' : ((a.status && a.status.toLowerCase().includes('complete')) ? '#0369a1' : (a.status && a.status.toLowerCase().includes('cancel') ? '#dc2626' : '#b45309'))
                          }}>
                            {a.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedPrescriptionApp(a)}
                              style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileText size={14} /> {a.status && a.status.toLowerCase().includes('complete') ? 'Rx Details' : 'Write Rx'}
                            </button>

                            {(a.status && (a.status.toLowerCase().includes('confirm') || a.status.toLowerCase().includes('rescheduled'))) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(a.id, 'Completed')}
                                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  Mark Completed
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(a.id, 'Cancelled')}
                                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {(a.status && a.status.toLowerCase().includes('complete')) && (
                              <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0369a1', marginRight: '6px' }}>
                                ✓ Consultation Done
                              </span>
                            )}

                            {a.patient_id && (
                              <button
                                type="button"
                                onClick={() => handleViewPatient(a.patient_id)}
                                style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                Patient Profile
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: IPD ADMISSIONS */}
        {activeTab === 'ipdAdmissions' && (
          <IPDAdmissions authFetch={authFetch} user={user} />
        )}

        {/* TAB 3: MY PATIENTS */}
        {activeTab === 'myPatients' && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: '0 0 16px 0' }}>
              My Consulted Patients
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {Array.from(new Set(appointments.map(a => a.mobile))).map(mobile => {
                const app = appointments.find(a => a.mobile === mobile);
                return (
                  <div key={mobile} style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>{app.patient_name}</strong>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Mobile: {app.mobile}</span>
                    </div>

                    {app.patient_id && (
                      <button
                        type="button"
                        onClick={() => handleViewPatient(app.patient_id)}
                        style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                      >
                        View Profile
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AVAILABILITY & LEAVE */}
        {activeTab === 'availability' && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: '0 0 4px 0' }}>
                  Manage Leave & Unavailability
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Block out dates or time slots when you are unavailable for public appointments.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                style={{ background: '#0070c0', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Block Leave Date
              </button>
            </div>

            {availability.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                No blocked dates or leaves recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {availability.map((item) => (
                  <div key={item.id} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ color: '#dc2626', fontSize: '15px' }}>
                        Blocked Date: {new Date(item.blocked_date).toLocaleDateString()}
                      </strong>
                      <span style={{ fontSize: '13px', color: '#7f1d1d', display: 'block', marginTop: '2px' }}>
                        Reason: {item.reason || 'Leave'} • Slot: {item.blocked_time_slot || 'Full Day'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLeave(item.id)}
                      style={{ background: '#ffffff', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* BLOCK LEAVE MODAL */}
      {showLeaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '460px', borderRadius: '20px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: '0 0 16px 0' }}>
              Block Leave / Unavailability Date
            </h3>

            <form onSubmit={handleAddLeave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Select Date *</label>
                <input type="date" required value={blockedDate} onChange={(e) => setBlockedDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Time Slot (Optional)</label>
                <input type="text" placeholder="Full Day or e.g. 09:00 AM - 12:00 PM" value={blockedSlot} onChange={(e) => setBlockedSlot(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Reason</label>
                <input type="text" placeholder="e.g. Annual Leave, Emergency" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowLeaveModal(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={savingLeave} style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                  {savingLeave ? 'Blocking...' : 'Confirm Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* READ-ONLY PATIENT PROFILE MODAL FOR DOCTOR */}
      {selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '720px', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f2b48', margin: '0 0 4px 0' }}>
                  {selectedPatient.name}
                </h3>
                <span style={{ fontSize: '13px', color: '#0284c7', fontWeight: '700' }}>UHID: {selectedPatient.uhid}</span>
              </div>
              <button type="button" onClick={() => setSelectedPatient(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '20px' }}>
                <div><strong>Mobile:</strong> {selectedPatient.mobile}</div>
                <div><strong>Age/Gender:</strong> {selectedPatient.age || '-'} / {selectedPatient.gender || '-'}</div>
                <div><strong>Blood Group:</strong> {selectedPatient.blood_group || '-'}</div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f2b48', margin: '0 0 8px 0' }}>Allergies & Medical History</h4>
                <p style={{ fontSize: '13px', margin: '0 0 4px 0' }}><strong>Allergies:</strong> {selectedPatient.allergies || 'None reported.'}</p>
                <p style={{ fontSize: '13px', margin: 0 }}><strong>Pre-existing Diseases:</strong> {selectedPatient.existing_diseases || 'None reported.'}</p>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f2b48', margin: '0 0 8px 0' }}>Consultation History With You</h4>
                {patientAppointments.map(app => (
                  <div key={app.id} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginTop: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date: {new Date(app.appointment_date || app.preferred_date).toLocaleDateString()} ({app.preferred_time})</span>
                    <strong style={{ color: '#0070c0' }}>{app.status}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR PRESCRIPTION MODAL */}
      <DoctorPrescriptionModal
        isOpen={Boolean(selectedPrescriptionApp)}
        onClose={() => setSelectedPrescriptionApp(null)}
        appointment={selectedPrescriptionApp}
        authFetch={authFetch}
        onPrescriptionSaved={fetchData}
      />
    </div>
  );
};

export default DoctorDashboard;
