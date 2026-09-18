import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import serviBanner from '../assets/servi-cBPaOtoF.jpg';
import { getDepartments } from '../services/departmentService';
import { getOutsourcedServices, getFacilityServices, getInfrastructureServices } from '../services/servicesService';
import { 
  Heart, Activity, Bone, Ear, Stethoscope, ChevronRight, 
  Users, ArrowRight, Droplet, Pill, TestTube, Truck, 
  Bed, Scissors, Radio, ShieldCheck, Phone, MapPin, Calendar, 
  Sparkles, RefreshCw, CheckCircle2, Clock, Building,
  Microscope, HeartPulse, Baby, ClipboardList, Wrench, Zap, FileText, Volume2
} from 'lucide-react';

const DEFAULT_DEPARTMENTS = [
  { id: 1, name: 'Cardiology', slug: 'cardiology', short_description: 'Comprehensive heart care with advanced diagnostics and treatment.', doctor_count: '7+', accent_color: '#00a3c8' },
  { id: 2, name: 'Neurology', slug: 'neurology', short_description: 'Expert care for brain, spine and nervous system disorders.', doctor_count: '4+', accent_color: '#2563eb' },
  { id: 3, name: 'Orthopedics', slug: 'orthopedics', short_description: 'Advanced treatment for bones, joints, spine and muscle conditions.', doctor_count: '3+', accent_color: '#16a34a' },
  { id: 4, name: 'Pediatrics', slug: 'pediatrics', short_description: 'Complete healthcare for infants, children & adolescents.', doctor_count: '7+', accent_color: '#9333ea' },
  { id: 5, name: 'ENT', slug: 'ent', short_description: 'Diagnosis & treatment for ear, nose & throat disorders.', doctor_count: '7+', accent_color: '#ea580c' }
];

const DEFAULT_OUTSOURCED = [
  { id: 1, icon: 'Droplet', title: 'Blood Bank', description: 'Safe & reliable blood storage and transfusion services.' },
  { id: 2, icon: 'Activity', title: 'MRI / CT / Scanning', description: 'Advanced imaging services for accurate diagnosis.' },
  { id: 3, icon: 'Shirt', title: 'Laundry', description: 'Hygienic and professional laundry services.' }
];

const SUPPORTING_SERVICES_PROFESSIONAL = [
  { title: 'Physiotherapy', icon: <Activity size={22} color="#00a3c8" /> },
  { title: 'Pharmacy', icon: <Pill size={22} color="#00a3c8" /> },
  { title: 'Endoscopy', icon: <Microscope size={22} color="#00a3c8" /> },
  { title: 'Radiology', icon: <Radio size={22} color="#00a3c8" /> },
  { title: 'ICU / CCU', icon: <HeartPulse size={22} color="#00a3c8" /> },
  { title: 'Ambulance', icon: <Truck size={22} color="#00a3c8" /> },
  { title: 'Labour Room', icon: <Baby size={22} color="#00a3c8" /> },
  { title: 'Medical Records', icon: <ClipboardList size={22} color="#00a3c8" /> },
  { title: 'Maintenance', icon: <Wrench size={22} color="#00a3c8" /> },
  { title: 'Housekeeping', icon: <Sparkles size={22} color="#00a3c8" /> },
  { title: 'Electrocardiogram (ECG)', icon: <Zap size={22} color="#00a3c8" /> },
  { title: 'X-Ray', icon: <FileText size={22} color="#00a3c8" /> },
  { title: 'Ultra Sound', icon: <Volume2 size={22} color="#00a3c8" /> },
  { title: 'Operation Theatre', icon: <Scissors size={22} color="#00a3c8" /> },
  { title: 'Central Sterile Supply Dept.', icon: <ShieldCheck size={22} color="#00a3c8" /> }
];

const DEFAULT_FACILITIES = [
  { id: 1, icon: 'Pill', title: 'Pharmacy', description: 'Round-the-clock pharmacy with all essential medicines.' },
  { id: 2, icon: 'TestTube', title: 'Laboratory', description: 'Fully automated lab for accurate diagnostics and reports.' },
  { id: 3, icon: 'Truck', title: 'Ambulance', description: '24/7 emergency ambulance service for quick patient transfer.' },
  { id: 4, icon: 'Bed', title: 'ICU / Emergency', description: 'Critical care units equipped with modern life support systems.' },
  { id: 5, icon: 'Scissors', title: 'Operation Theatre', description: 'Advanced surgical suites with strict sterile protocols.' },
  { id: 6, icon: 'Radio', title: 'Radiology', description: 'Digital X-Ray, MRI, CT Scan and Ultrasound facilities.' },
  { id: 7, icon: 'ShieldCheck', title: 'Sterilization', description: 'Strict infection control and sterilization systems in place.' },
  { id: 8, icon: 'Accessibility', title: 'Physiotherapy', description: 'Post-surgery and injury recovery under expert supervision.' }
];

const DEFAULT_INFRASTRUCTURE = [
  { id: 1, icon: '🏨', title: 'Nurses Hostel', description: 'Safe and hygienic accommodation for nursing staff.' },
  { id: 2, icon: '🍽️', title: 'Canteen', description: 'Nutritious meals for patients, staff, and visitors.' },
  { id: 3, icon: '🧹', title: 'Housekeeping', description: '24/7 cleanliness and sanitization across all areas.' },
  { id: 4, icon: '🔧', title: 'Maintenance', description: 'Regular upkeep of hospital equipment and infrastructure.' },
  { id: 5, icon: '🛡️', title: 'Security', description: 'Trained security staff with full CCTV coverage.' },
  { id: 6, icon: '♻️', title: 'Waste Management', description: 'Efficient disposal of biomedical and general waste.' },
  { id: 7, icon: '🚗', title: 'Parking', description: 'Dedicated parking areas for patients and staff.' },
  { id: 8, icon: '☎️', title: 'Help Desk', description: 'Assistance for patient registration and information.' }
];

const Services = () => {
  const [departments, setDepartments] = useState([]);
  const [outsourcedServices, setOutsourcedServices] = useState([]);
  const [facilityServices, setFacilityServices] = useState([]);
  const [infrastructureServices, setInfrastructureServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Departments
      try {
        const deptRes = await getDepartments();
        if (deptRes && deptRes.success && Array.isArray(deptRes.data) && deptRes.data.length > 0) {
          setDepartments(deptRes.data);
        } else {
          setDepartments(DEFAULT_DEPARTMENTS);
        }
      } catch (e) {
        setDepartments(DEFAULT_DEPARTMENTS);
      }

      // 2. Outsourced Services
      try {
        const outRes = await getOutsourcedServices();
        if (outRes && outRes.success && Array.isArray(outRes.data) && outRes.data.length > 0) {
          setOutsourcedServices(outRes.data.filter(s => s.status !== 'inactive'));
        } else {
          setOutsourcedServices(DEFAULT_OUTSOURCED);
        }
      } catch (e) {
        setOutsourcedServices(DEFAULT_OUTSOURCED);
      }

      // 3. Facility Services
      try {
        const facRes = await getFacilityServices();
        if (facRes && facRes.success && Array.isArray(facRes.data) && facRes.data.length > 0) {
          setFacilityServices(facRes.data.filter(s => s.status !== 'inactive'));
        } else {
          setFacilityServices(DEFAULT_FACILITIES);
        }
      } catch (e) {
        setFacilityServices(DEFAULT_FACILITIES);
      }

      // 4. Infrastructure Services
      try {
        const infraRes = await getInfrastructureServices();
        if (infraRes && infraRes.success && Array.isArray(infraRes.data) && infraRes.data.length > 0) {
          setInfrastructureServices(infraRes.data.filter(s => s.status !== 'inactive'));
        } else {
          setInfrastructureServices(DEFAULT_INFRASTRUCTURE);
        }
      } catch (e) {
        setInfrastructureServices(DEFAULT_INFRASTRUCTURE);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const renderDynamicIcon = (iconName, color = "#0284c7", size = 28) => {
    if (!iconName) return <Building size={size} color={color} />;

    const str = String(iconName).trim();
    const lower = str.toLowerCase();

    // 1. Direct emoji detection (non-ASCII regex)
    if (/[^\x00-\x7F]/.test(str)) {
      return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>{str}</span>;
    }

    // 2. Keyword matching
    if (lower.includes('hostel') || lower.includes('nurses')) return <span style={{ fontSize: `${size}px` }}>🏨</span>;
    if (lower.includes('canteen') || lower.includes('food')) return <span style={{ fontSize: `${size}px` }}>🍽️</span>;
    if (lower.includes('housekeep') || lower.includes('clean')) return <span style={{ fontSize: `${size}px` }}>🧹</span>;
    if (lower.includes('mainten') || lower.includes('wrench')) return <span style={{ fontSize: `${size}px` }}>🔧</span>;
    if (lower.includes('security') || lower.includes('cctv')) return <span style={{ fontSize: `${size}px` }}>🛡️</span>;
    if (lower.includes('waste') || lower.includes('recycle')) return <span style={{ fontSize: `${size}px` }}>♻️</span>;
    if (lower.includes('park') || lower.includes('car')) return <span style={{ fontSize: `${size}px` }}>🚗</span>;
    if (lower.includes('help') || lower.includes('desk') || lower.includes('phone')) return <span style={{ fontSize: `${size}px` }}>☎️</span>;

    if (lower.includes('heart') || lower.includes('cardio')) return <Heart size={size} color={color} />;
    if (lower.includes('brain') || lower.includes('neuro')) return <Activity size={size} color={color} />;
    if (lower.includes('bone') || lower.includes('ortho')) return <Bone size={size} color={color} />;
    if (lower.includes('ear') || lower.includes('ent')) return <Ear size={size} color={color} />;
    if (lower.includes('drop') || lower.includes('blood')) return <Droplet size={size} color={color} />;
    if (lower.includes('shirt') || lower.includes('laundry')) return <Sparkles size={size} color={color} />;
    if (lower.includes('pill') || lower.includes('pharmacy')) return <Pill size={size} color={color} />;
    if (lower.includes('tube') || lower.includes('lab')) return <TestTube size={size} color={color} />;
    if (lower.includes('truck') || lower.includes('ambul')) return <Truck size={size} color={color} />;
    if (lower.includes('bed') || lower.includes('icu') || lower.includes('emerg')) return <Bed size={size} color={color} />;
    if (lower.includes('scissor') || lower.includes('operat') || lower.includes('theat')) return <Scissors size={size} color={color} />;
    if (lower.includes('radio') || lower.includes('scan') || lower.includes('mri') || lower.includes('x-ray')) return <Radio size={size} color={color} />;
    if (lower.includes('shield') || lower.includes('steril')) return <ShieldCheck size={size} color={color} />;

    return <Building size={size} color={color} />;
  };

  const accentColors = ['#00a3c8', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0284c7', '#d97706'];

  return (
    <main style={{ backgroundColor: '#f8fafc' }}>
      {/* 1. SERVICES HERO BANNER (100% UNTOUCHED) */}
      <section className="servicesfirstdiv" style={{ backgroundImage: `url(${serviBanner})` }}>
        <h1>Services</h1>
        <h2><Link to="/" style={{ color: '#007cb9', marginRight: '10px', textDecoration: 'none' }}>Home</Link> / Services</h2>
      </section>

      {/* 2. MULTISPECIALITY OVERVIEW (100% UNTOUCHED) */}
      <section className="child-care-section">
        <div className="text-content">
          <h2>Comprehensive Multispeciality Services</h2>
          <h4>Ensuring Health & Wellbeing for Every Patient</h4>
          <p>
            At G.J.S Multispeciality Hospital, we provide advanced medical care and compassionate support tailored to every patient's needs. Our team of certified doctors and healthcare professionals uses cutting-edge technology to ensure your safety, comfort, and speedy recovery.
          </p>
          <p>
            Whether it's routine health checkups, surgical procedures, or specialized treatments, our hospital is fully equipped to handle every aspect of your health with excellence and professionalism.
          </p>
        </div>
        <div className="image-content">
          <img 
            src="https://st2.depositphotos.com/9037414/46332/i/450/depositphotos_463322060-stock-photo-photo-medical-advanced-linear-accelerator.jpg" 
            alt="Advanced Medical Accelerator" 
          />
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* MAIN CONTAINER FOR SERVICES SECTIONS */}
      {/* ---------------------------------------------------- */}
      <div style={{ maxWidth: '1280px', margin: '40px auto 80px', padding: '0 20px' }}>

        {/* SECTION 1: HEADER (CENTERED) */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#00a3c8', 
            fontSize: '13px', 
            fontWeight: '800', 
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            <span style={{ width: '20px', height: '2px', background: '#00a3c8', display: 'inline-block' }}></span>
            <span>OUR SPECIALTIES</span>
            <span style={{ width: '20px', height: '2px', background: '#00a3c8', display: 'inline-block' }}></span>
          </div>

          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: '800', 
            color: '#0f2b48', 
            margin: '0 0 14px 0', 
            lineHeight: '1.2' 
          }}>
            World-Class Medical Care Across Specialties
          </h2>

          <p style={{ 
            fontSize: '16px', 
            color: '#64748b', 
            maxWidth: '680px', 
            margin: '0 auto', 
            lineHeight: '1.6', 
            fontWeight: '400' 
          }}>
            We bring together advanced technology, experienced specialists, and compassionate care to deliver the best outcomes.
          </p>
        </div>

        {/* SECTION 2: MEDICAL SPECIALTY CARDS (5 PER ROW DESKTOP) */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RefreshCw size={36} color="#00a3c8" className="spin" style={{ marginBottom: '12px' }} />
            <p style={{ color: '#64748b', fontWeight: '600' }}>Loading medical specialties from hospital API...</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '20px', 
            marginBottom: '60px' 
          }}>
            {departments.map((dept, idx) => {
              const accent = dept.accent_color || accentColors[idx % accentColors.length];
              const docCount = dept.doctor_count || dept.doctors_count || '7+';

              return (
                <div 
                  key={dept.id || idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    padding: '24px 20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    border: '1px solid #e2e8f0',
                    borderTop: `4px solid ${accent}`,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease'
                  }}
                  className="hover-card-lift"
                >
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.07, pointerEvents: 'none' }}>
                    {renderDynamicIcon(dept.name, accent, 110)}
                  </div>

                  <div>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      background: `${accent}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px'
                    }}>
                      {renderDynamicIcon(dept.name, accent, 26)}
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: '0 0 10px 0' }}>
                      {dept.name}
                    </h3>

                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: '0 0 16px 0', minHeight: '60px' }}>
                      {dept.short_description || dept.tagline || `Comprehensive medical care with advanced diagnostics and treatment.`}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: accent, marginBottom: '20px' }}>
                      <Users size={16} />
                      <span>{docCount} Doctors</span>
                    </div>
                  </div>

                  <Link 
                    to={`/departments/${dept.slug || dept.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px 0',
                      borderRadius: '12px',
                      border: `1.5px solid ${accent}`,
                      color: accent,
                      fontWeight: '700',
                      fontSize: '13px',
                      textDecoration: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>Learn More</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 3: OUTSOURCED SERVICES (HORIZONTAL CARDS) */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f2b48', margin: '0 0 6px 0' }}>
              Outsourced Services
            </h3>
            <span style={{ width: '40px', height: '3px', background: '#00a3c8', display: 'block', borderRadius: '2px' }}></span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {outsourcedServices.map((svc, idx) => (
              <div
                key={svc.id || idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '20px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="hover-card-lift"
              >
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#f0f9ff',
                  border: '1px solid #e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {renderDynamicIcon(svc.icon || svc.title, '#00a3c8', 24)}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f2b48', margin: '0 0 4px 0' }}>
                    {svc.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                    {svc.description}
                  </p>
                </div>

                <ChevronRight size={20} color="#94a3b8" />
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: SUPPORTING SERVICES (PROFESSIONAL EXECUTIVE MEDICAL CARDS) */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#0f2b48', margin: '0 0 10px 0' }}>
              Supporting Services
            </h3>
            <span style={{ width: '60px', height: '3px', background: '#00a3c8', display: 'block', margin: '0 auto 14px', borderRadius: '2px' }}></span>
            <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
              Specialized supporting medical units providing essential patient care, advanced diagnostics, and clinical operations 24/7.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '18px'
          }}>
            {SUPPORTING_SERVICES_PROFESSIONAL.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: '0 4px 15px rgba(15, 43, 72, 0.04)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer'
                }}
                className="hover-card-lift"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    border: '1px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>

                  <span style={{
                    fontWeight: '700',
                    color: '#0f2b48',
                    fontSize: '14px',
                    lineHeight: '1.3'
                  }}>
                    {item.title}
                  </span>
                </div>

                <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: SUPPORTING FACILITY SERVICES (RICH CARDS FROM IMAGE 2) */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#0284c7', margin: '0 0 10px 0' }}>
              Supporting Facility Services
            </h3>
            <span style={{ width: '50px', height: '3px', background: '#16a34a', display: 'block', margin: '0 auto', borderRadius: '2px' }}></span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '22px' }}>
            {facilityServices.map((fac, idx) => (
              <div
                key={fac.id || idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  padding: '32px 24px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '14px',
                  transition: 'all 0.3s ease'
                }}
                className="hover-card-lift"
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '18px',
                  background: '#f0f9ff',
                  border: '1px solid #e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '6px'
                }}>
                  {renderDynamicIcon(fac.icon || fac.title, '#0284c7', 28)}
                </div>

                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: '0 0 8px 0' }}>
                    {fac.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                    {fac.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6: INFRASTRUCTURE & FACILITY SERVICES */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#0070c0', margin: '0 0 10px 0' }}>
              Infrastructure & Facility Services
            </h3>
            <span style={{ width: '60px', height: '3px', background: '#00a3c8', display: 'block', margin: '0 auto 14px', borderRadius: '2px' }}></span>
            <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
              Creating a safe, clean, and supportive hospital environment for patients, staff, and families.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {infrastructureServices.map((item, i) => (
              <div 
                key={item.id || i} 
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
                className="hover-card-lift"
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.08)'
                }}>
                  {renderDynamicIcon(item.icon || item.title, '#0284c7', 32)}
                </div>

                <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b48', margin: '0 0 10px 0' }}>
                  {item.title}
                </h4>

                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7: GJS DIAGNOSTIC CENTER */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#0f2b48', margin: '0 0 8px 0' }}>
              GJS Diagnostic Center
            </h3>
            <span style={{ width: '50px', height: '3px', background: '#00a3c8', display: 'block', margin: '0 auto', borderRadius: '2px' }}></span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px' }}>
            
            {/* BOARD 1: DIABETES & HYPERTENSION COMBO CHECK-UP */}
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
              borderLeft: '6px solid #0284c7'
            }}>
              <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#0f2b48', margin: '0 0 14px 0', lineHeight: 1.3 }}>
                Diabetes & Hypertension Combo Health Check-Up
              </h4>
              
              <div style={{ background: '#f0f9ff', color: '#0284c7', padding: '8px 16px', borderRadius: '10px', display: 'inline-block', fontWeight: '800', fontSize: '16px', marginBottom: '20px' }}>
                Rs. 2000/-
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'CBC',
                  'Sugar (F) & Sugar (PP)',
                  'T3, T4, TSH',
                  'Thyroid & Lipid Profile (F)',
                  'Urea, Creatinine, Microalbuminuria',
                  'HBA1C, ECG (All Leads)',
                  'Liver Function Test (LFT)'
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#334155', fontWeight: '600' }}>
                    <CheckCircle2 size={16} color="#0284c7" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* BOARD 2: GENERAL DIAGNOSTIC PANEL */}
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
              borderLeft: '6px solid #0284c7'
            }}>
              <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#0f2b48', margin: '0 0 20px 0' }}>
                General Diagnostic Panel
              </h4>

              <div style={{ marginBottom: '18px' }}>
                <h5 style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7', margin: '0 0 8px 0' }}>Hemogram</h5>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    <CheckCircle2 size={14} color="#0284c7" /> Haemoglobin, PCV, RBC Count
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    <CheckCircle2 size={14} color="#0284c7" /> WBC / Differential, ESR
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    <CheckCircle2 size={14} color="#0284c7" /> Platelet, MCH, MCV, MCHC
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h5 style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7', margin: 0 }}>Lipid Profile</h5>
                  <span style={{ background: '#f0f9ff', color: '#0284c7', padding: '4px 10px', borderRadius: '8px', fontWeight: '800', fontSize: '12px' }}>Rs. 2900/-</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    <CheckCircle2 size={14} color="#0284c7" /> Total, HDL, LDL, VLDL, Triglycerides
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    <CheckCircle2 size={14} color="#0284c7" /> Cholesterol/HDL Ratio
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <h5 style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7', margin: '0 0 8px 0' }}>Liver Function Test</h5>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    <CheckCircle2 size={14} color="#0284c7" /> Total Protein, Albumin, Globulin
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    <CheckCircle2 size={14} color="#0284c7" /> SGPT, SGOT, ALP, GGTP, Bilirubin
                  </li>
                </ul>
              </div>

              <div>
                <h5 style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7', margin: '0 0 8px 0' }}>Other Parameters</h5>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    <CheckCircle2 size={14} color="#0284c7" /> HBA1C, Uric Acid, Creatinine
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    <CheckCircle2 size={14} color="#0284c7" /> Blood Grouping, RH Typing
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                    <CheckCircle2 size={14} color="#0284c7" /> Pap Smear (Women), ECG, X-Ray
                  </li>
                </ul>
              </div>

            </div>

          </div>
        </div>

        {/* SECTION 8: SPECIAL HEALTH AWARENESS CAMP */}
        <div style={{ marginBottom: '60px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '36px 32px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 45px rgba(0, 75, 122, 0.1)',
            border: '2px solid #004b7a',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#004b7a', letterSpacing: '0.5px', margin: 0 }}>
              GJS MULTISPECIALITY HOSPITAL 24x7
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontSize: '13px', fontWeight: '700' }}>
              <Clock size={16} />
              <span>Time: 9AM to 1PM</span>
            </div>

            <div style={{ background: '#004b7a', color: '#fff', padding: '10px 24px', borderRadius: '25px', fontWeight: '800', fontSize: '14px', width: 'fit-content' }}>
              DIABETIC & CHOLESTEROL CAMP
            </div>

            <div style={{ fontSize: '14px', color: '#334155', fontWeight: '700', lineHeight: 1.6 }}>
              Sugar (RBS)<br />
              Lipid Profile Test Done
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
              <span style={{ textDecoration: 'line-through', color: '#00a3c8', fontSize: '18px', fontWeight: '700' }}>₹550</span>
              <span style={{ background: '#38bdf8', color: '#fff', padding: '10px 24px', borderRadius: '14px', fontSize: '22px', fontWeight: '900', boxShadow: '0 6px 20px rgba(56, 189, 248, 0.4)' }}>
                ₹100 Only
              </span>
            </div>

            <div style={{ background: '#00a3c8', color: '#fff', padding: '8px 22px', borderRadius: '20px', fontWeight: '800', fontSize: '13px' }}>
              🎉 FREE CONSULTATION
            </div>

            <p style={{ fontSize: '13px', color: '#475569', fontWeight: '600', margin: 0 }}>
              🗓️ 2nd & 4th <strong>SATURDAY</strong> of Every Month
            </p>

            <div style={{ background: '#003a60', color: '#fff', padding: '14px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', width: '100%', boxSizing: 'border-box' }}>
              Contact: <br />
              <strong style={{ fontSize: '16px', color: '#7dd3fc' }}>7200480576, 7200490574</strong>
            </div>
          </div>
        </div>

        {/* SECTION 9: EMERGENCY CTA BAR (BOTTOM FULL WIDTH) */}
        <div style={{
          background: 'linear-gradient(135deg, #004b7a 0%, #0066a2 50%, #0070c0 100%)',
          borderRadius: '24px',
          padding: '30px 36px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: '0 15px 35px rgba(0, 75, 122, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 340px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '900',
              color: '#fff',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              24/7
            </div>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#fff' }}>
                Need Medical Assistance?
              </h3>
              <p style={{ fontSize: '14px', color: '#e0f2fe', margin: 0, opacity: 0.9 }}>
                We are here for you 24/7. Book an appointment or call us.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link 
              to="/appointment"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                color: '#005f9e',
                padding: '14px 24px',
                borderRadius: '30px',
                fontWeight: '800',
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
              }}
            >
              <Calendar size={18} />
              <span>Book Appointment</span>
            </Link>

            <a 
              href="tel:+919876543210"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                color: '#ffffff',
                padding: '14px 24px',
                borderRadius: '30px',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              <Phone size={18} />
              <span>Call Emergency +91 98765 43210</span>
            </a>

            <Link 
              to="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                color: '#ffffff',
                padding: '14px 24px',
                borderRadius: '30px',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              <MapPin size={18} />
              <span>Visit Hospital</span>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
};

export default Services;
