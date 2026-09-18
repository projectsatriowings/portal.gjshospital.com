import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, PhoneCall, Stethoscope, Sparkles } from 'lucide-react';

const BookAppointmentCTA = ({ departmentName }) => {
  return (
    <section style={{ maxWidth: '1240px', margin: '70px auto 40px', padding: '0 20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f2b48 0%, #1a3a6e 50%, #0070c0 100%)',
        borderRadius: '28px',
        padding: '50px 40px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '30px',
        boxShadow: '0 20px 40px rgba(0,112,192,0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* BACKGROUND GLOW */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(56,189,248,0.15)', blur: '40px', pointerEvents: 'none' }}></div>

        {/* LEFT TEXT */}
        <div style={{ flex: '1 1 500px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', color: '#93c5fd', marginBottom: '16px' }}>
            <Sparkles size={14} color="#38bdf8" />
            <span>24/7 PATIENT APPOINTMENTS AVAILABLE</span>
          </div>

          <h2 style={{ fontSize: '38px', fontWeight: '800', margin: '0 0 12px 0', color: '#fff', lineHeight: 1.2 }}>
            Need Expert Medical Care in {departmentName}?
          </h2>
          <p style={{ fontSize: '18px', color: '#e0f2fe', margin: 0, lineHeight: '1.6' }}>
            Book an appointment with our experienced specialists today and get personalized healthcare.
          </p>
        </div>

        {/* RIGHT BUTTONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          <Link to="/appointment" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#00a3c8',
            color: '#fff',
            padding: '16px 32px',
            borderRadius: '30px',
            fontWeight: '700',
            fontSize: '15px',
            textDecoration: 'none',
            boxShadow: '0 8px 20px rgba(0,163,200,0.4)',
            transition: 'transform 0.2s ease'
          }}>
            <Calendar size={18} />
            Book Appointment
          </Link>

          <a href="tel:+919876543210" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '1.5px solid rgba(255,255,255,0.4)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '16px 32px',
            borderRadius: '30px',
            fontWeight: '700',
            fontSize: '15px',
            textDecoration: 'none',
            transition: 'background 0.2s ease'
          }}>
            <PhoneCall size={18} />
            Call Emergency
          </a>
        </div>
      </div>
    </section>
  );
};

export default BookAppointmentCTA;
