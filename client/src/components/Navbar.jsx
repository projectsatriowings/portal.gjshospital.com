import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Calendar, Search, ChevronDown, Award, Users, Stethoscope, Clock, ShieldAlert } from 'lucide-react';
import TopUtilityBar from './TopUtilityBar';
import logoImg from '../assets/logo1-CTHYC838.avif';
import { getDepartments } from '../services/departmentService';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // Focus search input when overlay is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Handle scroll to make navbar compact
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch departments for dynamic dropdown
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments();
        if (res.success && Array.isArray(res.data)) {
          setDepartments(res.data.slice(0, 8)); // Top 8 published depts
        }
      } catch (err) {
        console.error('Navbar departments fetch error:', err);
      }
    };
    fetchDepts();
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/departments?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%' }}>
      {/* INJECT PREMIUM CUSTOM STYLES */}
      <style>{`
        /* Hover line animation from center */
        .nav-link-custom {
          position: relative;
          text-decoration: none;
          color: #1e293b;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          padding: 8px 0;
          transition: color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap; /* Prevent any wrapping inside menu items */
        }
        .nav-link-custom:hover {
          color: #0070c0;
        }
        .nav-link-custom::after {
          content: '';
          position: absolute;
          width: 0;
          height: 3px;
          bottom: -2px;
          left: 50%;
          background-color: #0070c0;
          border-radius: 2px;
          transform: translateX(-50%);
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-link-custom:hover::after,
        .nav-link-custom.active::after {
          width: 100%;
        }
        .nav-link-custom.active {
          color: #0070c0;
        }

        /* Nav Dropdown Wrappers */
        .nav-item-dropdown {
          position: relative;
        }
        .dropdown-menu-custom {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(15px);
          opacity: 0;
          visibility: hidden;
          background: #ffffff;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          border-radius: 14px;
          padding: 16px;
          min-width: 260px;
          display: grid;
          gap: 4px;
          z-index: 1001;
          border: 1px solid #f1f5f9;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-item-dropdown:hover .dropdown-menu-custom {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(4px);
        }
        .dropdown-item-custom {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          color: #334155;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        .dropdown-item-custom:hover {
          background-color: #f0f9ff;
          color: #0070c0;
          transform: translateX(4px);
        }

        /* Outline Status Tracker Button */
        .btn-track-status {
          background: transparent;
          color: #0070c0;
          border: 2px solid #0070c0;
          padding: 8px 16px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }
        .btn-track-status:hover {
          background: #0070c0;
          color: #ffffff;
          box-shadow: 0 4px 15px rgba(0, 112, 192, 0.25);
          transform: translateY(-1px);
        }

        /* Solid Pill Appointment Button */
        .btn-book-appointment {
          background: #1a3a6e;
          color: #ffffff;
          border: none;
          padding: 9px 18px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(26, 58, 110, 0.15);
        }
        .btn-book-appointment:hover {
          background: #0f244a;
          box-shadow: 0 6px 18px rgba(26, 58, 110, 0.3);
          transform: translateY(-1px);
        }

        /* Menu Hamburger Button Styling */
        .btn-menu-toggle {
          display: none;
          background: none;
          border: none;
          color: #1a3a6e;
          cursor: pointer;
          padding: 8px;
          transition: transform 0.2s ease;
        }
        .btn-menu-toggle:hover {
          transform: scale(1.1);
        }

        /* Responsive Breakpoints - Raised to 1320px to prevent cramped headers */
        @media (max-width: 1320px) {
          .nav-links-desktop {
            display: none !important;
          }
          .nav-actions-desktop {
            display: none !important;
          }
          .btn-menu-toggle {
            display: block !important;
          }
        }
      `}</style>

      {/* 1. TOP UTILITY BAR (ONLY SHOWS WHEN NOT SCROLLING) */}
      {!isScrolled && <TopUtilityBar />}

      {/* 2. MAIN HEADER NAVBAR */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isScrolled ? '6px 24px' : '10px 24px',
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : '#ffffff',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 15px rgba(0,0,0,0.03)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        boxSizing: 'border-box',
        // NO overflow: hidden (prevents clipping the absolute positioned dropdown menus!)
        borderBottom: '1px solid #f1f5f9'
      }}>
        {/* HOSPITAL BRAND LOGO & BRANDING */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }} onClick={() => window.scrollTo(0, 0)}>
          <img 
            src={logoImg} 
            alt="G.J.S Hospital" 
            style={{ 
              height: isScrolled ? '34px' : '40px', 
              width: 'auto',
              flexShrink: 0,
              transition: 'height 0.3s ease'
            }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ 
              fontSize: isScrolled ? '15px' : '16px', 
              fontWeight: '900', 
              color: '#1a3a6e', 
              letterSpacing: '0.3px', 
              lineHeight: '1.2',
              transition: 'font-size 0.3s ease'
            }}>
              G.J.S MULTISPECIALITY
            </span>
            <span style={{ 
              fontSize: isScrolled ? '9.5px' : '10px', 
              fontWeight: '800', 
              color: '#00a3c8', 
              letterSpacing: '1.8px', 
              textTransform: 'uppercase', 
              lineHeight: '1.2', 
              marginTop: '1px',
              transition: 'font-size 0.3s ease'
            }}>
              HOSPITAL
            </span>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}>
          <NavLink to="/" end className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`} onClick={() => window.scrollTo(0, 0)}>
            Home
          </NavLink>
          
          <NavLink to="/about" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`} onClick={() => window.scrollTo(0, 0)}>
            About Us
          </NavLink>

          {/* DYNAMIC DEPARTMENTS DROPDOWN */}
          <div className="nav-item-dropdown">
            <NavLink 
              to="/departments" 
              className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              onClick={() => window.scrollTo(0, 0)}
            >
              Departments <ChevronDown size={12} style={{ marginTop: '1px' }} />
            </NavLink>
            <div className="dropdown-menu-custom">
              {departments.length > 0 ? (
                departments.map(dept => (
                  <Link 
                    key={dept.id} 
                    to={`/departments/${dept.slug || dept.id}`} 
                    className="dropdown-item-custom"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <Stethoscope size={14} color="#0070c0" />
                    <span>{dept.name}</span>
                  </Link>
                ))
              ) : (
                <Link to="/departments" className="dropdown-item-custom" onClick={() => window.scrollTo(0, 0)}>
                  <Stethoscope size={14} color="#0070c0" />
                  <span>Browse Departments</span>
                </Link>
              )}
            </div>
          </div>

          {/* DOCTORS DROPDOWN */}
          <div className="nav-item-dropdown">
            <NavLink 
              to="/doctor" 
              className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              onClick={() => window.scrollTo(0, 0)}
            >
              Doctors <ChevronDown size={12} style={{ marginTop: '1px' }} />
            </NavLink>
            <div className="dropdown-menu-custom">
              <Link to="/doctor" className="dropdown-item-custom" onClick={() => window.scrollTo(0, 0)}>
                <Users size={14} color="#0070c0" />
                <span>Meet Our Specialists</span>
              </Link>
              <Link to="/appointment" className="dropdown-item-custom" onClick={() => window.scrollTo(0, 0)}>
                <Calendar size={14} color="#0070c0" />
                <span>Book Consultant Slot</span>
              </Link>
              <Link to="/check-status" className="dropdown-item-custom" onClick={() => window.scrollTo(0, 0)}>
                <Clock size={14} color="#0070c0" />
                <span>Doctor Schedule Tracker</span>
              </Link>
            </div>
          </div>

          {/* SERVICES DROPDOWN */}
          <div className="nav-item-dropdown">
            <NavLink 
              to="/services" 
              className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              onClick={() => window.scrollTo(0, 0)}
            >
              Services <ChevronDown size={12} style={{ marginTop: '1px' }} />
            </NavLink>
            <div className="dropdown-menu-custom" style={{ minWidth: '220px' }}>
              <Link to="/services" className="dropdown-item-custom" onClick={() => window.scrollTo(0, 0)}>
                <Award size={14} color="#0070c0" />
                <span>Clinical Services</span>
              </Link>
              <Link to="/accreditation" className="dropdown-item-custom" onClick={() => window.scrollTo(0, 0)}>
                <ShieldAlert size={14} color="#0070c0" />
                <span>Accreditation & Quality</span>
              </Link>
            </div>
          </div>

          <NavLink to="/appointment" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`} onClick={() => window.scrollTo(0, 0)}>
            Appointment
          </NavLink>

          <NavLink to="/contact" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`} onClick={() => window.scrollTo(0, 0)}>
            Contact
          </NavLink>
        </nav>

        {/* DESKTOP CONTROLS */}
        <div className="nav-actions-desktop" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* SEARCH BUTTON */}
          <button 
            onClick={() => setShowSearch(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#1a3a6e',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title="Search clinical portal"
          >
            <Search size={15} />
          </button>

          {/* OUTLINED STATUS TRACKER */}
          <Link to="/check-status" className="btn-track-status">
            Track Status
          </Link>

          {/* SOLID PILL APPOINTMENT */}
          <Link to="/appointment" className="btn-book-appointment">
            <Calendar size={13} />
            Book Appointment
          </Link>
        </div>

        {/* MOBILE BURGER MENU BUTTON */}
        <button className="btn-menu-toggle" onClick={toggleMenu}>
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* DYNAMIC HEADER SLIDE-DOWN SEARCH BAR */}
        {showSearch && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            zIndex: 10,
            gap: '15px',
            animation: 'headerSearchFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            <style>{`
              @keyframes headerSearchFadeIn {
                from { opacity: 0; transform: translateY(-12px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <Search size={18} color="#0070c0" style={{ flexShrink: 0 }} />
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search departments, specialists, procedures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1e293b',
                  background: 'transparent'
                }}
              />
              <button 
                type="submit"
                style={{
                  backgroundColor: '#0070c0',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '30px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                Search
              </button>
              <button 
                type="button"
                onClick={() => setShowSearch(false)}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '30px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: '0',
            right: '0',
            width: '85%',
            maxWidth: '350px',
            height: '100vh',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.15)',
            zIndex: 1002,
            padding: '30px 25px',
            display: 'flex',
            flexDirection: 'column',
            gap: '25px',
            animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            boxSizing: 'border-box',
            borderLeft: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#1a3a6e', letterSpacing: '1px' }}>NAVIGATION MENU</span>
            <button style={{ background: 'none', border: 'none', color: '#1a3a6e', cursor: 'pointer' }} onClick={toggleMenu}>
              <X size={24} />
            </button>
          </div>

          <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }} />

          {/* MOBILE LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: '700', fontSize: '15px' }} onClick={() => { toggleMenu(); window.scrollTo(0, 0); }}>Home</Link>
            <Link to="/about" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: '700', fontSize: '15px' }} onClick={() => { toggleMenu(); window.scrollTo(0, 0); }}>About Us</Link>
            <Link to="/departments" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: '700', fontSize: '15px' }} onClick={() => { toggleMenu(); window.scrollTo(0, 0); }}>Departments</Link>
            <Link to="/doctor" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: '700', fontSize: '15px' }} onClick={() => { toggleMenu(); window.scrollTo(0, 0); }}>Doctors</Link>
            <Link to="/services" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: '700', fontSize: '15px' }} onClick={() => { toggleMenu(); window.scrollTo(0, 0); }}>Services</Link>
            <Link to="/appointment" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: '700', fontSize: '15px' }} onClick={() => { toggleMenu(); window.scrollTo(0, 0); }}>Appointment</Link>
            <Link to="/contact" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: '700', fontSize: '15px' }} onClick={() => { toggleMenu(); window.scrollTo(0, 0); }}>Contact</Link>
          </div>

          <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)', marginTop: 'auto' }} />

          {/* MOBILE CALL TO ACTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <Link 
              to="/check-status" 
              className="btn-track-status" 
              style={{ width: '100%', padding: '12px' }}
              onClick={toggleMenu}
            >
              Track Status
            </Link>
            <Link 
              to="/appointment" 
              className="btn-book-appointment" 
              style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
              onClick={toggleMenu}
            >
              <Calendar size={14} />
              Book Appointment
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
