import React, { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import femaleImg from '../../assets/female2-BB8VFyZ1.jpg';
import maleImg from '../../assets/male-rnicTsFa.webp';

const TestimonialsSlider = ({ department }) => {
  const departmentName = department?.name || 'Department';
  const testimonialsList = Array.isArray(department?.testimonials) && department.testimonials.length > 0
    ? department.testimonials
    : null;

  if (!testimonialsList || testimonialsList.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonialsList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonialsList.length - 1 ? 0 : prev + 1));
  };

  const current = testimonialsList[currentIndex] || testimonialsList[0];

  return (
    <section style={{ backgroundColor: '#f8fafc', padding: '70px 20px', borderTop: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <span style={{ color: '#0070c0', fontWeight: '800', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>PATIENT REVIEWS & EXPERIENCES</span>
        <h2 style={{ fontSize: '36px', color: '#1a3a6e', margin: '6px 0 35px', fontWeight: '800' }}>
          What Our Patients Say
        </h2>

        <div style={{ background: '#fff', borderRadius: '24px', padding: '45px 35px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', position: 'relative' }}>
          <Quote size={48} color="#00a3c8" style={{ opacity: 0.2, position: 'absolute', top: '25px', left: '30px' }} />

          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '20px' }}>
            {Array.from({ length: current.rating || 5 }).map((_, i) => (
              <Star key={i} size={20} fill="#f59e0b" color="#f59e0b" />
            ))}
          </div>

          <p style={{ fontSize: '18px', color: '#334155', lineHeight: '1.8', fontStyle: 'italic', marginBottom: '30px', maxWidth: '750px', margin: '0 auto 30px' }}>
            "{current.review}"
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
            <img src={current.photo || (currentIndex % 2 === 0 ? maleImg : femaleImg)} alt={current.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00a3c8' }} />
            <div style={{ textAlign: 'left' }}>
              <strong style={{ fontSize: '16px', color: '#1a3a6e', display: 'block' }}>{current.name}</strong>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Treated under {departmentName}</span>
            </div>
          </div>

          {testimonialsList.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
              <button 
                onClick={handlePrev} 
                style={{ background: '#e0f2fe', color: '#0070c0', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={handleNext} 
                style={{ background: '#e0f2fe', color: '#0070c0', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSlider;
