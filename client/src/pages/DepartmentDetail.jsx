import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getDepartmentByIdOrSlug } from '../services/departmentService';
import { getDoctors } from '../services/doctorService';

// 12 MODULAR SECTIONS
import DepartmentHero from '../components/department/DepartmentHero';
import DepartmentBreadcrumb from '../components/department/DepartmentBreadcrumb';
import DepartmentOverview from '../components/department/DepartmentOverview';
import TreatmentCards from '../components/department/TreatmentCards';
import FacilitiesGrid from '../components/department/FacilitiesGrid';
import DoctorsSection from '../components/department/DoctorsSection';
import DepartmentStats from '../components/department/DepartmentStats';
import WhyChooseSection from '../components/department/WhyChooseSection';
import TestimonialsSlider from '../components/department/TestimonialsSlider';
import FAQAccordion from '../components/department/FAQAccordion';
import BookAppointmentCTA from '../components/department/BookAppointmentCTA';
import RelatedDepartments from '../components/department/RelatedDepartments';

import { RefreshCw, AlertCircle } from 'lucide-react';

const DepartmentDetail = () => {
  const { idOrSlug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  const [department, setDepartment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDepartmentDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Department Details from API
        const depRes = await getDepartmentByIdOrSlug(idOrSlug, isPreview);
        if (depRes.success && depRes.data) {
          const depData = depRes.data;
          setDepartment(depData);

          // 2. Fetch Specialists for this department from API
          const docRes = await getDoctors({ department: depData.name });
          if (docRes.success) {
            setDoctors(docRes.data || []);
          }
        } else {
          setError('Department details not found.');
        }
      } catch (err) {
        console.error('Error loading department detail:', err);
        setError('Department not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idOrSlug]);

  // SKELETON LOADING STATE
  if (loading) {
    return (
      <main style={{ backgroundColor: '#f8fafc', minHeight: '80vh', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '60px auto', background: '#fff', padding: '50px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <RefreshCw size={44} color="#0070c0" className="spin" style={{ marginBottom: '15px' }} />
          <h3 style={{ color: '#1a3a6e', fontSize: '22px', fontWeight: '800' }}>Loading Department Details...</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Fetching clinical data, facilities & specialists from hospital API</p>
        </div>
      </main>
    );
  }

  // ERROR RETRY STATE
  if (error || !department) {
    return (
      <main style={{ backgroundColor: '#f8fafc', minHeight: '80vh', padding: '60px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', background: '#fff', padding: '50px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '15px' }} />
          <h2 style={{ color: '#1a3a6e', marginBottom: '10px', fontSize: '26px', fontWeight: '800' }}>Department Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '25px' }}>{error}</p>
          <Link to="/departments" style={{ background: '#0070c0', color: '#fff', padding: '12px 28px', borderRadius: '30px', fontWeight: '700', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to All Departments
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: '#f8fafc', minHeight: '80vh' }}>
      {/* 1. HERO BANNER */}
      <DepartmentHero department={department} />

      {/* 2. BREADCRUMB NAVIGATION */}
      <DepartmentBreadcrumb departmentName={department.name} />

      {/* 3. DEPARTMENT OVERVIEW (Vision, Mission, Description, Services) */}
      <DepartmentOverview department={department} />

      {/* 4. TREATMENTS & PROCEDURES CARDS */}
      <TreatmentCards department={department} />

      {/* 5. FACILITIES & TECHNOLOGY GRID */}
      <FacilitiesGrid department={department} />

      {/* 6. MEET OUR SPECIALISTS (Doctors for this department) */}
      <DoctorsSection doctors={doctors} departmentName={department.name} />

      {/* 7. DEPARTMENT STATISTICS COUNTERS */}
      <DepartmentStats department={department} doctorCount={doctors.length || department.doctor_count || 10} />

      {/* 8. WHY CHOOSE OUR DEPARTMENT */}
      <WhyChooseSection department={department} />

      {/* 9. PATIENT TESTIMONIALS SLIDER */}
      <TestimonialsSlider department={department} />

      {/* 10. FREQUENTLY ASKED QUESTIONS ACCORDION */}
      <FAQAccordion department={department} />

      {/* 11. BOOK APPOINTMENT CTA BANNER */}
      <BookAppointmentCTA departmentName={department.name} />

      {/* 12. RELATED DEPARTMENTS */}
      <RelatedDepartments currentDeptId={department.id} />
    </main>
  );
};

export default DepartmentDetail;
