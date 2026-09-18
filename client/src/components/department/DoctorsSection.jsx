import React from 'react';
import { Link } from 'react-router-dom';
import { getDoctorImage } from '../../data/doctors';
import { Stethoscope, Calendar, Clock, Globe, Award, DollarSign, ChevronRight } from 'lucide-react';

const DoctorsSection = ({ doctors, departmentName }) => {
  return (
    <section style={{ backgroundColor: '#f8fafc', padding: '70px 20px', borderTop: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '45px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ color: '#0070c0', fontWeight: '800', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>QUALIFIED MEDICAL PROFESSIONALS</span>
            <h2 style={{ fontSize: '36px', color: '#1a3a6e', margin: '4px 0 0', fontWeight: '800' }}>
              Meet Our {departmentName} Specialists ({doctors.length})
            </h2>
          </div>
          <Link 
            to="/appointment" 
            style={{ 
              background: '#1a3a6e', 
              color: '#fff', 
              padding: '12px 28px', 
              borderRadius: '30px', 
              fontWeight: '700', 
              textDecoration: 'none', 
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Book Consultation <ChevronRight size={16} />
          </Link>
        </div>

        {doctors.length === 0 ? (
          <div style={{ background: '#fff', padding: '50px', borderRadius: '20px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
            <Stethoscope size={48} color="#0070c0" style={{ marginBottom: '15px' }} />
            <h3>Our on-call specialists are available for consultation in {departmentName}.</h3>
            <Link to="/appointment" style={{ display: 'inline-block', marginTop: '15px', color: '#0070c0', fontWeight: '700' }}>
              Book an Appointment with On-Call Specialist →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
            {doctors.map((doctor) => (
              <div 
                key={doctor.id} 
                style={{
                  background: '#fff',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* PHOTO CONTAINER */}
                <div style={{ height: '250px', position: 'relative', overflow: 'hidden', background: '#f1f5f9' }}>
                  <img 
                    src={getDoctorImage(doctor.gender, doctor.image_url)} 
                    alt={doctor.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  />
                  <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(15,23,42,0.7)', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: '700', backdropFilter: 'blur(4px)' }}>
                    {doctor.experience_years || 5}+ Yrs Exp
                  </div>
                </div>

                {/* DOCTOR INFO */}
                <div style={{ padding: '22px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1a3a6e', marginBottom: '4px' }}>
                      {doctor.name}
                    </h3>
                    <span style={{ color: '#0070c0', fontWeight: '700', fontSize: '14px', display: 'block', marginBottom: '10px' }}>
                      {doctor.specialty}
                    </span>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.4', marginBottom: '16px', wordBreak: 'break-word' }}>
                      {doctor.consults}
                    </p>

                    {/* METADATA BADGES */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={14} color="#0070c0" />
                        <span>Languages: <strong>{doctor.languages || 'English, Tamil'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} color="#0070c0" />
                        <span>Availability: <strong>{doctor.availability || 'Mon - Sat (9 AM - 4 PM)'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={14} color="#16a34a" />
                        <span>Fee: <strong>₹{parseInt(doctor.consultation_fee) || 500} (OPD Consult)</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link 
                      to="/appointment" 
                      style={{ 
                        flex: 1,
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px', 
                        backgroundColor: '#1a3a6e', 
                        color: '#fff', 
                        padding: '10px 14px', 
                        borderRadius: '12px', 
                        fontWeight: '700', 
                        fontSize: '13px', 
                        textDecoration: 'none' 
                      }}
                    >
                      <Calendar size={14} /> Book Appointment
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default DoctorsSection;
