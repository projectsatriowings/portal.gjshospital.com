import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, Clock, Mail, MapPin, Building2, Stethoscope, Users, HeartPulse,
  Heart, Brain, Baby, Activity, Pill, Sparkles, Ear, Bone,
  Accessibility, Hospital, FlaskConical, Wind, FileText, Trash2,
  Droplet, Scan, ShieldAlert, Radio, Shirt, Truck, Check, ArrowRight
} from 'lucide-react';
import homeback from '../assets/homeback-D0_2p1Ec.jpg';
import home2 from '../assets/home2-CFIjmh-I.jpg';
import hospitalGif from '../assets/hospital2-BqdDMbQU.gif';
import gjsHospitalFacade from '../assets/gjs_hospital_facade.png';
import clinicalBanner from '../assets/clinical_banner.jpg';
import supportingBanner from '../assets/supporting_banner.jpg';
import diagnosticBanner from '../assets/diagnostic_banner.jpg';
import maleImg from '../assets/male-rnicTsFa.webp';
import femaleImg from '../assets/female2-BB8VFyZ1.jpg';

const Home = () => {
  const whyChooseRef = React.useRef(null);
  const [whyChooseVisible, setWhyChooseVisible] = React.useState(false);

  const servicesSectionRef = React.useRef(null);
  const [servicesSectionVisible, setServicesSectionVisible] = React.useState(false);

  const doctorSectionRef = React.useRef(null);
  const [doctorSectionVisible, setDoctorSectionVisible] = React.useState(false);

  React.useEffect(() => {
    const observerChoose = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWhyChooseVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (whyChooseRef.current) {
      observerChoose.observe(whyChooseRef.current);
    }

    const observerServices = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setServicesSectionVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (servicesSectionRef.current) {
      observerServices.observe(servicesSectionRef.current);
    }

    const observerDoctors = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDoctorSectionVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (doctorSectionRef.current) {
      observerDoctors.observe(doctorSectionRef.current);
    }

    return () => {
      if (whyChooseRef.current) {
        observerChoose.unobserve(whyChooseRef.current);
      }
      if (servicesSectionRef.current) {
        observerServices.unobserve(servicesSectionRef.current);
      }
      if (doctorSectionRef.current) {
        observerDoctors.unobserve(doctorSectionRef.current);
      }
    };
  }, []);

  return (
    <main>
      {/* INJECT DYNAMIC WHY CHOOSE CARD STYLES */}
      <style>{`
        .choose-card-animate {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .choose-card-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .choose-card-delay-0 { transition-delay: 0s; }
        .choose-card-delay-1 { transition-delay: 0.1s; }
        .choose-card-delay-2 { transition-delay: 0.2s; }
        .choose-card-delay-3 { transition-delay: 0.3s; }

        .why-choose-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          padding: 32px 28px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          position: relative;
          overflow: hidden;
          min-height: 280px;
        }
        .why-choose-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          transition: transform 0.35s ease;
          transform: scaleX(0);
          transform-origin: left;
        }
        .why-choose-card.accent-navy::before {
          background: #1a3a6e;
        }
        .why-choose-card.accent-teal::before {
          background: #00a3c8;
        }
        .why-choose-card:hover::before {
          transform: scaleX(1);
        }
        .why-choose-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(26, 58, 110, 0.12);
          border-color: #cbd5e1;
        }
        .why-choose-card:hover .choose-icon-circle {
          transform: scale(1.15) rotate(8deg);
          box-shadow: 0 6px 15px rgba(0, 163, 200, 0.15);
        }
        .choose-icon-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .why-choose-card h3 {
          font-size: 16.5px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 10px 0;
          line-height: 1.3;
        }
        .why-choose-card p {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.6;
          margin: 0 0 24px 0;
          flex-grow: 1;
        }
        .why-choose-card button {
          background: transparent;
          border-width: 2px;
          border-style: solid;
          padding: 8px 24px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.25s ease;
          outline: none;
          text-transform: uppercase;
        }
        .why-choose-card.accent-navy button {
          color: #1a3a6e;
          border-color: #1a3a6e;
        }
        .why-choose-card.accent-navy button:hover {
          background: #1a3a6e;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(26, 58, 110, 0.2);
        }
        .why-choose-card.accent-teal button {
          color: #00a3c8;
          border-color: #00a3c8;
        }
        .why-choose-card.accent-teal button:hover {
          background: #00a3c8;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 163, 200, 0.2);
        }
      `}</style>
      {/* 1. HERO SECTION */}
      <style>{`
        .hero {
          position: relative;
          min-height: 62vh;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          padding: 50px 40px;
          overflow: hidden;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(105deg, rgba(26, 58, 110, 0.95) 0%, rgba(26, 58, 110, 0.7) 40%, rgba(0, 163, 200, 0.25) 100%);
          z-index: 1;
        }

        .hero-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          z-index: 2;
          position: relative;
        }

        .hero-content {
          position: relative;
          z-index: 3;
          max-width: 420px;
          margin-left: 5%;
          text-align: left;
          animation: heroFadeIn 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .hero-pre-title {
          display: inline-block;
          background: rgba(0, 163, 200, 0.2);
          color: #00a3c8;
          border: 1px solid rgba(0, 163, 200, 0.3);
          padding: 8px 18px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 24px;
          backdrop-filter: blur(4px);
        }

        .hero-content h1 {
          font-size: 46px;
          font-weight: 900;
          line-height: 1.15;
          color: #ffffff;
          margin: 0 0 20px 0;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }

        .hero-content h1 span.highlight-teal {
          color: #00a3c8;
          position: relative;
          display: inline-block;
        }

        .hero-content p {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          margin: 0 0 30px 0;
          max-width: 620px;
        }

        .hero-right-image {
          position: absolute;
          top: 0;
          right: 0;
          width: 58%;
          height: 100%;
          z-index: 2;
        }

        .hero-right-underlay {
          position: absolute;
          top: 0;
          left: -15px;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(0, 124, 185, 0.95) 0%, rgba(0, 163, 200, 0.6) 100%);
          border-radius: 30% 0% 0% 30% / 50% 0% 0% 50%;
          z-index: 1;
        }

        .hero-img-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          border-radius: 30% 0% 0% 30% / 50% 0% 0% 50%;
          border-left: 14px solid #ffffff;
          box-shadow: -25px 0 50px rgba(0, 0, 0, 0.25);
          background-color: #f1f5f9;
          z-index: 2;
        }

        .hero-img-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 30%;
          transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .hero-img-wrapper:hover img {
          transform: scale(1.05);
        }

        @keyframes heroFadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Premium Overlay Cards Styling */
        .contact-infohome {
          position: relative;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          max-width: 1200px;
          margin: -15px auto 40px auto;
          padding: 0 20px;
          z-index: 5;
        }

        .contact-item {
          background: #ffffff !important;
          border-radius: 18px !important;
          border: 1px solid #f1f5f9 !important;
          padding: 24px 20px !important;
          display: flex !important;
          align-items: center !important;
          gap: 16px !important;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08) !important;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          text-align: left !important;
          position: relative !important;
          overflow: hidden !important;
          opacity: 0;
          transform: translateY(20px);
          animation: cardSlideUp 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          height: auto !important;
          min-height: unset !important;
        }

        .contact-item::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #007cb9 0%, #00a3c8 100%);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        .contact-item:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 40px rgba(0, 163, 200, 0.15) !important;
          border-color: rgba(0, 163, 200, 0.2) !important;
        }

        .contact-item:hover::after {
          transform: scaleX(1);
        }

        .iconin {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.35s ease;
          flex-shrink: 0;
        }

        .contact-item:nth-child(odd) .iconin {
          background: rgba(0, 124, 185, 0.1);
          color: #007cb9;
        }

        .contact-item:nth-child(even) .iconin {
          background: rgba(0, 163, 200, 0.1);
          color: #00a3c8;
        }

        .contact-item:hover .iconin {
          transform: scale(1.12) rotate(8deg);
        }

        .contact-item:nth-child(odd):hover .iconin {
          background: #007cb9;
          color: #ffffff;
        }

        .contact-item:nth-child(even):hover .iconin {
          background: #00a3c8;
          color: #ffffff;
        }

        .contact-item p {
          font-size: 13px !important;
          color: #475569 !important;
          font-weight: 600 !important;
          margin: 0 !important;
          line-height: 1.4 !important;
        }

        .contact-card-delay-0 { animation-delay: 0.15s; }
        .contact-card-delay-1 { animation-delay: 0.25s; }
        .contact-card-delay-2 { animation-delay: 0.35s; }
        .contact-card-delay-3 { animation-delay: 0.45s; }

        @keyframes cardSlideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 991px) {
          .contact-infohome {
            grid-template-columns: repeat(2, 1fr);
            margin-top: -40px;
            gap: 15px;
          }
          .hero-content h1 {
            font-size: 40px;
          }
        }

        @media (max-width: 1024px) {
          .hero {
            padding: 60px 20px;
            min-height: 70vh;
          }
          .hero-right-image {
            display: none;
          }
          .hero-content {
            max-width: 100%;
            margin-left: 0;
          }
        }

        @media (max-width: 768px) {
          .hero {
            min-height: 60vh;
            padding: 50px 20px;
          }
          .hero-content h1 {
            font-size: 34px;
          }
          .hero-content p {
            font-size: 16px;
          }
        }

        @media (max-width: 576px) {
          .contact-infohome {
            grid-template-columns: 1fr;
            margin-top: 20px;
            gap: 12px;
          }
        }

        /* Tighten section spacing globally on Home page */
        .medical {
          padding: 45px 20px !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }

        .stats-section {
          padding: 50px 20px !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
      `}</style>
      <section className="hero" style={{ backgroundImage: `url(${homeback})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-pre-title">Welcome to G.J.S Multispeciality Hospital</span>
            <h1>Dedicated Experts.<br /><span className="highlight-teal">Exceptional Care</span></h1>
            <p>Delivering trusted, compassionate, and advanced medical services — every specialty, one destination.</p>
          </div>
        </div>
        
        <div className="hero-right-image">
          <div className="hero-right-underlay"></div>
          <div className="hero-img-wrapper">
            <img src="/gjs frontend elivation.png" alt="G.J.S. Hospital Building" />
          </div>
        </div>
      </section>

      {/* 2. CONTACT OVERLAY CARDS */}
      <aside className="contact-infohome">
        {/* CARD 1: PHONES */}
        <div className="contact-item contact-card-delay-0">
          <span className="iconin">
            <Phone size={24} />
          </span>
          <div>
            <p>+91 72004 80576</p>
            <p>+91 72004 90574</p>
          </div>
        </div>

        {/* CARD 2: WORKING HOURS */}
        <div className="contact-item contact-card-delay-1">
          <span className="iconin">
            <Clock size={24} />
          </span>
          <div>
            <p>
              SunDay - Saturday: <br />
              24 Hours a Day <br />
              7 Days a Week
            </p>
          </div>
        </div>

        {/* CARD 3: EMAIL */}
        <div className="contact-item contact-card-delay-2">
          <span className="iconin">
            <Mail size={24} />
          </span>
          <div>
            <p>info@gjshospitals.com</p>
          </div>
        </div>

        {/* CARD 4: LOCATION */}
        <div className="contact-item contact-card-delay-3">
          <span className="iconin">
            <MapPin size={24} />
          </span>
          <div>
            <p>
              25/2, Ramalingapuram,<br />
              Kamarajar Nagar,<br />
              Avadi-600054
            </p>
          </div>
        </div>
      </aside>

      {/* 3. MEDICAL OVERVIEW SECTION */}
      <section className="medical">
        <div className="medical-image">
          <img src={hospitalGif} alt="Doctors" loading="lazy" />
        </div>
        <div className="medical-content">
          <h2>G.J.S Multispeciality Hospital</h2>
          <h3><strong>Comprehensive Care, Compassionate Approach</strong></h3>
          <p>
            G.J.S Multispeciality Hospital is committed to delivering high-quality, patient-centered healthcare across a wide range of specialties. With modern facilities and an experienced team of medical professionals, we ensure safe, effective, and timely treatment for every individual.
          </p>
          <p style={{ marginTop: '10px' }}>
            From diagnosis to recovery, we offer personalized care plans and support tailored to each patient’s unique needs—ensuring healing with trust, compassion, and excellence at every step.
          </p>
        </div>
      </section>

      <div style={{ background: 'linear-gradient(180deg, #fafcff 0%, #f0f7ff 100%)', padding: '30px 20px 20px 20px' }}>
        <h2 style={{ 
          color: '#1a3a6e', 
          textAlign: 'center', 
          fontSize: '34px', 
          fontWeight: '900',
          marginBottom: '20px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Why Choose G.J.S Multispeciality Hospital?
        </h2>
        <section ref={whyChooseRef} style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* CARD 1 */}
          <div className={`why-choose-card accent-teal choose-card-animate choose-card-delay-0 ${whyChooseVisible ? 'choose-card-visible' : ''}`}>
            <div className="choose-icon-circle" style={{ backgroundColor: '#e6f6f9', color: '#00a3c8' }}>
              <Stethoscope size={24} />
            </div>
            <h3>Comprehensive Medical Services</h3>
            <p>Our hospital offers a wide range of specialties—from cardiology to pediatrics—ensuring complete healthcare under one roof.</p>
            <Link to="/services">
              <button>Services</button>
            </Link>
          </div>

          {/* CARD 2 */}
          <div className={`why-choose-card accent-navy choose-card-animate choose-card-delay-1 ${whyChooseVisible ? 'choose-card-visible' : ''}`}>
            <div className="choose-icon-circle" style={{ backgroundColor: '#f0f4fa', color: '#1a3a6e' }}>
              <Users size={24} />
            </div>
            <h3>Qualified and Experienced Doctors</h3>
            <p>Our team of expert physicians brings years of experience and advanced training to deliver the highest quality medical care.</p>
            <Link to="/doctor">
              <button>Doctor</button>
            </Link>
          </div>

          {/* CARD 3 */}
          <div className={`why-choose-card accent-teal choose-card-animate choose-card-delay-2 ${whyChooseVisible ? 'choose-card-visible' : ''}`}>
            <div className="choose-icon-circle" style={{ backgroundColor: '#e6f6f9', color: '#00a3c8' }}>
              <HeartPulse size={24} />
            </div>
            <h3>Advanced Diagnostic Facilities</h3>
            <p>We are equipped with modern diagnostic tools and labs to ensure accurate and timely treatment.</p>
            <Link to="/appointment">
              <button>Book</button>
            </Link>
          </div>

          {/* CARD 4 */}
          <div className={`why-choose-card accent-navy choose-card-animate choose-card-delay-3 ${whyChooseVisible ? 'choose-card-visible' : ''}`}>
            <div className="choose-icon-circle" style={{ backgroundColor: '#f0f4fa', color: '#1a3a6e' }}>
              <Clock size={24} />
            </div>
            <h3>24×7 Emergency Care</h3>
            <p>Our emergency department is open round-the-clock, providing immediate care with speed, safety, and compassion.</p>
            <Link to="/contact">
              <button>Contact</button>
            </Link>
          </div>
        </section>
      </div>

      {/* 5. THREE BOXES SECTION - OUR SERVICES */}
      <section ref={servicesSectionRef} className="three-boxes-section" style={{ 
        paddingTop: '30px',
        paddingBottom: '40px',
        background: '#fafcff' 
      }}>
        <div className="section-heading" style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            color: '#1a3a6e', 
            fontSize: '34px', 
            fontWeight: '900',
            fontFamily: 'Poppins, sans-serif'
          }}>Our Services</h2>
          <p style={{ color: '#475569', fontSize: '15px' }}>We provide high-quality care across multiple specialties for all your needs.</p>
        </div>

        <style>{`
          .services-card-animate {
            opacity: 0;
            transform: translateY(50px);
            transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
          }
          .services-card-visible {
            opacity: 1;
            transform: translateY(0);
          }
          .services-card-delay-0 { transition-delay: 0s; }
          .services-card-delay-1 { transition-delay: 0.15s; }
          .services-card-delay-2 { transition-delay: 0.3s; }

          .service-deck-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
            gap: 24px;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
          }
          
          .service-card-new {
            background: #ffffff;
            border-radius: 24px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.03);
            transition: all 0.45s cubic-bezier(0.25, 1, 0.5, 1);
            display: flex;
            flex-direction: column;
            position: relative;
            max-width: 360px;
            margin: 0 auto;
            width: 100%;
          }
          
          .service-card-new:hover {
            transform: translateY(-12px) scale(1.01);
            box-shadow: 0 30px 60px rgba(26, 58, 110, 0.15);
            border-color: #cbd5e1;
          }

          .card-banner-wrapper {
            position: relative;
            height: 245px;
            overflow: hidden;
          }

          .card-banner-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s ease;
          }

          .service-card-new:hover .card-banner-img {
            transform: scale(1.08);
          }

          .card-wave-separator {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 25px;
            fill: #ffffff;
            z-index: 2;
          }

          .card-badge-floating {
            position: absolute;
            top: 20px;
            left: 20px;
            width: 54px;
            height: 54px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            z-index: 3;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .service-card-new:hover .card-badge-floating {
            transform: scale(1.15) rotate(12deg);
          }

          .badge-blue {
            background: linear-gradient(135deg, #007cb9 0%, #006090 100%);
            box-shadow: 0 8px 20px rgba(0, 124, 185, 0.3);
          }
          .badge-teal {
            background: linear-gradient(135deg, #00a3c8 0%, #008db2 100%);
            box-shadow: 0 8px 20px rgba(0, 163, 200, 0.3);
          }
          .badge-navy {
            background: linear-gradient(135deg, #1a3a6e 0%, #12284c 100%);
            box-shadow: 0 8px 20px rgba(26, 58, 110, 0.3);
          }

          .card-body-content {
            padding: 24px 20px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            text-align: left;
          }

          .card-body-content h3 {
            font-size: 20px;
            font-weight: 900;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
          }

          .title-blue { color: #007cb9; }
          .title-teal { color: #00a3c8; }
          .title-navy { color: #1a3a6e; }

          .card-body-content .card-desc {
            font-size: 13.5px;
            color: #64748b;
            line-height: 1.5;
            margin-bottom: 24px;
          }

          .subcat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 24px;
          }

          .subcat-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            transition: all 0.3s ease;
          }

          .subcat-item:hover {
            background: #ffffff;
            border-color: #cbd5e1;
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
          }

          .subcat-item-icon {
            margin-bottom: 6px;
            transition: transform 0.3s ease;
          }
          
          .subcat-item:hover .subcat-item-icon {
            transform: scale(1.18);
          }

          .icon-blue { color: #007cb9; }
          .icon-teal { color: #00a3c8; }
          .icon-navy { color: #1a3a6e; }

          .subcat-item span {
            font-size: 9px;
            font-weight: 800;
            color: #475569;
            white-space: nowrap;
          }

          .checklist-ul {
            list-style: none;
            padding: 0;
            margin: 0 0 28px 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .checklist-li {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13.5px;
            color: #475569;
            font-weight: 600;
          }

          .check-blue { color: #007cb9; }
          .check-teal { color: #00a3c8; }
          .check-navy { color: #1a3a6e; }

          .explore-btn {
            width: 100%;
            border: none;
            padding: 14px 20px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 800;
            color: #ffffff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
            margin-top: auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            text-decoration: none;
          }

          .btn-blue {
            background: linear-gradient(135deg, #007cb9 0%, #006090 100%);
            box-shadow: 0 4px 12px rgba(0, 124, 185, 0.2);
          }
          .btn-blue:hover {
            background: linear-gradient(135deg, #006090 0%, #004d75 100%);
            box-shadow: 0 6px 18px rgba(0, 124, 185, 0.35);
            transform: translateY(-2px);
          }
          
          .btn-teal {
            background: linear-gradient(135deg, #00a3c8 0%, #008db2 100%);
            box-shadow: 0 4px 12px rgba(0, 163, 200, 0.2);
          }
          .btn-teal:hover {
            background: linear-gradient(135deg, #008db2 0%, #007cb9 100%);
            box-shadow: 0 6px 18px rgba(0, 163, 200, 0.35);
            transform: translateY(-2px);
          }

          .btn-navy {
            background: linear-gradient(135deg, #1a3a6e 0%, #12284c 100%);
            box-shadow: 0 4px 12px rgba(26, 58, 110, 0.2);
          }
          .btn-navy:hover {
            background: linear-gradient(135deg, #12284c 0%, #0d1e3a 100%);
            box-shadow: 0 6px 18px rgba(26, 58, 110, 0.35);
            transform: translateY(-2px);
          }

          .explore-btn span {
            transition: transform 0.3s ease;
          }
          .explore-btn:hover span {
            transform: translateX(4px);
          }

          /* Premium Responsive Adjustments */
          @media (max-width: 991px) {
            .service-deck-container {
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 20px;
            }
            .card-banner-wrapper {
              height: 220px;
            }
          }
          @media (max-width: 768px) {
            .service-deck-container {
              grid-template-columns: 1fr;
              padding: 0 10px;
            }
            .service-card-new {
              max-width: 400px;
            }
            .card-banner-wrapper {
              height: 240px;
            }
          }
          @media (max-width: 480px) {
            .subcat-grid {
              grid-template-columns: repeat(4, 1fr) !important;
              gap: 8px !important;
            }
            .subcat-item span {
              font-size: 8px !important;
            }
          }
        `}</style>

        <div className="service-deck-container">
          {/* CARD 1: CLINICAL SERVICES */}
          <div className={`service-card-new services-card-animate services-card-delay-0 ${servicesSectionVisible ? 'services-card-visible' : ''}`}>
            <div className="card-banner-wrapper">
              <img src={clinicalBanner} className="card-banner-img" alt="Clinical Services" loading="lazy" />
              <div className="card-badge-floating badge-blue">
                <Stethoscope size={26} />
              </div>
              <svg className="card-wave-separator" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path d="M0,96C120,117.3,240,160,360,160C480,160,600,117,720,106.7C840,96,960,117,1080,112C1200,107,1320,75,1380,58.7L1440,43L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,0,320Z"></path>
              </svg>
            </div>
            
            <div className="card-body-content">
              <h3 className="title-blue">CLINICAL SERVICES</h3>
              <p className="card-desc">Expert medical care across a wide range of specialties with our experienced doctors.</p>
              
              <div className="subcat-grid">
                <div className="subcat-item">
                  <Heart className="subcat-item-icon icon-blue" size={18} />
                  <span>Cardiology</span>
                </div>
                <div className="subcat-item">
                  <Brain className="subcat-item-icon icon-blue" size={18} />
                  <span>Neurology</span>
                </div>
                <div className="subcat-item">
                  <Bone className="subcat-item-icon icon-blue" size={18} />
                  <span>Orthopedics</span>
                </div>
                <div className="subcat-item">
                  <Baby className="subcat-item-icon icon-blue" size={18} />
                  <span>Pediatrics</span>
                </div>
                <div className="subcat-item">
                  <Activity className="subcat-item-icon icon-blue" size={18} />
                  <span>Gynecology</span>
                </div>
                <div className="subcat-item">
                  <Pill className="subcat-item-icon icon-blue" size={18} />
                  <span>Medicine</span>
                </div>
                <div className="subcat-item">
                  <Sparkles className="subcat-item-icon icon-blue" size={18} />
                  <span>Dermatology</span>
                </div>
                <div className="subcat-item">
                  <Ear className="subcat-item-icon icon-blue" size={18} />
                  <span>ENT</span>
                </div>
              </div>

              <ul className="checklist-ul">
                <li className="checklist-li"><Check className="check-blue" size={16} /> Experienced & Certified Doctors</li>
                <li className="checklist-li"><Check className="check-blue" size={16} /> Advanced Treatment Methods</li>
                <li className="checklist-li"><Check className="check-blue" size={16} /> Patient-Centered Approach</li>
                <li className="checklist-li"><Check className="check-blue" size={16} /> 24/7 Clinical Support</li>
              </ul>

              <Link to="/services" className="explore-btn btn-blue">
                Explore Clinical Services <ArrowRight size={16} className="explore-arrow" />
              </Link>
            </div>
          </div>

          {/* CARD 2: SUPPORTING SERVICES */}
          <div className={`service-card-new services-card-animate services-card-delay-1 ${servicesSectionVisible ? 'services-card-visible' : ''}`}>
            <div className="card-banner-wrapper">
              <img src={supportingBanner} className="card-banner-img" alt="Supporting Services" loading="lazy" />
              <div className="card-badge-floating badge-teal">
                <Building2 size={26} />
              </div>
              <svg className="card-wave-separator" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path d="M0,96C120,117.3,240,160,360,160C480,160,600,117,720,106.7C840,96,960,117,1080,112C1200,107,1320,75,1380,58.7L1440,43L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,0,320Z"></path>
              </svg>
            </div>
            
            <div className="card-body-content">
              <h3 className="title-teal">SUPPORTING SERVICES</h3>
              <p className="card-desc">Advanced infrastructure and support services that ensure seamless patient care.</p>
              
              <div className="subcat-grid">
                <div className="subcat-item">
                  <Accessibility className="subcat-item-icon icon-teal" size={18} />
                  <span>Physio</span>
                </div>
                <div className="subcat-item">
                  <Pill className="subcat-item-icon icon-teal" size={18} />
                  <span>Pharmacy</span>
                </div>
                <div className="subcat-item">
                  <Hospital className="subcat-item-icon icon-teal" size={18} />
                  <span>ICU</span>
                </div>
                <div className="subcat-item">
                  <FlaskConical className="subcat-item-icon icon-teal" size={18} />
                  <span>Laboratory</span>
                </div>
                <div className="subcat-item">
                  <Wind className="subcat-item-icon icon-teal" size={18} />
                  <span>Respiratory</span>
                </div>
                <div className="subcat-item">
                  <ShieldAlert className="subcat-item-icon icon-teal" size={18} />
                  <span>Theatre</span>
                </div>
                <div className="subcat-item">
                  <FileText className="subcat-item-icon icon-teal" size={18} />
                  <span>Records</span>
                </div>
                <div className="subcat-item">
                  <Trash2 className="subcat-item-icon icon-teal" size={18} />
                  <span>Cleaning</span>
                </div>
              </div>

              <ul className="checklist-ul">
                <li className="checklist-li"><Check className="check-teal" size={16} /> State-of-the-art Infrastructure</li>
                <li className="checklist-li"><Check className="check-teal" size={16} /> Well Trained Support Staff</li>
                <li className="checklist-li"><Check className="check-teal" size={16} /> Hygienic & Safe Environment</li>
                <li className="checklist-li"><Check className="check-teal" size={16} /> Round-the-clock Assistance</li>
              </ul>

              <Link to="/services" className="explore-btn btn-teal">
                View All Supporting Services <ArrowRight size={16} className="explore-arrow" />
              </Link>
            </div>
          </div>

          {/* CARD 3: DIAGNOSTIC & OUTSOURCED SERVICES */}
          <div className={`service-card-new services-card-animate services-card-delay-2 ${servicesSectionVisible ? 'services-card-visible' : ''}`}>
            <div className="card-banner-wrapper">
              <img src={diagnosticBanner} className="card-banner-img" alt="Diagnostic & Outsourced Services" loading="lazy" />
              <div className="card-badge-floating badge-navy">
                <HeartPulse size={26} />
              </div>
              <svg className="card-wave-separator" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path d="M0,96C120,117.3,240,160,360,160C480,160,600,117,720,106.7C840,96,960,117,1080,112C1200,107,1320,75,1380,58.7L1440,43L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,0,320Z"></path>
              </svg>
            </div>
            
            <div className="card-body-content">
              <h3 className="title-navy">DIAGNOSTIC & OUTSOURCED</h3>
              <p className="card-desc">Accurate diagnostics and essential outsourced services for complete care.</p>
              
              <div className="subcat-grid">
                <div className="subcat-item">
                  <Droplet className="subcat-item-icon icon-navy" size={18} />
                  <span>Blood Bank</span>
                </div>
                <div className="subcat-item">
                  <Scan className="subcat-item-icon icon-navy" size={18} />
                  <span>MRI Scan</span>
                </div>
                <div className="subcat-item">
                  <Scan className="subcat-item-icon icon-navy" size={18} />
                  <span>CT Scan</span>
                </div>
                <div className="subcat-item">
                  <Activity className="subcat-item-icon icon-navy" size={18} />
                  <span>X-Ray</span>
                </div>
                <div className="subcat-item">
                  <Radio className="subcat-item-icon icon-navy" size={18} />
                  <span>Ultrasound</span>
                </div>
                <div className="subcat-item">
                  <Activity className="subcat-item-icon icon-navy" size={18} />
                  <span>ECG</span>
                </div>
                <div className="subcat-item">
                  <Shirt className="subcat-item-icon icon-navy" size={18} />
                  <span>Laundry</span>
                </div>
                <div className="subcat-item">
                  <Truck className="subcat-item-icon icon-navy" size={18} />
                  <span>Ambulance</span>
                </div>
              </div>

              <ul className="checklist-ul">
                <li className="checklist-li"><Check className="check-navy" size={16} /> Advanced Diagnostic Technology</li>
                <li className="checklist-li"><Check className="check-navy" size={16} /> Quick & Accurate Results</li>
                <li className="checklist-li"><Check className="check-navy" size={16} /> Reliable & Timely Support</li>
                <li className="checklist-li"><Check className="check-navy" size={16} /> Maintaining Highest Standards</li>
              </ul>

              <Link to="/services" className="explore-btn btn-navy">
                Explore Diagnostic Services <ArrowRight size={16} className="explore-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MEET OUR EXPERTS */}
      <section ref={doctorSectionRef} className="doctor-section2" style={{ padding: '30px 20px', background: '#ffffff' }}>
        <h2 className="section-title2" style={{ 
          color: '#1a3a6e', 
          textAlign: 'center', 
          fontSize: '34px', 
          fontWeight: '900',
          marginBottom: '24px',
          fontFamily: 'Poppins, sans-serif'
        }}>Meet Our Experts</h2>
        
        <style>{`
          .doctor-card-animate {
            opacity: 0;
            transform: translateY(40px);
            transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
          }
          .doctor-card-visible {
            opacity: 1;
            transform: translateY(0);
          }
          .doctor-card-delay-0 { transition-delay: 0s; }
          .doctor-card-delay-1 { transition-delay: 0.1s; }
          .doctor-card-delay-2 { transition-delay: 0.2s; }
          .doctor-card-delay-3 { transition-delay: 0.3s; }

          .doctor-card-img-wrapper {
            width: 100%;
            height: 270px;
            overflow: hidden;
            border-radius: 16px;
            margin-bottom: 15px;
            background: #f8fafc;
          }
          .doctor-card-img-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
          }
          .doctor-card2:hover .doctor-card-img-wrapper img {
            transform: scale(1.08);
          }

          .doctor-card2 {
            background: #ffffff;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            padding: 16px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            overflow: hidden;
            text-align: center;
            max-width: 270px;
            margin: 0 auto;
          }
          
          .doctor-card2::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            transition: transform 0.35s ease;
            transform: scaleX(0);
            transform-origin: left;
          }
          .doctor-card2.doctor-accent-blue::before {
            background: #007cb9;
          }
          .doctor-card2.doctor-accent-teal::before {
            background: #00a3c8;
          }
          .doctor-card2:hover::before {
            transform: scaleX(1);
          }
          
          .doctor-card2:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0, 124, 185, 0.12);
            border-color: #cbd5e1;
          }

          .doctor-card2 h3 {
            font-size: 18px;
            font-weight: 800;
            color: #1e293b;
            margin: 10px 0 4px 0;
            transition: color 0.3s ease;
          }
          .doctor-card2.doctor-accent-blue:hover h3 {
            color: #007cb9;
          }
          .doctor-card2.doctor-accent-teal:hover h3 {
            color: #00a3c8;
          }

          .doctor-card2 p {
            font-size: 13.5px;
            color: #64748b;
            margin: 0;
            font-weight: 600;
          }

          .view-all-btn2 {
            background: #00a3c8;
            color: #ffffff;
            border: none;
            padding: 12px 36px;
            border-radius: 30px;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 163, 200, 0.2);
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
          }
          .view-all-btn2:hover {
            background: #007cb9;
            box-shadow: 0 6px 20px rgba(0, 124, 185, 0.3);
            transform: translateY(-2px);
          }
        `}</style>

        <div className="doctor-row2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto 40px auto' }}>
          {/* CARD 1 */}
          <div className={`doctor-card2 doctor-accent-blue doctor-card-animate doctor-card-delay-0 ${doctorSectionVisible ? 'doctor-card-visible' : ''}`}>
            <div className="doctor-card-img-wrapper">
              <img src={maleImg} alt="Dr. K. Ganesan" loading="lazy" />
            </div>
            <h3>Dr. K. Ganesan</h3>
            <p>Founder & Pediatrician</p>
          </div>

          {/* CARD 2 */}
          <div className={`doctor-card2 doctor-accent-teal doctor-card-animate doctor-card-delay-1 ${doctorSectionVisible ? 'doctor-card-visible' : ''}`}>
            <div className="doctor-card-img-wrapper">
              <img src={femaleImg} alt="Dr. Priya S." loading="lazy" />
            </div>
            <h3>Dr. Priya S.</h3>
            <p>Cardiologist</p>
          </div>

          {/* CARD 3 */}
          <div className={`doctor-card2 doctor-accent-blue doctor-card-animate doctor-card-delay-2 ${doctorSectionVisible ? 'doctor-card-visible' : ''}`}>
            <div className="doctor-card-img-wrapper">
              <img src={maleImg} alt="Dr. Raj Kumar" loading="lazy" />
            </div>
            <h3>Dr. Raj Kumar</h3>
            <p>Orthopedic Surgeon</p>
          </div>

          {/* CARD 4 */}
          <div className={`doctor-card2 doctor-accent-teal doctor-card-animate doctor-card-delay-3 ${doctorSectionVisible ? 'doctor-card-visible' : ''}`}>
            <div className="doctor-card-img-wrapper">
              <img src={femaleImg} alt="Dr. Anitha R." loading="lazy" />
            </div>
            <h3>Dr. Anitha R.</h3>
            <p>Gynecologist</p>
          </div>
        </div>
        <div className="view-all-container2" style={{ textAlign: 'center' }}>
          <Link to="/doctor" className="view-all-btn2">
            View All Doctors
          </Link>
        </div>
      </section>

      {/* 7. STATS SECTION */}
      <section className="stats-section" style={{ backgroundImage: `url(${home2})` }}>
        <div className="stat-box">
          <Building2 className="icon" size={36} />
          <h2>22<span>+</span></h2>
          <h4>Departments</h4>
          <p>G.J.S offers 22 expert medical departments for comprehensive care.</p>
        </div>

        <div className="stat-box">
          <Stethoscope className="icon" size={36} />
          <h2>146<span>+</span></h2>
          <h4>Specialized Services</h4>
          <p>Advanced diagnostic and treatment services across 146 specialties.</p>
        </div>

        <div className="stat-box">
          <Users className="icon" size={36} />
          <h2>388<span>+</span></h2>
          <h4>Expert Doctors</h4>
          <p>G.J.S Multispeciality Hospital is proud to have 388 skilled doctors.</p>
        </div>

        <div className="stat-box">
          <HeartPulse className="icon" size={36} />
          <h2>1280<span>+</span></h2>
          <h4>Happy Patients</h4>
          <p>Over 1280 patients treated with compassion and excellence.</p>
        </div>
      </section>
    </main>
  );
};

export default Home;
