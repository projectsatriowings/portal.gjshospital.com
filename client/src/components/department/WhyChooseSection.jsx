import React from 'react';
import { UserCheck } from 'lucide-react';

const WhyChooseSection = ({ department }) => {
  const departmentName = department?.name || 'Department';
  const rawWhyChoose = Array.isArray(department?.why_choose)
    ? department.why_choose
    : (department.why_choose && Array.isArray(department.why_choose.items) ? department.why_choose.items : []);

  const whyChooseList = rawWhyChoose.length > 0
    ? rawWhyChoose.map((w, idx) => ({
        title: w.title || `Feature ${idx + 1}`,
        desc: w.desc || w.description || `Feature details.`
      }))
    : null;

  if (!whyChooseList) return null;

  return (
    <section style={{ maxWidth: '1240px', margin: '70px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <span style={{ color: '#0070c0', fontWeight: '800', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>WHY CHOOSE US</span>
        <h2 style={{ fontSize: '36px', color: '#1a3a6e', margin: '6px 0 12px', fontWeight: '800' }}>
          Why Choose Our {departmentName} Department?
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '650px', margin: '0 auto' }}>
          We blend clinical expertise with cutting-edge technology to offer high-success clinical outcomes.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
        {whyChooseList.map((item, idx) => (
          <div 
            key={idx}
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              display: 'flex',
              gap: '18px',
              alignItems: 'flex-start'
            }}
          >
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', backgroundColor: '#e0f2fe', color: '#0070c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6e', marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseSection;
