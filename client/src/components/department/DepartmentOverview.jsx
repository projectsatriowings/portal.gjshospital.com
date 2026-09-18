import React from 'react';
import { Target, Compass, CheckCircle2, Award } from 'lucide-react';
import hospitalImg from '../../assets/about2-CjoqBkRb.webp';

import { SERVER_BASE_URL as SERVER_URL } from '../../services/api';

const DepartmentOverview = ({ department }) => {
  const servicesList = Array.isArray(department.overview?.clinical_services) && department.overview.clinical_services.length > 0
    ? department.overview.clinical_services
    : (Array.isArray(department.services) && department.services.length > 0
        ? department.services
        : [
            "Specialized Outpatient & Inpatient Consultations",
            "24/7 Emergency & Critical Care Interventions",
            "Advanced Diagnostic Imaging & Pathology Services",
            "Minimally Invasive Surgical Procedures",
            "Post-Operative & Comprehensive Rehabilitation Care"
          ]);

  const visionText = department.overview?.vision_desc || department.vision || `To be a globally recognized center of excellence in ${department.name}, providing pioneering clinical treatments, advanced research, and compassionate patient care.`;
  const missionText = department.overview?.mission_desc || department.mission || `To deliver affordable, accessible, and evidence-based ${department.name} treatments with zero compromise on safety, quality, or medical ethics.`;

  const overviewImgRaw = department.overview?.image_url || department.overview_image;
  const overviewImgUrl = overviewImgRaw 
    ? (overviewImgRaw.startsWith('http') ? overviewImgRaw : `${SERVER_URL}${overviewImgRaw}`)
    : hospitalImg;

  return (
    <section style={{ maxWidth: '1240px', margin: '60px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '50px' }}>
        <div style={{ flex: '1 1 450px', position: 'relative' }}>
          <img 
            src={overviewImgUrl} 
            alt={department.name} 
            style={{ width: '100%', height: '380px', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', border: '4px solid #fff' }}
          />
          <div style={{ position: 'absolute', bottom: '-20px', right: '20px', background: '#0070c0', color: '#fff', padding: '15px 25px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,112,192,0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award size={32} />
            <div>
              <strong style={{ fontSize: '18px', display: 'block' }}>{department.overview?.badge_text || 'Top Ranked'}</strong>
              <span style={{ fontSize: '12px', opacity: 0.9 }}>Clinical Department</span>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 500px' }}>
          <span style={{ color: '#0070c0', fontWeight: '800', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>{department.overview?.eyebrow || 'DEPARTMENT OVERVIEW'}</span>
          <h2 style={{ fontSize: '36px', color: '#1a3a6e', margin: '6px 0 20px', fontWeight: '800', lineHeight: '1.2' }}>
            {department.overview?.heading || `World-Class Care in ${department.name}`}
          </h2>
          <p style={{ fontSize: '16px', color: '#475569', lineHeight: '1.8', marginBottom: '25px' }}>
            {department.overview?.description || department.full_description || department.short_description || `Our ${department.name} department delivers comprehensive medical care adhering to international healthcare benchmarks.`}
          </p>

          <h4 style={{ fontSize: '18px', color: '#1a3a6e', marginBottom: '14px', fontWeight: '700' }}>Clinical Services & Specialized Programs</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {servicesList.map((svc, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{svc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
        <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '32px', borderRadius: '20px', border: '1px solid #bfdbfe' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
            <Target size={28} />
          </div>
          <h3 style={{ fontSize: '22px', color: '#1e3a8a', marginBottom: '12px', fontWeight: '800' }}>{department.overview?.vision_title || 'Our Vision'}</h3>
          <p style={{ fontSize: '15px', color: '#1e40af', lineHeight: '1.7', margin: 0 }}>
            {visionText}
          </p>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '32px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
            <Compass size={28} />
          </div>
          <h3 style={{ fontSize: '22px', color: '#14532d', marginBottom: '12px', fontWeight: '800' }}>{department.overview?.mission_title || 'Our Mission'}</h3>
          <p style={{ fontSize: '15px', color: '#166534', lineHeight: '1.7', margin: 0 }}>
            {missionText}
          </p>
        </div>
      </div>
    </section>
  );
};

export default DepartmentOverview;
