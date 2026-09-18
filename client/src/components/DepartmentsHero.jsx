import React from 'react';
import { Users, ShieldCheck, HeartHandshake, Stethoscope, Building2, Heart, Activity, Sparkles, Award } from 'lucide-react';
import deptHeroBgImg from '../assets/dept_hero_bg.jpg';

const DepartmentsHero = ({ 
  title = "Our Departments", 
  subtext = "World-class medical care across a wide range of specialties. Find the best treatment for your health needs." 
}) => {
  return (
    <section style={{
      position: 'relative',
      background: `linear-gradient(125deg, rgba(7, 24, 46, 0.95) 0%, rgba(0, 55, 110, 0.92) 40%, rgba(0, 102, 204, 0.75) 75%, rgba(2, 132, 199, 0.6) 100%), url('${deptHeroBgImg}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundAttachment: 'fixed',
      color: '#fff',
      padding: '80px 24px 130px',
      overflow: 'hidden'
    }}>
      
      {/* AMBIENT GLOW EFFECTS */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        left: '-100px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }}></div>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '-50px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }}></div>

      {/* SUBTLE MEDICAL GRID PATTERN */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        opacity: 0.6
      }}></div>

      {/* MAIN CONTAINER */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '48px', 
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>

        {/* LEFT COLUMN: HERO HEADLINE & HIGHLIGHT PILLS */}
        <div style={{ maxWidth: '640px' }}>
          
          {/* EYEBROW BADGE */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(255, 255, 255, 0.12)', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '6px 16px', 
            borderRadius: '25px', 
            fontSize: '13px', 
            fontWeight: '700', 
            color: '#7dd3fc', 
            marginBottom: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <Sparkles size={15} color="#38bdf8" />
            <span>Comprehensive Care Under One Roof</span>
          </div>

          {/* MAIN HEADING */}
          <h1 style={{ 
            fontSize: 'clamp(36px, 5vw, 56px)', 
            fontWeight: '900', 
            margin: '0 0 20px 0', 
            letterSpacing: '-1px', 
            color: '#ffffff', 
            lineHeight: 1.12,
            textShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            {title}
          </h1>

          {/* SUBTITLE */}
          <p style={{ 
            fontSize: 'clamp(16px, 2vw, 19px)', 
            color: '#e0f2fe', 
            lineHeight: '1.65', 
            margin: '0 0 40px 0', 
            fontWeight: '400',
            opacity: 0.95
          }}>
            {subtext}
          </p>

          {/* 3 FEATURE PILLS ROW */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '16px' 
          }}>
            
            {/* PILL 1 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '12px 16px',
              borderRadius: '16px'
            }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}>
                <Users size={20} color="#fff" />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#fff', display: 'block', fontWeight: '800' }}>Expert Doctors</strong>
                <span style={{ fontSize: '11px', color: '#bae6fd' }}>Specialist Physicians</span>
              </div>
            </div>

            {/* PILL 2 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '12px 16px',
              borderRadius: '16px'
            }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}>
                <ShieldCheck size={20} color="#fff" />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#fff', display: 'block', fontWeight: '800' }}>Advanced Tech</strong>
                <span style={{ fontSize: '11px', color: '#bae6fd' }}>High-Tech Facilities</span>
              </div>
            </div>

            {/* PILL 3 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '12px 16px',
              borderRadius: '16px'
            }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}>
                <HeartHandshake size={20} color="#fff" />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#fff', display: 'block', fontWeight: '800' }}>Patient First</strong>
                <span style={{ fontSize: '11px', color: '#bae6fd' }}>Compassionate Care</span>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: TRENDING GLASSMORPHIC CARDS */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          width: '100%'
        }}>

          {/* TOP CARD */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '12px 26px',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.18)',
            marginBottom: '18px',
            transform: 'translateY(0)',
            transition: 'all 0.3s ease'
          }}>
            <Stethoscope size={24} color="#0284c7" />
            <div>
              <strong style={{ fontSize: '14px', display: 'block', color: '#0f2b48', fontWeight: '800' }}>Specialized Departments</strong>
            </div>
          </div>

          {/* MIDDLE ROW CARDS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
            
            {/* LEFT SMALL CARD */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              padding: '18px 22px',
              color: '#0f172a',
              textAlign: 'center',
              boxShadow: '0 12px 35px rgba(0,0,0,0.15)'
            }}>
              <Users size={26} color="#0284c7" style={{ margin: '0 auto 6px' }} />
              <strong style={{ fontSize: '13px', display: 'block', color: '#0f2b48', fontWeight: '800' }}>Integrated Care</strong>
            </div>

            {/* CENTER LARGE HIGHLIGHT CARD */}
            <div style={{
              background: '#ffffff',
              borderRadius: '28px',
              padding: '30px 28px',
              color: '#0f2b48',
              textAlign: 'center',
              boxShadow: '0 25px 50px rgba(0, 50, 110, 0.3)',
              border: '2px solid #e0f2fe',
              minWidth: '230px'
            }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '20px', 
                background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', 
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 6px 16px rgba(2, 132, 199, 0.2)'
              }}>
                <Building2 size={34} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#0369a1' }}>
                Complete Healthcare
              </h3>
              <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>for Every Need</span>
            </div>

            {/* RIGHT SMALL CARD */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              padding: '18px 22px',
              color: '#0f172a',
              textAlign: 'center',
              boxShadow: '0 12px 35px rgba(0,0,0,0.15)'
            }}>
              <Heart size={26} color="#0284c7" style={{ margin: '0 auto 6px' }} />
              <strong style={{ fontSize: '13px', display: 'block', color: '#0f2b48', fontWeight: '800' }}>Better Outcomes</strong>
            </div>

          </div>

          {/* BOTTOM CARD */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '12px 26px',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.18)',
            marginTop: '18px'
          }}>
            <HeartHandshake size={24} color="#0284c7" />
            <div>
              <strong style={{ fontSize: '14px', display: 'block', color: '#0f2b48', fontWeight: '800' }}>Better Tomorrow</strong>
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM CURVED FLUID WAVE CUTOUT */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        overflow: 'hidden',
        lineHeight: 0
      }}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ position: 'relative', display: 'block', width: 'calc(100% + 1.3px)', height: '60px' }}>
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.06,149.25,123.63,222,109.81Z" fill="#f8fafc"></path>
        </svg>
      </div>

    </section>
  );
};

export default DepartmentsHero;
