import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import doctorGroupBanner from '../assets/doctor_group_banner.jpg';
import { getDoctorImage } from '../data/doctors';
import { getDoctors } from '../services/doctorService';
import { Stethoscope, HeartPulse, Clock, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, RotateCcw, User, Award, Users, Shield, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

import icon1 from '../assets/icon1-C85wVh4s.png';
import icon2 from '../assets/icon2-BXn-ZW_h.png';
import icon3 from '../assets/icon3-m21sB-0j.png';
import icon4 from '../assets/icon4-B8CPF4TF.png';
import icon5 from '../assets/icon5-_BVNI6YE.png';
import icon7 from '../assets/icon7-CU85NDvA.png';

const Doctors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedGender, setSelectedGender] = useState('all');
  const [activeService, setActiveService] = useState('Child Care');

  const [doctors, setDoctors] = useState([]);
  const [allSpecialtiesList, setAllSpecialtiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state (12 doctors per page for clean layout)
  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 12;

  // Initial load to get all doctors & unique specialties
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const res = await getDoctors();
        if (res.success && res.data) {
          const uniqueSpecs = ['All', ...new Set(res.data.map(d => d.specialty).filter(Boolean))];
          setAllSpecialtiesList(uniqueSpecs);
        }
      } catch (e) {
        console.log('Error fetching specialties list:', e);
      }
    };
    loadInitialData();
  }, []);

  const fetchDoctorsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDoctors({
        search: searchTerm,
        department: selectedSpecialty !== 'All' ? selectedSpecialty : undefined,
        gender: selectedGender !== 'all' ? selectedGender : undefined
      });
      if (response.success) {
        setDoctors(response.data || []);
        setCurrentPage(1); // Reset to page 1 on any filter change
      } else {
        setError('Failed to fetch doctor listing.');
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError("Couldn't load doctors right now, please retry.");
      toast.error("Couldn't load doctors right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorsData();
  }, [searchTerm, selectedSpecialty, selectedGender]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('All');
    setSelectedGender('all');
  };

  // Calculate Paginated Doctors
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = doctors.slice(indexOfFirstDoctor, indexOfLastDoctor);
  const totalPages = Math.ceil(doctors.length / doctorsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const servicesRowItems = [
    { name: "Child Care", icon: icon1 },
    { name: "Vaccinations", icon: icon2 },
    { name: "Allergy Test", icon: icon3 },
    { name: "Screenings", icon: icon4 },
    { name: "Pathology", icon: icon5 },
    { name: "Cardiology", icon: icon7 }
  ];

  return (
    <main>
      {/* NEW TRENDING HERO BANNER */}
      <style>{`
        .doctor-banner-new {
          position: relative;
          background: linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%);
          padding: 80px 20px 100px 20px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 520px;
        }

        .doctor-banner-container {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 40px;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          align-items: center;
          z-index: 2;
        }

        .doctor-banner-left {
          text-align: left;
        }

        .doctor-banner-badge {
          display: inline-block;
          background: rgba(0, 124, 185, 0.1);
          color: #007cb9;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .doctor-banner-left h1 {
          font-size: 52px;
          font-weight: 900;
          line-height: 1.1;
          color: #1a3a6e;
          margin: 0 0 10px 0;
          letter-spacing: -0.02em;
        }

        .doctor-banner-left h1 span.blue-text {
          color: #007cb9;
        }

        .doctor-banner-left-line {
          width: 60px;
          height: 4px;
          background: #007cb9;
          margin-bottom: 20px;
          border-radius: 2px;
        }

        .doctor-banner-left p.desc {
          font-size: 15px;
          color: #475569;
          line-height: 1.6;
          margin: 0 0 35px 0;
          max-width: 520px;
        }

        .doctor-banner-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          max-width: 650px;
        }

        .doctor-banner-stat-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 14px 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 25px rgba(26, 58, 110, 0.04);
          transition: all 0.3s ease;
        }

        .doctor-banner-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(0, 124, 185, 0.1);
        }

        .doctor-banner-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
        }

        .stat-card-blue .doctor-banner-stat-icon {
          background: #007cb9;
        }

        .stat-card-teal .doctor-banner-stat-icon {
          background: #00a3c8;
        }

        .stat-card-purple .doctor-banner-stat-icon {
          background: #7c3aed;
        }

        .doctor-banner-stat-card div h4 {
          font-size: 16px;
          font-weight: 800;
          color: #1a3a6e;
          margin: 0;
          line-height: 1.1;
        }

        .doctor-banner-stat-card div p {
          font-size: 9px;
          color: #64748b;
          margin: 2px 0 0 0;
          font-weight: 700;
          white-space: nowrap;
        }

        .doctor-banner-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .doctor-banner-img-wrapper {
          position: relative;
          width: 450px;
          height: 340px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(26, 58, 110, 0.12);
          z-index: 2;
          border: 6px solid #ffffff;
          transition: all 0.4s ease;
        }

        .doctor-banner-img-wrapper:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 30px 60px rgba(0, 124, 185, 0.2);
        }

        .doctor-banner-img-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .doctor-banner-img-wrapper:hover img {
          transform: scale(1.05);
        }

        .doctor-banner-circle-bg {
          position: absolute;
          width: 500px;
          height: 500px;
          border: 2px dashed rgba(0, 124, 185, 0.2);
          border-radius: 50%;
          z-index: 1;
          animation: spinSlow 35s linear infinite;
        }

        .floating-icon {
          position: absolute;
          background: #ffffff;
          color: #007cb9;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(26, 58, 110, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
          animation: floatSlow 4s ease-in-out infinite alternate;
        }

        .floating-icon-1 {
          top: 10%;
          left: 5%;
          color: #007cb9;
          animation-delay: 0s;
        }

        .floating-icon-2 {
          bottom: 10%;
          left: 5%;
          color: #00a3c8;
          animation-delay: 1s;
        }

        .floating-icon-3 {
          bottom: 40%;
          right: 5%;
          color: #7c3aed;
          animation-delay: 2s;
        }

        .doctor-banner-wave {
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 45px;
          fill: #ffffff;
          z-index: 3;
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes floatSlow {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-12px) rotate(8deg); }
        }

        @media (max-width: 1200px) {
          .doctor-banner-img-wrapper {
            width: 380px;
            height: 290px;
          }
          .doctor-banner-circle-bg {
            width: 430px;
            height: 430px;
          }
        }

        @media (max-width: 991px) {
          .doctor-banner-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
          }
          .doctor-banner-left {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .doctor-banner-stats {
            justify-content: center;
          }
          .doctor-banner-img-wrapper {
            width: 440px;
            height: 330px;
            margin: 0 auto;
          }
          .doctor-banner-circle-bg {
            width: 490px;
            height: 490px;
          }
        }

        @media (max-width: 768px) {
          .doctor-banner-left h1 {
            font-size: 38px;
          }
          .doctor-banner-stats {
            grid-template-columns: repeat(2, 1fr);
            max-width: 400px;
          }
        }

        @media (max-width: 576px) {
          .doctor-banner-img-wrapper {
            width: 100%;
            max-width: 340px;
            height: 240px;
            border-width: 4px;
          }
          .doctor-banner-circle-bg {
            display: none;
          }
          .floating-icon {
            display: none;
          }
        }
      `}</style>
      
      <section className="doctor-banner-new">
        <div className="doctor-banner-container">
          <div className="doctor-banner-left">
            <span className="doctor-banner-badge">EXPERT CARE. BETTER HEALTH.</span>
            <h1>Our Expert <br /><span className="blue-text">Doctors</span></h1>
            <div className="doctor-banner-left-line"></div>
            <p className="desc">Meet our team of highly qualified and experienced doctors who are committed to providing the best healthcare for you.</p>
            
            <div className="doctor-banner-stats">
              <div className="doctor-banner-stat-card stat-card-blue">
                <span className="doctor-banner-stat-icon">
                  <Users size={18} />
                </span>
                <div>
                  <h4>31+</h4>
                  <p>Expert Doctors</p>
                </div>
              </div>

              <div className="doctor-banner-stat-card stat-card-teal">
                <span className="doctor-banner-stat-icon">
                  <Stethoscope size={18} />
                </span>
                <div>
                  <h4>15+</h4>
                  <p>Specialties</p>
                </div>
              </div>

              <div className="doctor-banner-stat-card stat-card-purple">
                <span className="doctor-banner-stat-icon">
                  <HeartPulse size={18} />
                </span>
                <div>
                  <h4>10K+</h4>
                  <p>Happy Patients</p>
                </div>
              </div>

              <div className="doctor-banner-stat-card stat-card-blue">
                <span className="doctor-banner-stat-icon">
                  <Clock size={18} />
                </span>
                <div>
                  <h4>24/7</h4>
                  <p>Support</p>
                </div>
              </div>
            </div>
          </div>

          <div className="doctor-banner-right">
            <div className="doctor-banner-circle-bg"></div>
            <div className="floating-icon floating-icon-1">
              <Shield size={20} />
            </div>
            <div className="floating-icon floating-icon-2">
              <Heart size={20} />
            </div>
            <div className="floating-icon floating-icon-3">
              <Award size={20} />
            </div>
            <div className="doctor-banner-img-wrapper">
              <img src={doctorGroupBanner} alt="Our Expert Doctors Team" />
            </div>
          </div>
        </div>

        {/* BOTTOM WAVE SEPARATOR */}
        <svg className="doctor-banner-wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path d="M0,96C120,117.3,240,160,360,160C480,160,600,117,720,106.7C840,96,960,117,1080,112C1200,107,1320,75,1380,58.7L1440,43L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,0,320Z"></path>
        </svg>
      </section>

      {/* TOP HEADER & FILTERS */}
      <div className="doctor-top">
        <h6>QUALIFIED MEDICAL PROFESSIONALS</h6>
        <h2>Meet Our Expert Doctors</h2>
        <p>Our team of 31 certified medical professionals is dedicated to delivering the highest standard of care and compassion.</p>
        
        {/* SEARCH AND FILTER CONTROLS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', alignItems: 'center', margin: '30px 0 10px' }}>
          <input
            type="text"
            placeholder="Search by doctor name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '12px 20px',
              width: '280px',
              borderRadius: '25px',
              border: '1px solid #00a3c8',
              outline: 'none',
              fontSize: '14px',
              backgroundColor: '#fff'
            }}
          />

          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            style={{
              padding: '12px 20px',
              borderRadius: '25px',
              border: '1px solid #00a3c8',
              outline: 'none',
              fontSize: '14px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              maxWidth: '260px'
            }}
          >
            {allSpecialtiesList.map((spec, i) => (
              <option key={i} value={spec}>{spec === 'All' ? 'All Specialties (All 31 Doctors)' : spec}</option>
            ))}
          </select>

          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            style={{
              padding: '12px 20px',
              borderRadius: '25px',
              border: '1px solid #00a3c8',
              outline: 'none',
              fontSize: '14px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Genders</option>
            <option value="male">Male Doctors</option>
            <option value="female">Female Doctors</option>
          </select>

          {(searchTerm || selectedSpecialty !== 'All' || selectedGender !== 'all') && (
            <button
              onClick={handleResetFilters}
              style={{
                background: '#e0f2fe',
                color: '#0284c7',
                border: '1px solid #00a3c8',
                padding: '11px 20px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={15} /> Reset Filters
            </button>
          )}
        </div>

        {/* RESULTS SUMMARY BAR */}
        <div style={{ margin: '15px 0 35px' }}>
          <span style={{ background: '#e3f4ff', color: '#004861', padding: '6px 18px', borderRadius: '20px', fontSize: '14px', fontWeight: '700' }}>
            Showing {doctors.length} Doctor{doctors.length === 1 ? '' : 's'} Found
          </span>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fef2f2', maxWidth: '600px', margin: '20px auto', borderRadius: '16px', border: '1px solid #fecaca' }}>
          <AlertCircle size={40} color="#dc2626" style={{ marginBottom: '10px' }} />
          <h3 style={{ color: '#991b1b', marginBottom: '8px' }}>Unable to Load Doctors</h3>
          <p style={{ color: '#7f1d1d', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={fetchDoctorsData}
            style={{ background: '#00a3c8', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* SKELETON LOADER */}
      {loading && !error && (
        <div className="doctorcardres" style={{ maxWidth: '1240px', margin: 'auto', padding: '20px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} style={{ height: '420px', background: '#f1f5f9', borderRadius: '16px', animation: 'pulse 1.5s infinite alternate' }}></div>
          ))}
        </div>
      )}

      {/* DOCTORS GRID WITH HIGH-END CARD DESIGN & UNTRUNCATED TEXT */}
      {!loading && !error && (
        <>
          <section className="doctorcardres" style={{ maxWidth: '1240px', margin: 'auto', padding: '0 20px 40px' }}>
            {currentDoctors.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                <Stethoscope size={48} color="#00a3c8" style={{ marginBottom: '12px' }} />
                <h3>No doctors match your selected filters.</h3>
                <button 
                  onClick={handleResetFilters}
                  style={{ marginTop: '15px', background: '#00a3c8', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Clear Filters & Show All Doctors
                </button>
              </div>
            ) : (
              currentDoctors.map((doctor) => (
                <div key={doctor.id} className="doctor-card">
                  {/* DOCTOR IMAGE CONTAINER */}
                  <div className="card-img">
                    <img src={getDoctorImage(doctor.gender, doctor.image_url)} alt={doctor.name} />
                    <div className="Doctors-icon">
                      <Link to="/appointment" title="Book Appointment">
                        <Stethoscope size={18} />
                      </Link>
                    </div>
                  </div>

                  {/* DOCTOR INFO CONTAINER - DYNAMIC FLEX FULL TEXT DISPLAY */}
                  <div className="doctor-info">
                    <div>
                      <h3 className="doc-name">{doctor.name}</h3>
                      <div className="doc-specialty">{doctor.specialty}</div>
                      <div className="consults" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                        {doctor.consults}
                      </div>
                    </div>

                    <Link 
                      to="/appointment" 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '14px', 
                        background: '#e0f2fe',
                        color: '#007cb9', 
                        fontWeight: '700', 
                        fontSize: '13px', 
                        textDecoration: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Book Consultation →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', margin: '10px 0 60px' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  background: currentPage === 1 ? '#e2e8f0' : '#00a3c8',
                  color: currentPage === 1 ? '#94a3b8' : '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '20px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px'
                }}
              >
                <ChevronLeft size={18} /> Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{
                    background: currentPage === page ? '#004861' : '#fff',
                    color: currentPage === page ? '#fff' : '#0f172a',
                    border: '1px solid #00a3c8',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: currentPage === page ? '0 4px 12px rgba(0,72,97,0.3)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  background: currentPage === totalPages ? '#e2e8f0' : '#00a3c8',
                  color: currentPage === totalPages ? '#94a3b8' : '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '20px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px'
                }}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* HOSPITAL PROGRESS SECTION */}
      <section className="section sectiontop">
        <div className="sectioncontent">
          <h4>OUR COMMITMENT TO EXCELLENCE</h4>
          <h1>Healthcare Quality & Patient Standards</h1>
          <p>
            At G.J.S Multispeciality Hospital, we benchmark our services against strict international healthcare quality parameters to ensure safe, effective, and compassionate medical care.
          </p>
        </div>

        <div className="progress-section" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="progress-box">
            <div className="progress-title">
              Environmental Safety & Hygiene
              <span className="progress-percent">90%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '90%' }}></div>
            </div>
            <p>Strict sterile protocols, daily sanitization, and clean hospital environment.</p>
          </div>

          <div className="progress-box">
            <div className="progress-title">
              Clinical Excellence & Success Rate
              <span className="progress-percent">93%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '93%' }}></div>
            </div>
            <p>Advanced diagnostic tools, modern OTs, and highly experienced specialists.</p>
          </div>

          <div className="progress-box">
            <div className="progress-title">
              Patient Care & Support
              <span className="progress-percent">95%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '95%' }}></div>
            </div>
            <p>24/7 dedicated nursing staff, prompt emergency response, and patient comfort.</p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SERVICES ROW */}
      <section style={{ padding: '60px 20px', backgroundColor: '#fff', textAlign: 'center' }}>
        <h2 style={{ color: '#004861', fontSize: '28px', marginBottom: '10px' }}>Comprehensive Medical Care</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>Click on a specialty icon to explore specialized care departments.</p>

        <div className="services-row">
          {servicesRowItems.map((item, index) => (
            <div
              key={index}
              className={`service-item ${activeService === item.name ? 'active' : 'deactive'}`}
              onClick={() => setActiveService(item.name)}
            >
              <img src={item.icon} alt={item.name} />
              <p>{item.name}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Doctors;
