import React, { useState, useEffect } from 'react';
import logoImg from '../assets/logo1-CTHYC838.avif';
import { ChevronUp } from 'lucide-react';

const Footer = () => {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.pageYOffset > 300) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 300) {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [showScroll]);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="footer">
        <div className="footer-container">
          {/* COLUMN 1: LOGO & DESCRIPTION */}
          <div className="footer-box">
            <img 
              className="logofooter" 
              src={logoImg} 
              alt="logo" 
              style={{ verticalAlign: 'middle', marginRight: '10px' }} 
            />
            <b>G.J.S</b> <span style={{ fontSize: 'small' }}>Multispecialty Hospital</span>
            <p style={{ marginTop: '10px' }}>
              G.J.S Multispeciality Hospital delivers compassionate, quality healthcare with advanced medical excellence.
            </p>
          </div>

          {/* COLUMN 2: OUR LOCATION & CONTACT */}
          <div className="footer-box">
            <h3>Our Location</h3>
            <p>25/2, Kamarajar Nagar, Karumari Amman Kovil Road, Avadi, Chennai - 600 071</p>
            <p style={{ marginTop: '10px' }}>
              Email: <a href="mailto:info@gjshospitals.com" style={{ color: '#fff', textDecoration: 'none' }}>info@gjshospitals.com</a>
            </p>
            <p>Phone1: <span style={{ color: '#00a3c8' }}>+91 72004 80576</span></p>
            <p>Phone2: <span style={{ color: '#00a3c8' }}>+91 72004 90574</span></p>
          </div>

          {/* COLUMN 3: WORKING TIME */}
          <div className="footer-box">
            <h3>Working Time</h3>
            <p>
              Sun - Sat: <strong style={{ color: '#00a3c8' }}>24 Hours a Day, 7 Days a Week</strong>
            </p>
          </div>

          {/* COLUMN 4: EMERGENCY CASES */}
          <div className="footer-box">
            <h3>Emergency Cases</h3>
            <p className="emergency-number" style={{ color: '#00a3c8' }}>
              +91 72004 80576
            </p>
            <p>
              Delivering expert care across specialties with compassion, precision, and trust—every step of your health journey
            </p>
          </div>
        </div>
      </footer>

      {/* SCROLL TO TOP BUTTON */}
      <button
        className={`scroll-to-top ${showScroll ? 'show' : ''}`}
        onClick={scrollTop}
        aria-label="Scroll to top"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronUp size={30} color="#fff" />
      </button>
    </>
  );
};

export default Footer;
