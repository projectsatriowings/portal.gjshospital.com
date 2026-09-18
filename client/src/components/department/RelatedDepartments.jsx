import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HeartPulse, Brain, Bone, Baby, Ear, Eye, Wind, Stethoscope, ShieldAlert, Activity } from 'lucide-react';

const getDepartmentIcon = (iconName) => {
  switch (iconName?.toLowerCase()) {
    case 'heartpulse': return HeartPulse;
    case 'brain': return Brain;
    case 'bone': return Bone;
    case 'baby': return Baby;
    case 'ear': return Ear;
    case 'eye': return Eye;
    case 'wind': return Wind;
    case 'stethoscope': return Stethoscope;
    case 'shieldalert': return ShieldAlert;
    default: return Activity;
  }
};

const RelatedDepartments = ({ currentDeptId }) => {
  const [relatedDepts, setRelatedDepts] = useState([]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_BASE_URL}/departments/related/${currentDeptId}`);
        const data = await res.json();
        if (data.success) {
          setRelatedDepts(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching related departments:', err);
      }
    };
    if (currentDeptId) fetchRelated();
  }, [currentDeptId]);

  if (relatedDepts.length === 0) return null;

  return (
    <section style={{ maxWidth: '1240px', margin: '40px auto 70px', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '45px' }}>
        <span style={{ color: '#0070c0', fontWeight: '800', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>EXPLORE OTHER SPECIALTIES</span>
        <h2 style={{ fontSize: '36px', color: '#1a3a6e', margin: '6px 0 12px', fontWeight: '800' }}>
          Related Departments
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Discover our other specialized clinical departments and expert medical care units.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
        {relatedDepts.map((dept) => {
          const IconComp = getDepartmentIcon(dept.icon);
          return (
            <div 
              key={dept.id}
              style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '28px 24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
              }}
            >
              <div>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#e0f2fe', color: '#0070c0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <IconComp size={28} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a3a6e', marginBottom: '10px' }}>
                  {dept.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {dept.short_description}
                </p>
              </div>

              <Link 
                to={`/departments/${dept.slug || dept.id}`}
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
          );
        })}
      </div>
    </section>
  );
};

export default RelatedDepartments;
