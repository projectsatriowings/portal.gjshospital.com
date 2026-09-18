import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, Clock, MapPin, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { checkAppointmentStatus } from '../services/appointmentService';

const CheckStatus = () => {
  const [appointmentId, setAppointmentId] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!appointmentId.trim() || !mobile.trim()) {
      toast.error('Please enter both Appointment ID and Mobile Number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const response = await checkAppointmentStatus(appointmentId.trim(), mobile.trim());
      if (response.success && response.data) {
        setResult(response.data);
        toast.success('Appointment record found!');
      } else {
        const msg = response.message || 'No appointment found matching details.';
        setErrorMsg(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'No appointment found matching this ID and Mobile Number combination.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '80vh', backgroundColor: '#f8fafc', paddingBottom: '60px' }}>
      {/* HERO BANNER */}
      <section className="appfirstdiv" style={{ background: 'linear-gradient(135deg, #004861 0%, #00a3c8 100%)', height: '35vh' }}>
        <h1>Track Appointment Status</h1>
        <h2><Link to="/" style={{ color: '#fff', marginRight: '10px', textDecoration: 'none' }}>Home</Link> / Check Status</h2>
      </section>

      <div style={{ maxWidth: '800px', margin: '-50px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        {/* TRACK FORM CARD */}
        <div style={{ background: '#fff', padding: '40px 30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: '#004861', fontSize: '28px', marginBottom: '8px' }}>Check Your Appointment Status</h2>
            <p style={{ color: '#64748b', fontSize: '15px' }}>
              Enter your <strong>Appointment ID</strong> (e.g. <code>GJS-2026-1234</code>) and registered <strong>Mobile Number</strong>.
            </p>
          </div>

          <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 250px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#004861', fontSize: '14px' }}>
                  Appointment ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GJS-2026-8942"
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: '30px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '15px', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ flex: '1 1 250px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#004861', fontSize: '14px' }}>
                  Registered Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 7200480576"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: '30px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '15px', outline: 'none' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#00a3c8',
                color: '#fff',
                border: 'none',
                padding: '16px',
                borderRadius: '30px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '10px',
                transition: 'background 0.3s'
              }}
            >
              <Search size={20} />
              {loading ? 'Searching Record...' : 'Track Appointment Status'}
            </button>
          </form>
        </div>

        {/* ERROR STATE CARD */}
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '25px', borderRadius: '16px', color: '#991b1b', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <ShieldAlert size={28} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '17px' }}>Record Not Found / Privacy Safeguard</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#7f1d1d' }}>{errorMsg}</p>
            </div>
          </div>
        )}

        {/* RESULT CARD */}
        {result && (
          <div style={{ background: '#fff', borderRadius: '20px', border: '2px solid #00a3c8', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,163,200,0.15)' }}>
            <div style={{ background: '#004861', color: '#fff', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '13px', opacity: 0.8 }}>APPOINTMENT TRACKING RECORD</span>
                <h3 style={{ margin: 0, fontSize: '24px' }}>{result.appointmentId}</h3>
              </div>
              <div style={{ background: '#00a3c8', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontWeight: '700', fontSize: '14px' }}>
                {result.status}
              </div>
            </div>

            <div style={{ padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                <div>
                  <small style={{ color: '#64748b', fontWeight: '600' }}>PATIENT NAME</small>
                  <p style={{ margin: '4px 0 0', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{result.patientName}</p>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontWeight: '600' }}>DEPARTMENT</small>
                  <p style={{ margin: '4px 0 0', fontWeight: '700', fontSize: '16px', color: '#007cb9' }}>{result.department}</p>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontWeight: '600' }}>ASSIGNED DOCTOR</small>
                  <p style={{ margin: '4px 0 0', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{result.doctorName}</p>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontWeight: '600' }}>PREFERRED DATE & TIME</small>
                  <p style={{ margin: '4px 0 0', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>
                    {new Date(result.date).toLocaleDateString()} | {result.time}
                  </p>
                </div>
                <div>
                  <small style={{ color: '#64748b', fontWeight: '600' }}>TOKEN NUMBER</small>
                  <p style={{ margin: '4px 0 0', fontWeight: '800', fontSize: '18px', color: '#00a3c8' }}>{result.tokenNumber}</p>
                </div>
              </div>

              <div style={{ background: '#f0f9ff', borderLeft: '4px solid #00a3c8', padding: '16px 20px', borderRadius: '8px' }}>
                <h5 style={{ margin: '0 0 6px 0', color: '#0369a1', fontSize: '14px' }}>Hospital Instructions:</h5>
                <p style={{ margin: 0, color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>{result.instructions}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CheckStatus;
