import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import contactBanner from '../assets/reception.jpg';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendContactMessage } from '../services/contactService';

const Contact = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Ref and state for scroll reveal animation
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.phone || !formData.message) {
      toast.error('Name, Phone Number, and Message are required.');
      return;
    }

    setLoading(true);

    try {
      const response = await sendContactMessage({
        name: `${formData.first_name} ${formData.last_name}`.trim(),
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      });

      if (response.success) {
        toast.success('Your message has been sent successfully!');
        setSubmitted(true);
      } else {
        toast.error(response.message || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ backgroundColor: '#fafbfd' }}>
      {/* INJECT ANIMATION & BRANDED THEME EFFECT */}
      <style>{`
        .contact-info-card {
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          padding: 32px 28px;
          display: flex;
          gap: 20px;
          align-items: flex-start;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        /* Top border gradient line on hover matching project logo theme */
        .contact-info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #1a3a6e, #00a3c8);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
        }
        .contact-info-card:hover::before {
          transform: scaleX(1);
        }
        .contact-info-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(26, 58, 110, 0.12);
          border-color: #cbd5e1;
        }
        /* Icon rotation and zoom on card hover */
        .contact-info-card:hover .info-icon-circle {
          transform: scale(1.12) rotate(8deg);
          box-shadow: 0 6px 15px rgba(0, 163, 200, 0.15);
        }
        .info-icon-circle {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .banner-btn {
          transition: all 0.25s ease;
        }
        .banner-btn:hover {
          transform: translateY(-2.5px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
        }
        @media (max-width: 991px) {
          .contact-banner-image {
            display: none !important;
          }
          .contact-banner-text {
            max-width: 100% !important;
            text-align: center;
            padding: 60px 20px 100px 20px !important;
          }
          .banner-btn-wrapper {
            justify-content: center !important;
          }
        }
        @media (max-width: 768px) {
          .contact-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 576px) {
          .contact-info-grid {
            grid-template-columns: 1fr !important;
          }
          .contact-banner-text h1 {
            font-size: 38px !important;
          }
        }

        /* Scroll reveal animations for Map & Form */
        .map-animate {
          opacity: 0;
          transform: translateX(-40px);
          transition: opacity 0.7s cubic-bezier(0.25, 1, 0.5, 1), transform 0.7s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .form-animate {
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 0.7s cubic-bezier(0.25, 1, 0.5, 1), transform 0.7s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .animate-visible {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>

      {/* NEW HERO SPLIT BANNER */}
      <section style={{
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%)',
        minHeight: '460px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Left Side Text Panel */}
        <div className="contact-banner-text" style={{
          flex: '1',
          maxWidth: '52%',
          padding: '100px 40px 140px 60px',
          zIndex: 2,
          boxSizing: 'border-box'
        }}>
          <h1 style={{
            fontSize: '52px',
            fontWeight: '900',
            color: '#1a3a6e',
            marginBottom: '18px',
            lineHeight: '1.15',
            fontFamily: 'Poppins, sans-serif'
          }}>
            Contact Us
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#475569',
            lineHeight: '1.7',
            marginBottom: '32px',
            fontWeight: '600'
          }}>
            We are here to help you 24/7. Reach out for appointments, emergency care, or any general inquiries.
          </p>
          
          <div className="banner-btn-wrapper" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link 
              to="/appointment" 
              className="banner-btn"
              style={{
                backgroundColor: '#00a3c8', // Branded Teal Logo Color
                color: '#ffffff',
                padding: '14px 28px',
                borderRadius: '30px',
                fontWeight: '700',
                fontSize: '14.5px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 163, 200, 0.25)'
              }}
            >
              <Calendar size={16} />
              Book Appointment
            </Link>
            <a 
              href="tel:+917200490574"
              className="banner-btn"
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                padding: '14px 28px',
                borderRadius: '30px',
                fontWeight: '700',
                fontSize: '14.5px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)'
              }}
            >
              <Phone size={16} />
              Call Emergency
            </a>
          </div>
        </div>

        {/* Right Side Curve Reception Image */}
        <div className="contact-banner-image" style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '50%',
          backgroundImage: `url(${contactBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderTopLeftRadius: '35% 100%',
          borderBottomLeftRadius: '15% 100%',
          zIndex: 1
        }} />
      </section>

      {/* NEW 4 INFO CARDS GRID (OVERLAYED) */}
      <div style={{
        padding: '0 40px',
        marginTop: '-60px',
        position: 'relative',
        zIndex: 3,
        maxWidth: '1280px',
        margin: '-60px auto 0 auto',
        boxSizing: 'border-box'
      }}>
        <div className="contact-info-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px'
        }}>
          {/* CARD 1: VISIT US */}
          <div className="contact-info-card">
            <div className="info-icon-circle" style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#e6f6f9', // Branded Teal tint
              color: '#00a3c8', // Branded Teal Logo Color
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MapPin size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Visit Our Hospital</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.55', margin: 0, fontWeight: '500' }}>
                2S/2, Kamarajar Nagar,<br />
                Karumari Amman Kovil Road,<br />
                Avadi, Chennai - 600 071<br />
                Tamil Nadu, India
              </p>
              <a 
                href="https://maps.google.com/maps?q=G.J.S%20Child%20Care%20Centre,%2025/2,%20Kamarajar%20Nagar,%20Avadi-600054" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#00a3c8',
                  textDecoration: 'none',
                  marginTop: '6px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                Get Directions →
              </a>
            </div>
          </div>

          {/* CARD 2: CALL US */}
          <div className="contact-info-card">
            <div className="info-icon-circle" style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#f0f4fa', // Branded Navy tint
              color: '#1a3a6e', // Branded Navy Logo Color
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Phone size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Call Us</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#64748b' }}>Appointment</span>
                <a href="tel:+917200480576" style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', textDecoration: 'none' }}>
                  +91 72004 80576
                </a>
                
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#ef4444', marginTop: '5px' }}>Emergency (24/7)</span>
                <a href="tel:+917200490574" style={{ fontSize: '14.5px', fontWeight: '800', color: '#ef4444', textDecoration: 'none' }}>
                  +91 72004 90574
                </a>
              </div>
            </div>
          </div>

          {/* CARD 3: EMAIL US */}
          <div className="contact-info-card">
            <div className="info-icon-circle" style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#e6f6f9',
              color: '#00a3c8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Mail size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#1e293b', margin: 0 }}>E-Mail Us</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <a href="mailto:info@gjshospitals.com" style={{ fontSize: '13px', color: '#00a3c8', textDecoration: 'none', fontWeight: '600' }}>
                  info@gjshospitals.com
                </a>
                <a href="mailto:support@gjshospitals.com" style={{ fontSize: '13px', color: '#00a3c8', textDecoration: 'none', fontWeight: '600' }}>
                  support@gjshospitals.com
                </a>
              </div>
            </div>
          </div>

          {/* CARD 4: WORKING HOURS */}
          <div className="contact-info-card">
            <div className="info-icon-circle" style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#f0f4fa',
              color: '#1a3a6e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Working Hours</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px', fontSize: '12.5px' }}>
                <span style={{ fontWeight: '700', color: '#ef4444' }}>Emergency</span>
                <span style={{ color: '#1e293b', fontWeight: '600' }}>24 Hours</span>
                
                <span style={{ fontWeight: '700', color: '#00a3c8', marginTop: '4px' }}>OPD Timings</span>
                <span style={{ color: '#1e293b', fontWeight: '600' }}>Mon - Sat: 9:00 AM - 8:00 PM</span>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>Sunday: Emergency Only</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAP & FORM SECTION */}
      <section ref={sectionRef} className="contact-section container" style={{ marginTop: '60px', overflow: 'hidden' }}>
        <div className={`map-container map-animate ${isVisible ? 'animate-visible' : ''}`}>
          <div style={{ width: '100%', height: '650px' }}>
            <iframe
              title="GJS Child Care Centre Avadi Map Location"
              src="https://maps.google.com/maps?q=G.J.S%20Child%20Care%20Centre,%2025/2,%20Kamarajar%20Nagar,%20Avadi-600054&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>

        <div className={`form-container form-animate ${isVisible ? 'animate-visible' : ''}`}>
          <h2>Leave A Message</h2>
          <p>
            We are here to assist you 24/7. Fill out the form below and our medical helpdesk team will get back to you shortly.
          </p>

          {submitted ? (
            <div style={{ padding: '30px', background: '#e3f4ff', borderRadius: '15px', color: '#004861', textAlign: 'center' }}>
              <CheckCircle size={48} color="#00a3c8" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ marginBottom: '10px' }}>Message Sent Successfully!</h3>
              <p>Thank you <strong>{formData.first_name}</strong>. Our hospital team will contact you shortly.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="submit-btn"
                style={{ marginTop: '20px' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    placeholder="John"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Message *</label>
                <textarea
                  name="message"
                  placeholder="Type your health enquiry or message here..."
                  required
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>

              <button type="submit" className="submit-btn" style={{ backgroundColor: '#00a3c8' }} disabled={loading}>
                {loading ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Contact;
