import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Award, Clock, Heart, Shield, Activity, 
  MapPin, CheckCircle2, HeartHandshake, Stethoscope, 
  ArrowRight, Phone, Calendar, HeartPulse, ChevronLeft, ChevronRight 
} from 'lucide-react';
import maleImg from '../assets/male-rnicTsFa.webp';

const GALLERY_IMAGES = [
  { url: '/SINGLE ROOM.jpg.jpeg', title: 'Single Room' },
  { url: '/OT.jpg.jpeg', title: 'Operation Theatre' },
  { url: '/Hospital Photo\'s_page-0003(1).jpg.jpeg', title: 'Double Sharing Room' },
  { url: '/LAB.jpg.jpeg', title: 'Laboratory' },
  { url: '/PHARMACY - Copy.jpeg', title: 'Pharmacy' },
  { url: '/gjs frontend elivation.png', title: 'Hospital Exterior' }
];

const About = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % GALLERY_IMAGES.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
  };

  return (
    <main style={{ backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: "'Outfit', 'Poppins', sans-serif" }}>
      {/* 1. HERO BANNER */}
      <section className="about-hero-section">
        <style>{`
          .about-hero-section {
            position: relative;
            background: linear-gradient(rgba(26, 58, 110, 0.85), rgba(26, 58, 110, 0.75)), url('/gjs frontend elivation.png');
            background-size: cover;
            background-position: center 30%;
            background-repeat: no-repeat;
            padding: 100px 20px 140px;
            text-align: left;
            color: #ffffff;
            overflow: hidden;
            display: flex;
            justify-content: center;
          }
          .about-hero-container {
            max-width: 1200px;
            width: 100%;
            z-index: 2;
          }
          .about-badge {
            display: inline-block;
            background: rgba(0, 163, 200, 0.2);
            border: 1px solid rgba(0, 163, 200, 0.3);
            color: #00d2ff;
            padding: 6px 16px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 20px;
            backdrop-filter: blur(4px);
          }
          .about-hero-title {
            font-size: 48px;
            font-weight: 900;
            line-height: 1.15;
            margin-bottom: 15px;
            max-width: 650px;
          }
          .about-hero-title span {
            background: linear-gradient(120deg, #00d2ff 0%, #00a3c8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .about-hero-desc {
            font-size: 17px;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.6;
            margin-bottom: 40px;
            max-width: 580px;
          }
          .hero-floating-badges {
            display: flex;
            gap: 25px;
            flex-wrap: wrap;
          }
          .floating-badge-item {
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 10px 20px;
            border-radius: 50px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            font-size: 14px;
            font-weight: 700;
          }
          .floating-badge-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #00a3c8;
            color: #ffffff;
          }
          @media (max-width: 768px) {
            .about-hero-title { font-size: 36px; }
            .about-hero-desc { font-size: 15px; }
            .about-hero-section { padding: 80px 20px 100px; }
          }
        `}</style>
        <div className="about-hero-container">
          <span className="about-badge">ABOUT G.J.S HOSPITAL</span>
          <h1 className="about-hero-title">Compassionate Healthcare with <br /><span>Modern Technology</span></h1>
          <p className="about-hero-desc">
            Delivering exceptional healthcare with compassion, advanced technology, and a patient-first approach.
          </p>
          <div className="hero-floating-badges">
            <div className="floating-badge-item">
              <div className="floating-badge-icon"><Award size={14} /></div>
              <span>Trusted Care Since 2016</span>
            </div>
            <div className="floating-badge-item">
              <div className="floating-badge-icon"><Users size={14} /></div>
              <span>Thousands of Happy Patients</span>
            </div>
            <div className="floating-badge-item">
              <div className="floating-badge-icon"><Clock size={14} /></div>
              <span>24/7 Emergency Services</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WELCOME / DETAIL SECTION */}
      <section className="about-welcome-section">
        <style>{`
          .about-welcome-section {
            padding: 90px 20px;
            display: flex;
            justify-content: center;
          }
          .welcome-grid {
            display: grid;
            grid-template-columns: 1fr 1.1fr;
            gap: 50px;
            max-width: 1200px;
            width: 100%;
            align-items: center;
          }
          .welcome-image-wrapper {
            position: relative;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
            border: 6px solid #ffffff;
            height: 380px;
          }
          .welcome-image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .welcome-content {
            text-align: left;
          }
          .welcome-label {
            font-size: 13px;
            font-weight: 800;
            color: #0070c0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .welcome-title {
            font-size: 34px;
            font-weight: 800;
            color: #1a3a6e;
            margin: 6px 0 20px;
          }
          .welcome-text {
            font-size: 15px;
            color: #475569;
            line-height: 1.7;
            margin-bottom: 30px;
          }
          .mission-vision-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .m-v-card {
            background: #f0f7ff;
            border-radius: 16px;
            padding: 24px;
            border: 1px solid #e0f0ff;
            text-align: left;
          }
          .m-v-icon-container {
            width: 44px;
            height: 44px;
            background: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0, 112, 192, 0.08);
            margin-bottom: 16px;
            color: #0070c0;
          }
          .m-v-card h4 {
            font-size: 16px;
            font-weight: 800;
            color: #1a3a6e;
            margin: 0 0 8px 0;
          }
          .m-v-card p {
            font-size: 13px;
            color: #64748b;
            line-height: 1.5;
            margin: 0;
          }
          @media (max-width: 991px) {
            .welcome-grid { grid-template-columns: 1fr; gap: 40px; }
            .welcome-image-wrapper { height: 320px; }
          }
          @media (max-width: 576px) {
            .mission-vision-grid { grid-template-columns: 1fr; }
          }
        `}</style>
        <div className="welcome-grid">
          <div className="welcome-image-wrapper">
            <img src="/reception.jpg" alt="GJS Hospital Reception" />
          </div>
          <div className="welcome-content">
            <span className="welcome-label">WELCOME TO G.J.S HOSPITAL</span>
            <h2 className="welcome-title">About G.J.S Multispeciality Hospital</h2>
            <p className="welcome-text">
              G.J.S Hospital is committed to providing world-class healthcare services with a focus on patient safety, innovation, and excellence. Our team of experienced doctors and medical professionals work round-the-clock to ensure the best possible care for you and your family.
            </p>
            <div className="mission-vision-grid">
              <div className="m-v-card">
                <div className="m-v-icon-container"><HeartHandshake size={20} /></div>
                <h4>Our Mission</h4>
                <p>To deliver quality, affordable, and accessible healthcare using advanced technology with compassion and integrity.</p>
              </div>
              <div className="m-v-card">
                <div className="m-v-icon-container"><Shield size={20} /></div>
                <h4>Our Vision</h4>
                <p>To be recognized as the most trusted multispeciality hospital in the region, setting benchmarks in clinical excellence.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE US */}
      <section className="why-choose-section">
        <style>{`
          .why-choose-section {
            background-color: #ffffff;
            padding: 85px 20px;
            text-align: center;
            display: flex;
            justify-content: center;
          }
          .why-choose-container {
            max-width: 1200px;
            width: 100%;
          }
          .why-choose-header {
            font-size: 13px;
            font-weight: 800;
            color: #0070c0;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .why-choose-title {
            font-size: 32px;
            font-weight: 800;
            color: #1a3a6e;
            margin: 0 auto 50px;
            max-width: 500px;
            position: relative;
            padding-bottom: 12px;
          }
          .why-choose-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: #0070c0;
            border-radius: 2px;
          }
          .why-choose-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 20px;
          }
          .why-card {
            background: #ffffff;
            border: 1px solid #f1f5f9;
            border-radius: 20px;
            padding: 30px 15px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .why-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 35px rgba(26, 58, 110, 0.08);
            border-color: #e2e8f0;
          }
          .why-icon-container {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: #f0f9ff;
            color: #0070c0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            transition: all 0.3s ease;
          }
          .why-card:hover .why-icon-container {
            background: #0070c0;
            color: #ffffff;
            transform: scale(1.05);
          }
          .why-card h4 {
            font-size: 15px;
            font-weight: 800;
            color: #1a3a6e;
            margin: 0 0 10px 0;
          }
          .why-card p {
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
            margin: 0;
          }
          @media (max-width: 1200px) {
            .why-choose-grid { grid-template-columns: repeat(3, 1fr); }
          }
          @media (max-width: 768px) {
            .why-choose-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 480px) {
            .why-choose-grid { grid-template-columns: 1fr; }
          }
        `}</style>
        <div className="why-choose-container">
          <span className="why-choose-header">WHY CHOOSE G.J.S HOSPITAL?</span>
          <h2 className="why-choose-title">Our Distinctive Advantages</h2>
          <div className="why-choose-grid">
            <div className="why-card">
              <div className="why-icon-container"><HeartPulse size={22} /></div>
              <h4>24/7 Emergency</h4>
              <p>Round-the-clock emergency services always ready to help.</p>
            </div>
            <div className="why-card">
              <div className="why-icon-container"><Users size={22} /></div>
              <h4>Experienced Doctors</h4>
              <p>Team of highly qualified and experienced medical professionals.</p>
            </div>
            <div className="why-card">
              <div className="why-icon-container"><Activity size={22} /></div>
              <h4>Advanced Laboratory</h4>
              <p>Accurate and quick diagnostics with the latest technology.</p>
            </div>
            <div className="why-card">
              <div className="why-icon-container"><Stethoscope size={22} /></div>
              <h4>Modern OT</h4>
              <p>State-of-the-art operation theatres with advanced setup.</p>
            </div>
            <div className="why-card">
              <div className="why-icon-container"><Shield size={22} /></div>
              <h4>Pharmacy</h4>
              <p>In-house pharmacy with all essential medicines available.</p>
            </div>
            <div className="why-card">
              <div className="why-icon-container"><Clock size={22} /></div>
              <h4>Comfortable Rooms</h4>
              <p>Clean, hygienic and well-equipped rooms for fast recovery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OUR FACILITIES */}
      <section className="about-facilities-section">
        <style>{`
          .about-facilities-section {
            padding: 90px 20px;
            background-color: #f8fafc;
            text-align: center;
            display: flex;
            justify-content: center;
          }
          .about-facilities-container {
            max-width: 1200px;
            width: 100%;
          }
          .facilities-label {
            font-size: 13px;
            font-weight: 800;
            color: #0070c0;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 8px;
            display: block;
          }
          .facilities-title {
            font-size: 32px;
            font-weight: 800;
            color: #1a3a6e;
            margin: 0 auto 50px;
            max-width: 500px;
            position: relative;
            padding-bottom: 12px;
          }
          .facilities-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: #0070c0;
            border-radius: 2px;
          }
          .facilities-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 25px;
          }
          .facility-img-card {
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(26, 58, 110, 0.05);
            height: 240px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            background: #f1f5f9;
          }
          .facility-img-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
          }
          .facility-overlay-label {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(to top, rgba(26, 58, 110, 0.95) 0%, rgba(26, 58, 110, 0.4) 100%);
            padding: 20px 24px;
            text-align: left;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #ffffff;
            transition: background 0.3s ease;
          }
          .facility-img-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0, 112, 192, 0.12);
          }
          .facility-img-card:hover img {
            transform: scale(1.06);
          }
          .facility-label-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(4px);
            color: #ffffff;
          }
          .facility-overlay-label h4 {
            font-size: 16px;
            font-weight: 700;
            margin: 0;
          }
          @media (max-width: 991px) {
            .facilities-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 576px) {
            .facilities-grid { grid-template-columns: 1fr; }
          }
        `}</style>
        <div className="about-facilities-container">
          <span className="facilities-label">OUR FACILITIES</span>
          <h2 className="facilities-title">State-of-the-Art Operations</h2>
          <div className="facilities-grid">
            <div className="facility-img-card">
              <img src="/SINGLE ROOM.jpg.jpeg" alt="Single Room" />
              <div className="facility-overlay-label">
                <div className="facility-label-icon"><Clock size={14} /></div>
                <h4>Single Room</h4>
              </div>
            </div>
            <div className="facility-img-card">
              <img src="/Hospital Photo's_page-0003(1).jpg.jpeg" alt="Double Sharing Room" />
              <div className="facility-overlay-label">
                <div className="facility-label-icon"><Clock size={14} /></div>
                <h4>Double Sharing Room</h4>
              </div>
            </div>
            <div className="facility-img-card">
              <img src="/OT.jpg.jpeg" alt="Operation Theatre" />
              <div className="facility-overlay-label">
                <div className="facility-label-icon"><Clock size={14} /></div>
                <h4>Operation Theatre</h4>
              </div>
            </div>
            <div className="facility-img-card">
              <img src="/LAB.jpg.jpeg" alt="Laboratory" />
              <div className="facility-overlay-label">
                <div className="facility-label-icon"><Clock size={14} /></div>
                <h4>Laboratory</h4>
              </div>
            </div>
            <div className="facility-img-card">
              <img src="/PHARMACY - Copy.jpeg" alt="Pharmacy" />
              <div className="facility-overlay-label">
                <div className="facility-label-icon"><Clock size={14} /></div>
                <h4>Pharmacy</h4>
              </div>
            </div>
            <div className="facility-img-card">
              <img src="/M.D ROOM.jpeg" alt="Doctor's Room" />
              <div className="facility-overlay-label">
                <div className="facility-label-icon"><Clock size={14} /></div>
                <h4>Doctor's Room</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COUNTER RIBBON STRIP */}
      <section className="about-counter-section">
        <style>{`
          .about-counter-section {
            background: linear-gradient(135deg, #1a3a6e 0%, #0070c0 100%);
            padding: 50px 20px;
            color: #ffffff;
            display: flex;
            justify-content: center;
          }
          .counter-container {
            max-width: 1200px;
            width: 100%;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            text-align: center;
            align-items: center;
            gap: 20px;
          }
          .counter-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            border-right: 1px solid rgba(255, 255, 255, 0.15);
          }
          .counter-box:last-child {
            border-right: none;
          }
          .counter-icon-circle {
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
            color: #00d2ff;
          }
          .counter-num {
            font-size: 32px;
            font-weight: 900;
            line-height: 1.1;
            margin: 0 0 4px 0;
            color: #ffffff;
          }
          .counter-label {
            font-size: 13px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.85);
            margin: 0;
          }
          @media (max-width: 991px) {
            .counter-container { grid-template-columns: repeat(2, 1fr); gap: 40px; }
            .counter-box { border-right: none; }
          }
          @media (max-width: 576px) {
            .counter-container { grid-template-columns: 1fr; gap: 30px; }
          }
        `}</style>
        <div className="counter-container">
          <div className="counter-box">
            <div className="counter-icon-circle"><Users size={20} /></div>
            <h2 className="counter-num">5000+</h2>
            <p className="counter-label">Happy Patients</p>
          </div>
          <div className="counter-box">
            <div className="counter-icon-circle"><Stethoscope size={20} /></div>
            <h2 className="counter-num">15+</h2>
            <p className="counter-label">Expert Doctors</p>
          </div>
          <div className="counter-box">
            <div className="counter-icon-circle"><Clock size={20} /></div>
            <h2 className="counter-num">24/7</h2>
            <p className="counter-label">Emergency Care</p>
          </div>
          <div className="counter-box">
            <div className="counter-icon-circle"><Heart size={20} /></div>
            <h2 className="counter-num">98%</h2>
            <p className="counter-label">Patient Satisfaction</p>
          </div>
        </div>
      </section>

      {/* 6. ACCESSIBILITY SECTION */}
      <section className="about-accessibility-section">
        <style>{`
          .about-accessibility-section {
            padding: 95px 20px;
            background-color: #ffffff;
            display: flex;
            justify-content: center;
          }
          .accessibility-grid {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 60px;
            max-width: 1200px;
            width: 100%;
            align-items: center;
          }
          .accessibility-left {
            text-align: left;
          }
          .accessibility-icon-box {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #e0f2fe;
            color: #0070c0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 25px;
            font-size: 24px;
            border: 1px solid #bae6fd;
          }
          .accessibility-title {
            font-size: 34px;
            font-weight: 800;
            color: #1a3a6e;
            margin: 0 0 16px;
          }
          .accessibility-desc {
            font-size: 15px;
            color: #475569;
            line-height: 1.7;
            margin: 0 0 35px;
          }
          .accessibility-btn {
            background: #0070c0;
            color: #ffffff;
            padding: 14px 32px;
            border-radius: 30px;
            font-weight: 700;
            text-decoration: none;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.25s ease;
            box-shadow: 0 4px 15px rgba(0, 112, 192, 0.25);
          }
          .accessibility-btn:hover {
            background: #005694;
            transform: translateY(-2px);
          }
          .accessibility-right-img {
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
            border: 6px solid #ffffff;
            height: 340px;
          }
          .accessibility-right-img img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          @media (max-width: 991px) {
            .accessibility-grid { grid-template-columns: 1fr; gap: 40px; }
            .accessibility-right-img { height: 280px; }
          }
        `}</style>
        <div className="accessibility-grid">
          <div className="accessibility-left">
            <div className="accessibility-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="4" r="1"/>
                <path d="m18 19-2-4-1.5-2H11v-4h2.5L16 11"/>
                <path d="M8.5 13H11v4l-3 4"/>
                <path d="M12 11.5a5 5 0 1 1-5-5"/>
              </svg>
            </div>
            <h2 className="accessibility-title">Accessible Healthcare for Everyone</h2>
            <p className="accessibility-desc">
              Our hospital is designed to be accessible for all. Wheelchair-friendly ramps, spacious corridors, and dedicated support staff ensure a comfortable and hassle-free experience for physically challenged patients and senior citizens.
            </p>
            <Link to="/contact" className="accessibility-btn" onClick={() => window.scrollTo(0, 0)}>
              Learn More <ArrowRight size={16} />
            </Link>
          </div>
          <div className="accessibility-right-img">
            <img src="/gjs frontend elivation.png" alt="GJS Hospital Accessible Ramp" />
          </div>
        </div>
      </section>

      {/* 7. GALLERY SECTION */}
      <section className="about-gallery-section">
        <style>{`
          .about-gallery-section {
            padding: 95px 20px;
            background-color: #f8fafc;
            text-align: center;
            display: flex;
            justify-content: center;
            overflow: hidden;
          }
          .gallery-wrapper {
            max-width: 1200px;
            width: 100%;
          }
          .gallery-label {
            font-size: 13px;
            font-weight: 800;
            color: #0070c0;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 8px;
            display: block;
          }
          .gallery-title {
            font-size: 32px;
            font-weight: 800;
            color: #1a3a6e;
            margin: 0 auto 45px;
            max-width: 500px;
            position: relative;
            padding-bottom: 12px;
          }
          .gallery-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: #0070c0;
            border-radius: 2px;
          }
          .slider-box {
            position: relative;
            max-width: 860px;
            margin: 0 auto;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 45px rgba(26, 58, 110, 0.08);
            border: 6px solid #ffffff;
            height: 480px;
            background: #ffffff;
          }
          .slide-img-container {
            width: 100%;
            height: 100%;
            position: relative;
          }
          .slide-img-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .slide-overlay-title {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
            padding: 30px 40px;
            text-align: left;
            box-sizing: border-box;
          }
          .slide-overlay-title h4 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin: 0;
          }
          .slider-nav-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #ffffff;
            color: #1a3a6e;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            z-index: 10;
            transition: all 0.2s ease;
          }
          .slider-nav-btn:hover {
            background: #0070c0;
            color: #ffffff;
          }
          .slider-prev-btn { left: 20px; }
          .slider-next-btn { right: 20px; }
          
          .slider-dots {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 25px;
          }
          .slider-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #cbd5e1;
            border: none;
            padding: 0;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .slider-dot.active {
            background: #0070c0;
            width: 28px;
            border-radius: 5px;
          }
          @media (max-width: 768px) {
            .slider-box { height: 320px; }
            .slide-overlay-title { padding: 20px; }
            .slide-overlay-title h4 { font-size: 17px; }
            .slider-nav-btn { width: 36px; height: 36px; }
          }
        `}</style>
        <div className="gallery-wrapper">
          <span className="gallery-label">HOSPITAL GALLERY</span>
          <h2 className="gallery-title">A Visual Tour of Our Facility</h2>
          <div className="slider-box">
            <button className="slider-nav-btn slider-prev-btn" onClick={handlePrevSlide} aria-label="Previous image">
              <ChevronLeft size={24} />
            </button>
            <button className="slider-nav-btn slider-next-btn" onClick={handleNextSlide} aria-label="Next image">
              <ChevronRight size={24} />
            </button>

            <div className="slide-img-container">
              <img 
                src={GALLERY_IMAGES[activeSlide].url} 
                alt={GALLERY_IMAGES[activeSlide].title} 
              />
              <div className="slide-overlay-title">
                <h4>{GALLERY_IMAGES[activeSlide].title}</h4>
              </div>
            </div>
          </div>

          <div className="slider-dots">
            {GALLERY_IMAGES.map((_, idx) => (
              <button 
                key={idx} 
                className={`slider-dot ${idx === activeSlide ? 'active' : ''}`}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION SECTION */}
      <section className="about-cta-section">
        <style>{`
          .about-cta-section {
            background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%);
            padding: 80px 20px;
            display: flex;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }
          .about-cta-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(circle at 20% 30%, rgba(0, 163, 200, 0.15) 0%, transparent 50%);
            z-index: 1;
          }
          .cta-container {
            max-width: 1200px;
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: center;
            z-index: 2;
            gap: 40px;
          }
          .cta-doctor-preview {
            display: flex;
            justify-content: center;
            position: relative;
          }
          .cta-doctor-preview img {
            max-height: 380px;
            width: auto;
            object-fit: contain;
            filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.3));
          }
          .cta-content-box {
            text-align: left;
            color: #ffffff;
          }
          .cta-content-box span {
            font-size: 13px;
            font-weight: 800;
            color: #00d2ff;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            display: block;
            margin-bottom: 8px;
          }
          .cta-content-box h2 {
            font-size: 38px;
            font-weight: 900;
            margin: 0 0 12px 0;
            line-height: 1.15;
          }
          .cta-content-box p {
            font-size: 15px;
            color: rgba(255, 255, 255, 0.85);
            line-height: 1.6;
            margin: 0 0 35px 0;
          }
          .cta-btn-group {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
          }
          .cta-btn-primary {
            background: #ffffff;
            color: #1a3a6e;
            padding: 13px 30px;
            border-radius: 30px;
            font-weight: 700;
            text-decoration: none;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(255, 255, 255, 0.15);
          }
          .cta-btn-primary:hover {
            background: #eef2f6;
            transform: translateY(-2px);
          }
          .cta-btn-secondary {
            background: transparent;
            color: #ffffff;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 11px 28px;
            border-radius: 30px;
            font-weight: 700;
            text-decoration: none;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
          }
          .cta-btn-secondary:hover {
            border-color: #ffffff;
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
          }
          @media (max-width: 768px) {
            .cta-container { grid-template-columns: 1fr; text-align: center; }
            .cta-content-box { text-align: center; }
            .cta-btn-group { justify-content: center; }
            .cta-doctor-preview { display: none; }
          }
        `}</style>
        <div className="cta-container">
          <div className="cta-doctor-preview">
            <img src={maleImg} alt="Consultant Specialist" />
          </div>
          <div className="cta-content-box">
            <span>Need Medical Assistance?</span>
            <h2>Book an Appointment Today</h2>
            <p>Our expert medical specialists are here to care for you and your family. Reach out to schedule a consultation with our experienced physicians.</p>
            <div className="cta-btn-group">
              <Link to="/appointment" className="cta-btn-primary" onClick={() => window.scrollTo(0, 0)}>
                <Calendar size={14} /> Book Appointment
              </Link>
              <Link to="/contact" className="cta-btn-secondary" onClick={() => window.scrollTo(0, 0)}>
                <Phone size={14} /> Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
