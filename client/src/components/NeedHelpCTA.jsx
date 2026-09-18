import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, PhoneCall, Stethoscope, Clock } from 'lucide-react';

const NeedHelpCTA = () => {
  return (
    <section style={{ maxWidth: '1240px', margin: '0 auto 60px', padding: '0 20px' }}>
      <div style={{
        background: '#eaf5fb',
        borderRadius: '24px',
        padding: '35px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '25px',
        boxShadow: '0 10px 30px rgba(0,112,192,0.06)',
        border: '1px solid #d0e8f5'
      }}>
        {/* LEFT ILLUSTRATION GRAPHIC */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '20px',
            backgroundColor: '#1a3a6e',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(26,58,110,0.25)'
          }}>
            <Stethoscope size={36} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Calendar size={24} color="#0070c0" />
            <Clock size={24} color="#0070c0" />
          </div>
        </div>

        {/* CENTER TEXT */}
        <div style={{ flex: '1 1 350px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 6px 0' }}>
            Need Help Choosing the Right Department?
          </h2>
          <p style={{ fontSize: '15px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
            Our healthcare experts are here to help you. Book an appointment and get the right care.
          </p>
        </div>

        {/* RIGHT BUTTONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <Link to="/appointment" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1a3a6e',
            color: '#fff',
            padding: '14px 26px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '14px',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(26,58,110,0.25)',
            transition: 'background 0.2s ease'
          }}>
            <Calendar size={18} />
            Book an Appointment
          </Link>

          <a href="tel:+917200480576" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fff',
            color: '#0070c0',
            border: '1.5px solid #0070c0',
            padding: '14px 26px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '14px',
            textDecoration: 'none',
            transition: 'background 0.2s ease'
          }}>
            <PhoneCall size={18} />
            Call Us Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default NeedHelpCTA;
