import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, PhoneCall, Heart, Stethoscope, Sparkles } from 'lucide-react';
import doctorBannerImg from '../../assets/doctorbanner-DBb3fK7X.avif';

const SERVER_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

const DepartmentHero = ({ department }) => {
  const tagline = department.hero?.description || department.tagline || department.short_description || `Advanced & Comprehensive ${department.name} Care with Experienced Specialists and World-Class Medical Infrastructure.`;

  const heroImgRaw = department.hero?.banner_image_url || department.banner_image;
  const isCustomImage = !!heroImgRaw;
  const heroImgUrl = heroImgRaw 
    ? (heroImgRaw.startsWith('http') ? heroImgRaw : `${SERVER_URL}${heroImgRaw}`)
    : doctorBannerImg;

  // Use a sleek dark-gradient on the left for text contrast when custom image is uploaded
  const backgroundStyle = isCustomImage
    ? `linear-gradient(90deg, rgba(15, 23, 42, 0.90) 0%, rgba(15, 23, 42, 0.50) 50%, rgba(15, 23, 42, 0.15) 100%), url('${heroImgUrl}')`
    : `linear-gradient(135deg, rgba(15,43,72,0.92) 0%, rgba(26,58,110,0.88) 50%, rgba(0,112,192,0.82) 100%), url('${heroImgUrl}')`;

  return (
    <section style={{
      position: 'relative',
      background: backgroundStyle,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: '#fff',
      padding: '80px 20px 100px',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '30px', left: '50px', opacity: 0.08, pointerEvents: 'none' }}>
        <Heart size={140} color="#fff" />
      </div>
      <div style={{ position: 'absolute', bottom: '40px', right: '80px', opacity: 0.08, pointerEvents: 'none' }}>
        <Stethoscope size={160} color="#fff" />
      </div>

      <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', color: '#7dd3fc', marginBottom: '20px' }}>
            <Sparkles size={14} color="#38bdf8" />
            <span>{department.hero?.small_title || 'EXCELLENCE IN CLINICAL CARE'}</span>
          </div>

          <h1 style={{ fontSize: '52px', fontWeight: '800', margin: '0 0 16px 0', letterSpacing: '-0.5px', color: '#fff', lineHeight: 1.15, textShadow: '0 4px 15px rgba(0,0,0,0.4)' }}>
            {department.hero?.main_title || `${department.name} Department`}
          </h1>

          <p style={{ fontSize: '20px', color: '#e0f2fe', lineHeight: '1.6', margin: '0 0 32px 0', fontWeight: '400', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
            {tagline}
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link 
              to={department.hero?.primary_button_link || "/appointment"} 
              style={{ 
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
                boxShadow: '0 8px 24px rgba(0,163,200,0.4)'
              }}
            >
              <Calendar size={18} />
              {department.hero?.primary_button_text || "Book Appointment"}
            </Link>

            <a 
              href={department.hero?.secondary_button_link || "tel:+919876543210"} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '10px', 
                backgroundColor: 'rgba(255,255,255,0.18)', 
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255,255,255,0.4)', 
                color: '#fff', 
                padding: '16px 32px', 
                borderRadius: '30px', 
                fontWeight: '700', 
                fontSize: '15px', 
                textDecoration: 'none'
              }}
            >
              <PhoneCall size={18} />
              {department.hero?.secondary_button_text || "Call Now"}
            </a>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', overflow: 'hidden', lineHeight: 0 }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: 'relative', display: 'block', width: 'calc(100% + 1.3px)', height: '40px' }}>
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,149.25,123.63,222,109.81Z" fill="#f8fafc"></path>
        </svg>
      </div>
    </section>
  );
};

export default DepartmentHero;
