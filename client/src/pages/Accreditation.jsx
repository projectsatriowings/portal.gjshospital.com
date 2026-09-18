import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAccreditations } from '../services/servicesService';
import { Award, Shield, CheckCircle, ShieldAlert, RefreshCw, Star, ShieldCheck } from 'lucide-react';
import serviBanner from '../assets/servi-cBPaOtoF.jpg';

const DEFAULT_ACCREDITATIONS = [
  { id: 1, icon: 'Award', title: 'NABH', description: 'National Accreditation Board for Hospitals & Healthcare Providers. A benchmark for quality healthcare and patient safety.' },
  { id: 2, icon: 'ShieldAlert', title: 'NABL', description: 'National Accreditation Board for Testing and Calibration Laboratories. Ensuring the highest standard of precision and reliability in lab diagnostics.' },
  { id: 3, icon: 'CheckCircle', title: 'ISO 9001:2015', description: 'Quality Management System certification validating our patient-centric operations and continuous improvements.' },
  { id: 4, icon: 'Award', title: 'ISO/IEC 27001', description: 'Information Security Management standard guaranteeing the privacy, confidentiality, and integrity of patient health records.' }
];

const Accreditation = () => {
  const [accreditations, setAccreditations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getAccreditations();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAccreditations(res.data.filter(s => s.status !== 'inactive'));
        } else {
          setAccreditations(DEFAULT_ACCREDITATIONS);
        }
      } catch (e) {
        console.error('Error fetching accreditations:', e);
        setAccreditations(DEFAULT_ACCREDITATIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderIcon = (iconName, color = "#007cb9", size = 30) => {
    switch (iconName) {
      case 'Award':
        return <Award size={size} color={color} />;
      case 'ShieldAlert':
        return <ShieldAlert size={size} color={color} />;
      case 'CheckCircle':
        return <CheckCircle size={size} color={color} />;
      case 'ShieldCheck':
        return <ShieldCheck size={size} color={color} />;
      case 'Star':
        return <Star size={size} color={color} />;
      case 'Shield':
        return <Shield size={size} color={color} />;
      default:
        return <Award size={size} color={color} />;
    }
  };

  return (
    <main style={{ backgroundColor: '#f8fafc' }}>
      <style>{`
        .accreditation-hero {
          height: 300px;
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          position: relative;
          text-align: center;
        }
        .accreditation-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(26, 58, 110, 0.75);
          z-index: 1;
        }
        .accreditation-hero h1 {
          font-size: 42px;
          font-weight: 800;
          margin-bottom: 12px;
          z-index: 2;
        }
        .accreditation-hero h2 {
          font-size: 16px;
          font-weight: 600;
          z-index: 2;
        }
        .accreditation-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 40px 30px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.3s ease;
        }
        .accreditation-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 124, 185, 0.08);
          border-color: #cbd5e1;
        }
      `}</style>

      {/* HERO BANNER */}
      <section className="accreditation-hero" style={{ backgroundImage: `url(${serviBanner})` }}>
        <h1>Accreditation & Quality</h1>
        <h2>
          <Link to="/" style={{ color: '#00a3c8', marginRight: '10px', textDecoration: 'none' }}>Home</Link> 
          <span style={{ color: '#ffffff' }}>/ Accreditation & Quality</span>
        </h2>
      </section>

      {/* CONTENT INTRODUCTION */}
      <section style={{ maxWidth: '1200px', margin: '60px auto 30px', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#00a3c8', fontSize: '13px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
          <span style={{ width: '20px', height: '2px', background: '#00a3c8', display: 'inline-block' }}></span>
          <span>QUALITY ASSURANCE</span>
          <span style={{ width: '20px', height: '2px', background: '#00a3c8', display: 'inline-block' }}></span>
        </div>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 16px 0' }}>
          Our Accreditations & Quality Standards
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '750px', margin: '0 auto', lineHeight: '1.7' }}>
          G.J.S Multispeciality Hospital is committed to delivering the highest quality patient care with absolute safety and medical excellence. Our certifications reflect our compliance with rigorous international and national standards.
        </p>
      </section>

      {/* CARDS GRID */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RefreshCw size={36} color="#00a3c8" className="spin" style={{ marginBottom: '12px' }} style={{ display: 'inline' }} />
            <p style={{ color: '#64748b', fontWeight: '600', marginTop: '10px' }}>Loading quality accreditations...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '30px' }}>
            {accreditations.map((item, index) => (
              <div key={item.id || index} className="accreditation-card">
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  boxShadow: '0 4px 15px rgba(0, 124, 185, 0.08)'
                }}>
                  {renderIcon(item.icon, '#007cb9', 30)}
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 12px 0' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Accreditation;
