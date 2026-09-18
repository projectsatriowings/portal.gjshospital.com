import React from 'react';
import { Cpu } from 'lucide-react';

const FacilitiesGrid = ({ department }) => {
  const departmentName = department?.name || 'Department';
  const rawFacilities = Array.isArray(department?.facilities)
    ? department.facilities
    : (department.facilities && Array.isArray(department.facilities.items) ? department.facilities.items : []);

  const facilitiesList = rawFacilities.length > 0
    ? rawFacilities.map((f, idx) => ({
        name: typeof f === 'string' ? f : (f.name || `Facility ${idx + 1}`),
        desc: typeof f === 'string' ? `Advanced medical facility supporting ${departmentName}.` : (f.desc || f.description || `High-tech facility unit.`)
      }))
    : null;

  if (!facilitiesList) return null;

  return (
    <section style={{ maxWidth: '1240px', margin: '70px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <span style={{ color: '#0070c0', fontWeight: '800', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>INFRASTRUCTURE & MEDICAL TECH</span>
        <h2 style={{ fontSize: '36px', color: '#1a3a6e', margin: '6px 0 12px', fontWeight: '800' }}>
          Facilities & Advanced Technology
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '650px', margin: '0 auto' }}>
          Equipped with world-class medical infrastructure to support precision treatment in {departmentName}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '25px' }}>
        {facilitiesList.map((item, idx) => (
          <div 
            key={idx}
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '28px 22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Cpu size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6e', marginBottom: '10px' }}>
              {item.name}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FacilitiesGrid;
