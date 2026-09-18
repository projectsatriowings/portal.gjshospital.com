import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';

const TreatmentCards = ({ department }) => {
  const rawTreatments = Array.isArray(department.treatments)
    ? department.treatments
    : (department.treatments && Array.isArray(department.treatments.items) ? department.treatments.items : []);

  const treatmentsList = rawTreatments.length > 0
    ? rawTreatments.map((t, idx) => ({
        title: typeof t === 'string' ? t : (t.title || `Treatment ${idx + 1}`),
        desc: typeof t === 'string' ? `Advanced procedure performed by senior ${department.name} specialists.` : (t.desc || t.description || `Clinical intervention in ${department.name}.`)
      }))
    : null;

  if (!treatmentsList) return null;

  return (
    <section style={{ backgroundColor: '#f8fafc', padding: '70px 20px', borderTop: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ color: '#0070c0', fontWeight: '800', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>SPECIALIZED PROCEDURES</span>
          <h2 style={{ fontSize: '36px', color: '#1a3a6e', margin: '6px 0 12px', fontWeight: '800' }}>
            Treatments & Procedures
          </h2>
          <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '650px', margin: '0 auto' }}>
            Comprehensive clinical interventions offered under the {department.name} department.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '25px' }}>
          {treatmentsList.map((item, idx) => (
            <div 
              key={idx}
              style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '28px 24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#e0f2fe', color: '#0070c0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Zap size={28} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a3a6e', marginBottom: '10px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
                  {item.desc}
                </p>
              </div>

              <Link
                to="/appointment"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#0070c0',
                  fontWeight: '700',
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                Learn More <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TreatmentCards;
