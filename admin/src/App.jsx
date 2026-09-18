import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Mail, 
  RefreshCw, 
  Activity, 
  Search, 
  Menu, 
  X, 
  CheckCircle2, 
  Clock, 
  Building, 
  UserCheck, 
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit,
  Upload,
  Layers,
  LogOut,
  Shield,
  Settings,
  Image as ImageIcon,
  CreditCard,
  Globe,
  Pill,
  LayoutDashboard,
  Package,
  AlertTriangle,
  Building2,
  BedDouble
} from 'lucide-react';
import WardBedManager from './components/WardBedManager';
import IPDAdmissions from './components/IPDAdmissions';
import EditDepartmentForm from './components/EditDepartmentForm';
import OutsourcedServicesManager from './components/OutsourcedServicesManager';
import FacilityServicesManager from './components/FacilityServicesManager';
import InfrastructureServicesManager from './components/InfrastructureServicesManager';
import AccreditationsManager from './components/AccreditationsManager';
import ProfileSettings from './components/ProfileSettings';
import BillingModule from './components/BillingModule';
import PatientsManager from './components/PatientsManager';
import DoctorDashboard from './components/DoctorDashboard';
import MedicineCatalog from './components/MedicineCatalog';
import PharmacyDispensing from './components/PharmacyDispensing';
import PharmacyDashboard from './components/PharmacyDashboard';
import PharmacyCategories from './components/PharmacyCategories';
import PharmacyExpiry from './components/PharmacyExpiry';
import PharmacySettings from './components/PharmacySettings';
import PharmacyStockManagement from './components/PharmacyStockManagement';
import RevenueReports from './components/RevenueReports';
import DashboardOverview from './components/DashboardOverview';
import WalkinAppointmentModal from './components/WalkinAppointmentModal';
import AppointmentDetailModal from './components/AppointmentDetailModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

import { API_BASE_URL, SERVER_BASE_URL as SERVER_URL } from './config/api';

function AdminPanel() {
  const { user, logout, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [billingFilter, setBillingFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [deptEditorTab, setDeptEditorTab] = useState('basic');
  
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  // APPOINTMENTS MODALS & FILTER STATES
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [selectedDetailAppointmentId, setSelectedDetailAppointmentId] = useState(null);
  const [appStatusFilter, setAppStatusFilter] = useState('all');
  const [appDoctorFilter, setAppDoctorFilter] = useState('all');
  const [appDepartmentFilter, setAppDepartmentFilter] = useState('all');
  const [appStartDate, setAppStartDate] = useState('');
  const [appEndDate, setAppEndDate] = useState('');

  // Pagination for Doctors (10 per page)
  const [docPage, setDocPage] = useState(1);
  const docsPerPage = 10;



  // MODAL STATES FOR DOCTORS WITH IMAGE UPLOAD
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [docForm, setDocForm] = useState({
    name: '',
    specialty: 'Cardiology',
    consults: '',
    gender: 'male',
    image_url: '',
    user_id: null,
    login_email: '',
    consultation_fee: '500.00',
    experience_years: 5,
    languages: 'English, Tamil',
    availability: 'Mon - Sat (9 AM - 4 PM)'
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const fetchData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      // 1. Fetch Departments
      const deptRes = await fetch(`${API_BASE_URL}/departments`);
      const deptData = await deptRes.json();
      if (deptData.success) setDepartments(deptData.data || []);

      // 2. Fetch Doctors
      const docRes = await fetch(`${API_BASE_URL}/doctors`);
      const docData = await docRes.json();
      if (docData.success) setDoctors(docData.data || []);

      // 3. Fetch Appointments
      const appRes = await authFetch(`${API_BASE_URL}/admin/appointments`);
      const appData = await appRes.json();
      if (appData.success) setAppointments(appData.data || []);

      // 4. Fetch Enquiries
      const enqRes = await authFetch(`${API_BASE_URL}/enquiries`);
      const enqData = await enqRes.json();
      if (enqData.success) setEnquiries(enqData.data || []);
      
      setDbConnected(true);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 5000); // Real-time 5-second polling across Doctor & Receptionist dashboards
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      if (user.role === 'PHARMACIST') {
        if (activeTab === 'overview') {
          setActiveTab('pharmacy_dispensing');
        }
      } else if (user.role === 'ACCOUNTANT') {
        if (activeTab === 'overview') {
          setActiveTab('billing');
        }
      } else if (user.role === 'NURSE') {
        if (activeTab === 'overview') {
          setActiveTab('ipdAdmissions');
        }
      }
    }
  }, [user]);


  const handleUpdateAppointmentStatus = async (appId, newStatus) => {
    try {
      const subPath = newStatus === 'Confirmed' ? 'confirm' : 'cancel';
      const res = await authFetch(`${API_BASE_URL}/admin/appointments/${appId}/${subPath}`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };



  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name} department?`)) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/departments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Department deleted successfully!');
        fetchData();
      } else {
        alert(data.message || 'Failed to delete department');
      }
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Error deleting department');
    }
  };

  // DOCTOR FILE SELECTION & PREVIEW
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDocForm(prev => ({ ...prev, image_url: '' }));
  };

  const handleOpenDocModal = (doc = null) => {
    setLoginEmail('');
    setLoginPassword('');
    setCreatedCredentials(null);
    if (doc) {
      setEditingDoctorId(doc.id);
      setDocForm({
        name: doc.name,
        specialty: doc.specialty || departments[0]?.name || 'Cardiology',
        consults: doc.consults || '',
        gender: doc.gender || 'male',
        image_url: doc.image_url || '',
        user_id: doc.user_id || null,
        login_email: doc.login_email || '',
        consultation_fee: doc.consultation_fee || '500.00',
        experience_years: doc.experience_years !== undefined ? doc.experience_years : 5,
        languages: doc.languages || 'English, Tamil',
        availability: doc.availability || 'Mon - Sat (9 AM - 4 PM)'
      });
      if (doc.image_url) {
        setPreviewUrl(doc.image_url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setEditingDoctorId(null);
      setDocForm({
        name: '',
        specialty: departments[0]?.name || 'Cardiology',
        consults: '',
        gender: 'male',
        image_url: '',
        user_id: null,
        login_email: '',
        consultation_fee: '500.00',
        experience_years: 5,
        languages: 'English, Tamil',
        availability: 'Mon - Sat (9 AM - 4 PM)'
      });
      setPreviewUrl(null);
      setSelectedFile(null);
    }
    setShowDocModal(true);
  };

  // DOCTOR SAVE HANDLER WITH IMAGE UPLOAD
  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    if (!docForm.name || !docForm.specialty) return alert('Doctor Name & Department Specialty are required!');

    setUploadingImage(true);
    let finalImageUrl = docForm.image_url;

    try {
      // 1. Upload File if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('doctor_image', selectedFile);

        const uploadRes = await authFetch(`${API_BASE_URL}/doctors/upload-image`, {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          finalImageUrl = uploadData.image_url;
        } else {
          alert('Failed to upload image file.');
          setUploadingImage(false);
          return;
        }
      }

      // 2. Save Doctor Record to PostgreSQL
      const payload = {
        name: docForm.name,
        specialty: docForm.specialty,
        consults: docForm.consults,
        gender: docForm.gender,
        image_url: finalImageUrl,
        consultation_fee: docForm.consultation_fee || '500.00',
        experience_years: parseInt(docForm.experience_years) || 5,
        languages: docForm.languages || 'English, Tamil',
        availability: docForm.availability || 'Mon - Sat (9 AM - 4 PM)'
      };

      const url = editingDoctorId 
        ? `${API_BASE_URL}/doctors/${editingDoctorId}`
        : `${API_BASE_URL}/doctors`;
      const method = editingDoctorId ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        alert(editingDoctorId ? `Doctor ${docForm.name} updated successfully!` : `Doctor ${docForm.name} added to ${docForm.specialty} department successfully!`);
        setShowDocModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        setEditingDoctorId(null);
        setDocForm({ 
          name: '', 
          specialty: departments[0]?.name || 'Cardiology', 
          consults: '', 
          gender: 'male', 
          image_url: '', 
          user_id: null, 
          login_email: '',
          consultation_fee: '500.00',
          experience_years: 5,
          languages: 'English, Tamil',
          availability: 'Mon - Sat (9 AM - 4 PM)'
        });
        fetchData();
      } else {
        alert(data.message || 'Failed to save doctor');
      }
    } catch (err) {
      console.error('Error saving doctor:', err);
      alert('Error saving doctor');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/doctors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Doctor deleted successfully!');
        fetchData();
      } else {
        alert(data.message || 'Failed to delete doctor');
      }
    } catch (err) {
      console.error('Error deleting doctor:', err);
      alert('Error deleting doctor');
    }
  };

  // Helper for Doctor Image URL
  const getDoctorDisplayImg = (doc) => {
    if (doc.image_url && doc.image_url.trim() !== '') {
      if (doc.image_url.startsWith('http') || doc.image_url.startsWith('data:')) {
        return doc.image_url;
      }
      return `${SERVER_URL}${doc.image_url.startsWith('/') ? '' : '/'}${doc.image_url}`;
    }
    return doc.gender === 'female' 
      ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150' 
      : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150';
  };

  const [deptFilterTab, setDeptFilterTab] = useState('all'); // 'all', 'published', 'draft'

  const handleSelectDepartment = (id) => {
    setActiveTab('departments');
    setEditingDepartmentId(id);
  };

  const handleAddNewDepartment = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Department', short_description: 'Clinical specialization...' })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEditingDepartmentId(data.data.id);
        fetchData();
      }
    } catch (err) {
      console.error('Error creating department:', err);
    }
  };

  // Filtering functions
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = (dept.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dept.short_description && dept.short_description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (deptFilterTab === 'published') {
      return dept.publish_status === 'published';
    } else if (deptFilterTab === 'draft') {
      return dept.publish_status === 'draft' || !dept.publish_status;
    }
    return true;
  });

  const filteredDoctors = doctors.filter(doc => 
    (doc.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.specialty || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Doctors Pagination calculation
  const indexOfLastDoc = docPage * docsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - docsPerPage;
  const currentPaginatedDoctors = filteredDoctors.slice(indexOfFirstDoc, indexOfLastDoc);
  const totalDocPages = Math.ceil(filteredDoctors.length / docsPerPage);

  const filteredAppointments = appointments.filter(app => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (app.patient_name && app.patient_name.toLowerCase().includes(q)) ||
      (app.phone && app.phone.includes(q)) ||
      (app.mobile && app.mobile.includes(q)) ||
      (app.appointment_id && app.appointment_id.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (appStatusFilter !== 'all') {
      const st = (app.status || 'PENDING').toUpperCase();
      if (!st.includes(appStatusFilter.toUpperCase())) return false;
    }

    if (appDoctorFilter !== 'all' && String(app.doctor_id) !== String(appDoctorFilter)) {
      return false;
    }

    if (appDepartmentFilter !== 'all' && String(app.department_id) !== String(appDepartmentFilter)) {
      return false;
    }

    const appDate = (app.preferred_date || app.appointment_date || '').split('T')[0];
    if (appStartDate && appDate && appDate < appStartDate) return false;
    if (appEndDate && appDate && appDate > appEndDate) return false;

    return true;
  });

  const filteredEnquiries = enquiries.filter(enq => 
    enq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enq.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-container">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Activity size={24} color="#fff" />
          </div>
          <div className="brand-text">
            <h2>G.J.S Hospital</h2>
            <span>Admin Portal v1.0</span>
          </div>
          <button className="close-sidebar-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="nav-label">MAIN NAVIGATION</div>

        <nav className="nav-menu">
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'RECEPTIONIST') && (
            <button
              className={activeTab === 'overview' ? 'nav-item active' : 'nav-item'}
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
            >
              <Activity size={18} />
              <span>Dashboard Overview</span>
            </button>
          )}

          {/* DEPARTMENTS - ADMIN ONLY */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN') && (
            <>
              <button
                className={activeTab === 'departments' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('departments'); setDeptFilterTab('all'); setEditingDepartmentId(null); setSidebarOpen(false); }}
              >
                <Building size={18} />
                <span>Departments</span>
                <span className="count-pill highlight">{departments.length}</span>
              </button>

               {activeTab === 'departments' && (
                <div style={{ paddingLeft: '20px', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '4px', margin: '6px 0 14px' }}>
                  {/* All Departments */}
                  <button
                    type="button"
                    onClick={() => { setDeptFilterTab('all'); setEditingDepartmentId(null); setSidebarOpen(false); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: deptFilterTab === 'all' && !editingDepartmentId ? '#38bdf8' : '#94a3b8',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '6px',
                      textAlign: 'left',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span>📁 All Departments</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>({departments.length})</span>
                  </button>

                  {/* Published Section */}
                  <div style={{ marginTop: '4px', width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => { setDeptFilterTab('published'); setEditingDepartmentId(null); setSidebarOpen(false); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: deptFilterTab === 'published' && !editingDepartmentId ? '#38bdf8' : '#e2e8f0',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span>🟢 Published</span>
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>({departments.filter(d => d.publish_status === 'published').length})</span>
                    </button>
                    <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', width: '100%', boxSizing: 'border-box' }}>
                      {departments.filter(d => d.publish_status === 'published').map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => handleSelectDepartment(dept.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: editingDepartmentId === dept.id ? '#38bdf8' : '#94a3b8',
                            fontSize: '12px',
                            fontWeight: editingDepartmentId === dept.id ? '700' : '500',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            borderRadius: '4px',
                            display: 'block',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          • {dept.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Drafts Section */}
                  <div style={{ marginTop: '8px', width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => { setDeptFilterTab('draft'); setEditingDepartmentId(null); setSidebarOpen(false); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: deptFilterTab === 'draft' && !editingDepartmentId ? '#38bdf8' : '#e2e8f0',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span>📝 Drafts</span>
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>({departments.filter(d => d.publish_status === 'draft' || !d.publish_status).length})</span>
                    </button>
                    <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', width: '100%', boxSizing: 'border-box' }}>
                      {departments.filter(d => d.publish_status === 'draft' || !d.publish_status).map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => handleSelectDepartment(dept.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: editingDepartmentId === dept.id ? '#38bdf8' : '#94a3b8',
                            fontSize: '12px',
                            fontWeight: editingDepartmentId === dept.id ? '700' : '500',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            borderRadius: '4px',
                            display: 'block',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          • {dept.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SERVICES CATEGORIES - ADMIN ONLY */}
              <button
                className={activeTab === 'outsourcedServices' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('outsourcedServices'); setSidebarOpen(false); }}
              >
                <Layers size={18} />
                <span>Outsourced Services</span>
              </button>

              <button
                className={activeTab === 'facilityServices' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('facilityServices'); setSidebarOpen(false); }}
              >
                <Layers size={18} />
                <span>Facility Services</span>
              </button>

              <button
                className={activeTab === 'infrastructureServices' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('infrastructureServices'); setSidebarOpen(false); }}
              >
                <Layers size={18} />
                <span>Infrastructure Services</span>
              </button>

              <button
                className={activeTab === 'accreditations' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('accreditations'); setSidebarOpen(false); }}
              >
                <Layers size={18} />
                <span>Accreditation & Quality</span>
              </button>

              {/* IPD MANAGEMENT */}
              {(user?.role === 'HOSPITAL_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <button
                  className={activeTab === 'wardBeds' ? 'nav-item active' : 'nav-item'}
                  onClick={() => { setActiveTab('wardBeds'); setSidebarOpen(false); }}
                >
                  <Building2 size={18} />
                  <span>Ward & Beds</span>
                </button>
              )}

              <button
                className={activeTab === 'ipdAdmissions' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('ipdAdmissions'); setSidebarOpen(false); }}
              >
                <BedDouble size={18} />
                <span>IPD Admissions</span>
              </button>

              {/* DOCTORS - ADMIN ONLY */}
              <button
                className={activeTab === 'doctors' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('doctors'); setSidebarOpen(false); }}
              >
                <Stethoscope size={18} />
                <span>Doctors</span>
                <span className="count-pill">{doctors.length}</span>
              </button>
            </>
          )}

          {/* PATIENTS - ADMIN & RECEPTIONIST */}
          <button
            className={activeTab === 'patients' ? 'nav-item active' : 'nav-item'}
            onClick={() => { setActiveTab('patients'); setSidebarOpen(false); }}
          >
            <Users size={18} />
            <span>Patients</span>
          </button>

          {/* APPOINTMENTS - ADMIN & RECEPTIONIST */}
          <button
            className={activeTab === 'appointments' ? 'nav-item active' : 'nav-item'}
            onClick={() => { setActiveTab('appointments'); setSidebarOpen(false); }}
          >
            <Calendar size={18} />
            <span>Appointments</span>
            <span className="count-pill highlight">{appointments.length}</span>
          </button>

          {/* ENQUIRIES - ADMIN & RECEPTIONIST */}
          <button
            className={activeTab === 'enquiries' ? 'nav-item active' : 'nav-item'}
            onClick={() => { setActiveTab('enquiries'); setSidebarOpen(false); }}
          >
            <Mail size={18} />
            <span>Contact Enquiries</span>
            <span className="count-pill">{enquiries.length}</span>
          </button>

          {/* BILLING MODULE - ADMIN, ACCOUNTANT & RECEPTIONIST */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'ACCOUNTANT' || user?.role === 'RECEPTIONIST') && (
            <button
              className={activeTab === 'billing' ? 'nav-item active' : 'nav-item'}
              onClick={() => { setActiveTab('billing'); setSidebarOpen(false); }}
            >
              <CreditCard size={18} color="#38bdf8" />
              <span>Billing & Invoices</span>
            </button>
          )}

          {/* PHARMACY MODULE - REORGANIZED (ADMIN, HOSPITAL_ADMIN & PHARMACIST) */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'PHARMACIST') && (
            <>
              <div style={{ padding: '8px 20px 4px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
                Pharmacy
              </div>


              <button
                className={activeTab === 'medicine_catalog' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('medicine_catalog'); setSidebarOpen(false); }}
              >
                <Pill size={18} color="#0284c7" />
                <span>Medicine Master</span>
              </button>

              <button
                className={activeTab === 'pharmacy_categories' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('pharmacy_categories'); setSidebarOpen(false); }}
              >
                <Layers size={18} color="#0284c7" />
                <span>Categories</span>
              </button>

              <button
                className={activeTab === 'pharmacy_stock_management' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('pharmacy_stock_management'); setSidebarOpen(false); }}
              >
                <Package size={18} color="#0284c7" />
                <span>Stock Management</span>
              </button>

              <button
                className={activeTab === 'pharmacy_dispensing' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('pharmacy_dispensing'); setSidebarOpen(false); }}
              >
                <Clock size={18} color="#0284c7" />
                <span>Prescriptions Queue</span>
              </button>

              <button
                className={activeTab === 'pharmacy_expiry' ? 'nav-item active' : 'nav-item'}
                onClick={() => { setActiveTab('pharmacy_expiry'); setSidebarOpen(false); }}
              >
                <AlertTriangle size={18} color="#dc2626" />
                <span>Expiry Management</span>
              </button>

              {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN') && (
                <button
                  className={activeTab === 'pharmacy_settings' ? 'nav-item active' : 'nav-item'}
                  onClick={() => { setActiveTab('pharmacy_settings'); setSidebarOpen(false); }}
                >
                  <Settings size={18} color="#0284c7" />
                  <span>Settings</span>
                </button>
              )}
            </>
          )}

          {/* REVENUE REPORTS - ADMIN ONLY (SUPER_ADMIN & HOSPITAL_ADMIN) */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN') && (
            <button
              className={activeTab === 'revenue_reports' ? 'nav-item active' : 'nav-item'}
              onClick={() => { setActiveTab('revenue_reports'); setSidebarOpen(false); }}
            >
              <CreditCard size={18} color="#38bdf8" />
              <span>Revenue Reports</span>
            </button>
          )}

          {/* PROFILE SETTINGS - ALL ROLES */}
          <button
            className={activeTab === 'profileSettings' ? 'nav-item active' : 'nav-item'}
            onClick={() => { setActiveTab('profileSettings'); setSidebarOpen(false); }}
            style={{ marginTop: '10px' }}
          >
            <Settings size={18} color="#38bdf8" />
            <span>Profile Settings</span>
          </button>
        </nav>

        {/* SIDEBAR FOOTER USER PROFILE & LOGOUT */}
        {user && (
          <div style={{
            marginTop: 'auto',
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0070c0 0%, #00a3c8 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '14px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </span>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: '800',
                  color: user.role === 'SUPER_ADMIN' ? '#38bdf8' : '#4ade80',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {user.role}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="admin-body">
        {/* TOP BAR */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="search-box">
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search patient, doctor, department, phone..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setDocPage(1); }}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
          </div>

          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* LOGGED IN USER PROFILE & LOGOUT */}
            {user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f8fafc',
                padding: '6px 14px',
                borderRadius: '30px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0070c0 0%, #004b7a 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '13px'
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                    {user.name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: user.role === 'SUPER_ADMIN' ? '#0070c0' : '#059669',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {user.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out of Admin Panel"
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginLeft: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main className="content-container">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <DashboardOverview 
                authFetch={authFetch} 
                user={user} 
                setActiveTab={setActiveTab} 
                setSelectedDetailAppointmentId={setSelectedDetailAppointmentId}
                setShowWalkinModal={setShowWalkinModal}
                setBillingFilter={setBillingFilter}
              />
            </div>
          )}

          {/* TAB 2: DEPARTMENTS MANAGEMENT */}
          {activeTab === 'wardBeds' && <WardBedManager authFetch={authFetch} user={user} />}
          {activeTab === 'ipdAdmissions' && <IPDAdmissions authFetch={authFetch} user={user} />}
          {activeTab === 'departments' && (
            editingDepartmentId ? (
              <EditDepartmentForm
                departmentId={editingDepartmentId}
                initialTab={deptEditorTab}
                onCancel={() => setEditingDepartmentId(null)}
                onSaveSuccess={() => { setEditingDepartmentId(null); fetchData(); }}
              />
            ) : (
              <div className="tab-pane">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h1>Department Management</h1>
                    <p>Manage hospital clinical departments, descriptions, and doctor assignments</p>
                  </div>
                  <button
                    onClick={handleAddNewDepartment}
                    style={{
                      background: '#00a3c8',
                      color: '#fff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '30px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(0,163,200,0.3)'
                    }}
                  >
                    <Plus size={18} /> Add New Department
                  </button>
                </div>

                {/* FILTER TABS: ALL / PUBLISHED / DRAFTS */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setDeptFilterTab('all')}
                    style={{
                      background: deptFilterTab === 'all' ? '#0284c7' : '#fff',
                      color: deptFilterTab === 'all' ? '#fff' : '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '8px 18px',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    All ({departments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeptFilterTab('published')}
                    style={{
                      background: deptFilterTab === 'published' ? '#16a34a' : '#fff',
                      color: deptFilterTab === 'published' ? '#fff' : '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '8px 18px',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    🟢 Published ({departments.filter(d => d.publish_status === 'published').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeptFilterTab('draft')}
                    style={{
                      background: deptFilterTab === 'draft' ? '#d97706' : '#fff',
                      color: deptFilterTab === 'draft' ? '#fff' : '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '8px 18px',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    📝 Drafts ({departments.filter(d => d.publish_status === 'draft' || !d.publish_status).length})
                  </button>
                </div>

                <div className="card-panel">
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Department Name</th>
                          <th>Slug</th>
                          <th>Status</th>
                          <th>Live Doctors</th>
                          <th>Short Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDepartments.map((dept) => (
                          <tr key={dept.id}>
                            <td><span className="id-badge">#{dept.id}</span></td>
                            <td><strong className="doc-name">{dept.name}</strong></td>
                            <td><code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#0284c7' }}>{dept.slug}</code></td>
                            <td>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '800',
                                background: dept.publish_status === 'published' ? '#f0fdf4' : '#fffbe0',
                                color: dept.publish_status === 'published' ? '#16a34a' : '#b45309',
                                border: dept.publish_status === 'published' ? '1px solid #bbf7d0' : '1px solid #fef08a'
                              }}>
                                {dept.publish_status === 'published' ? '● Published' : '○ Draft'}
                              </span>
                            </td>
                            <td>
                              <span className="dept-tag" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                {dept.doctor_count || 0} Doctors
                              </span>
                            </td>
                            <td className="text-muted" style={{ maxWidth: '300px' }}>{dept.short_description}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => setEditingDepartmentId(dept.id)}
                                  style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Edit size={14} /> Edit CMS
                                </button>
                                <button
                                  onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                  style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB: OUTSOURCED SERVICES */}
          {activeTab === 'outsourcedServices' && <OutsourcedServicesManager />}

          {/* TAB: FACILITY SERVICES */}
          {activeTab === 'facilityServices' && <FacilityServicesManager />}

          {/* TAB: INFRASTRUCTURE SERVICES */}
          {activeTab === 'infrastructureServices' && <InfrastructureServicesManager />}

          {/* TAB: ACCREDITATIONS & QUALITY */}
          {activeTab === 'accreditations' && <AccreditationsManager />}

          {/* TAB 3: DOCTORS WITH IMAGE PREVIEWS */}
          {activeTab === 'doctors' && (
            <div className="tab-pane">
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h1>Doctor Directory</h1>
                  <p>Managing {doctors.length} qualified specialists and physicians across departments</p>
                </div>
                <button
                  onClick={() => handleOpenDocModal()}
                  style={{
                    background: '#00a3c8',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '30px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,163,200,0.3)'
                  }}
                >
                  <Plus size={18} /> Add Doctor to Department
                </button>
              </div>

              <div className="card-panel">
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Photo</th>
                        <th>Doctor Name</th>
                        <th>Department Specialty</th>
                        <th>Qualifications / Degrees</th>
                        <th>Gender</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPaginatedDoctors.map((doc) => (
                        <tr key={doc.id}>
                          <td><span className="id-badge">#{doc.id}</span></td>
                          <td>
                            <img
                              src={getDoctorDisplayImg(doc)}
                              alt={doc.name}
                              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                            />
                          </td>
                          <td><strong className="doc-name">{doc.name}</strong></td>
                          <td><span className="dept-tag">{doc.specialty}</span></td>
                          <td className="text-muted">{doc.consults}</td>
                          <td>
                            <span className={`gender-tag ${doc.gender}`}>
                              {doc.gender === 'female' ? 'Female' : 'Male'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleOpenDocModal(doc)}
                                style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Edit size={14} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                                style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Trash2 size={14} /> Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* DOCTORS PAGINATION FOOTER */}
                {totalDocPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Showing <strong>{indexOfFirstDoc + 1}</strong> to <strong>{Math.min(indexOfLastDoc, filteredDoctors.length)}</strong> of <strong>{filteredDoctors.length}</strong> doctors
                    </span>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => setDocPage(prev => Math.max(prev - 1, 1))}
                        disabled={docPage === 1}
                        style={{
                          background: docPage === 1 ? '#f1f5f9' : '#00a3c8',
                          color: docPage === 1 ? '#94a3b8' : '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: docPage === 1 ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>

                      {Array.from({ length: totalDocPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setDocPage(p)}
                          style={{
                            background: docPage === p ? '#004861' : '#fff',
                            color: docPage === p ? '#fff' : '#0f172a',
                            border: '1px solid #cbd5e1',
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '13px'
                          }}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        onClick={() => setDocPage(prev => Math.min(prev + 1, totalDocPages))}
                        disabled={docPage === totalDocPages}
                        style={{
                          background: docPage === totalDocPages ? '#f1f5f9' : '#00a3c8',
                          color: docPage === totalDocPages ? '#94a3b8' : '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: docPage === totalDocPages ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div className="tab-pane">
              <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h1>Patient Appointments</h1>
                  <p>Total {appointments.length} appointment records in Neon Cloud PostgreSQL</p>
                </div>
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'RECEPTIONIST') && (
                  <button
                    type="button"
                    onClick={() => setShowWalkinModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #0070c0 0%, #004861 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(0, 112, 192, 0.3)'
                    }}
                  >
                    <Plus size={16} /> + New Appointment (Walk-in)
                  </button>
                )}
              </div>

              {/* MULTI-FILTER CONTROL BAR */}
              <div className="card-panel" style={{ marginBottom: '20px', padding: '16px 20px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'center' }}>
                  {/* Status Filter */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Filter Status</label>
                    <select
                      value={appStatusFilter}
                      onChange={(e) => setAppStatusFilter(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="RESCHEDULED">RESCHEDULED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="NO_SHOW">NO_SHOW</option>
                    </select>
                  </div>

                  {/* Doctor Filter */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Filter Doctor</label>
                    <select
                      value={appDoctorFilter}
                      onChange={(e) => setAppDoctorFilter(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    >
                      <option value="all">All Doctors</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Filter Department</label>
                    <select
                      value={appDepartmentFilter}
                      onChange={(e) => setAppDepartmentFilter(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    >
                      <option value="all">All Departments</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>From Date</label>
                    <input
                      type="date"
                      value={appStartDate}
                      onChange={(e) => setAppStartDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>To Date</label>
                    <input
                      type="date"
                      value={appEndDate}
                      onChange={(e) => setAppEndDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                  </div>

                  {/* Clear Filters Button */}
                  <div style={{ paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setAppStatusFilter('all');
                        setAppDoctorFilter('all');
                        setAppDepartmentFilter('all');
                        setAppStartDate('');
                        setAppEndDate('');
                        setSearchQuery('');
                      }}
                      style={{ width: '100%', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-panel">
                {filteredAppointments.length === 0 ? (
                  <div className="empty-state">
                    <Calendar size={48} color="#cbd5e1" />
                    <p>No matching appointment records found.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Token #</th>
                          <th>Patient Name</th>
                          <th>Doctor Assigned</th>
                          <th>Phone</th>
                          <th>Department</th>
                          <th>Appointment Date</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((app) => (
                          <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDetailAppointmentId(app.id)}>
                            <td><span className="id-badge">#{app.appointment_id || app.id}</span></td>
                            <td>
                              <span style={{ background: app.token_number ? '#38bdf8' : '#f1f5f9', color: app.token_number ? '#0f172a' : '#94a3b8', padding: '3px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '800' }}>
                                {app.token_number ? `Token #${app.token_number}` : '-'}
                              </span>
                            </td>
                            <td>
                              <strong className="patient-name">{app.patient_name}</strong>
                              <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>{app.email || '-'}</span>
                            </td>
                            <td>
                              <strong>{app.doctor_name || 'Assigned Specialist'}</strong>
                              {app.is_doctor_on_leave && (
                                <span style={{ display: 'inline-block', marginLeft: '6px', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800' }}>
                                  ⚠️ Doctor On Leave
                                </span>
                              )}
                              {app.slot_patient_count > 0 && !app.is_doctor_on_leave && (
                                <span style={{ display: 'inline-block', marginLeft: '6px', background: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800' }}>
                                  ℹ️ {app.slot_patient_count} in slot
                                </span>
                              )}
                            </td>
                            <td><strong className="phone-text">{app.phone || app.mobile}</strong></td>
                            <td><span className="dept-tag">{app.department_name || app.department}</span></td>
                            <td>{new Date(app.appointment_date || app.preferred_date).toLocaleDateString()}</td>
                            <td>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: '800',
                                background: (app.status && app.status.toLowerCase().includes('confirm')) ? '#dcfce7' : ((app.status && app.status.toLowerCase().includes('complete')) ? '#e0f2fe' : (app.status && app.status.toLowerCase().includes('cancel') ? '#fef2f2' : '#fef3c7')),
                                color: (app.status && app.status.toLowerCase().includes('confirm')) ? '#15803d' : ((app.status && app.status.toLowerCase().includes('complete')) ? '#0369a1' : (app.status && app.status.toLowerCase().includes('cancel') ? '#dc2626' : '#b45309'))
                              }}>
                                {app.status || 'PENDING'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailAppointmentId(app.id)}
                                  style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                  Details / Timeline
                                </button>
                                {(!app.status || app.status.toLowerCase().includes('pending')) && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAppointmentStatus(app.id, 'Confirmed')}
                                      style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAppointmentStatus(app.id, 'Cancelled')}
                                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}

                                {(app.status && app.status.toLowerCase().includes('confirm') && !app.status.toLowerCase().includes('pending')) && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateAppointmentStatus(app.id, 'Cancelled')}
                                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ENQUIRIES */}
          {activeTab === 'enquiries' && (
            <div className="tab-pane">
              <div className="page-header">
                <div>
                  <h1>Contact Form Enquiries</h1>
                  <p>Managing {enquiries.length} customer messages from the website</p>
                </div>
              </div>

              <div className="card-panel">
                {filteredEnquiries.length === 0 ? (
                  <div className="empty-state">
                    <Mail size={48} color="#cbd5e1" />
                    <p>No matching enquiry messages found.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Sender Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Message Content</th>
                          <th>Date Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnquiries.map((enq) => (
                          <tr key={enq.id}>
                            <td><span className="id-badge">#{enq.id}</span></td>
                            <td><strong className="patient-name">{enq.name}</strong></td>
                            <td className="text-muted">{enq.email || '-'}</td>
                            <td><strong>{enq.phone || '-'}</strong></td>
                            <td className="msg-cell">{enq.message}</td>
                            <td className="text-muted">{new Date(enq.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: PATIENTS */}
          {activeTab === 'patients' && (
            <div className="tab-pane">
              <PatientsManager />
            </div>
          )}

          {/* TAB: BILLING */}
          {activeTab === 'billing' && (
            <div className="tab-pane">
              <BillingModule authFetch={authFetch} user={user} defaultStatusFilter={billingFilter} />
            </div>
          )}

          {/* TAB: PHARMACY DISPENSING */}
          {activeTab === 'pharmacy_dispensing' && (
            <div className="tab-pane">
              <PharmacyDispensing authFetch={authFetch} user={user} />
            </div>
          )}

          {/* TAB: MEDICINE CATALOG */}
          {activeTab === 'medicine_catalog' && (
            <div className="tab-pane">
              <MedicineCatalog authFetch={authFetch} user={user} />
            </div>
          )}


          {/* TAB: PHARMACY CATEGORIES */}
          {activeTab === 'pharmacy_categories' && (
            <div className="tab-pane">
              <PharmacyCategories authFetch={authFetch} user={user} />
            </div>
          )}

          {/* TAB: PHARMACY EXPIRY */}
          {activeTab === 'pharmacy_expiry' && (
            <div className="tab-pane">
              <PharmacyExpiry authFetch={authFetch} user={user} />
            </div>
          )}

          {/* TAB: PHARMACY SETTINGS */}
          {activeTab === 'pharmacy_settings' && (
            <div className="tab-pane">
              <PharmacySettings authFetch={authFetch} user={user} />
            </div>
          )}

          {/* TAB: PHARMACY STOCK MANAGEMENT */}
          {activeTab === 'pharmacy_stock_management' && (
            <div className="tab-pane">
              <PharmacyStockManagement authFetch={authFetch} user={user} />
            </div>
          )}

          {/* TAB: REVENUE REPORTS */}
          {activeTab === 'revenue_reports' && (
            <div className="tab-pane">
              <RevenueReports authFetch={authFetch} user={user} />
            </div>
          )}

          {/* TAB: PROFILE SETTINGS */}
          {activeTab === 'profileSettings' && (
            <div className="tab-pane">
              <ProfileSettings />
            </div>
          )}
        </main>
      </div>



      {/* DOCTOR MODAL WITH IMAGE UPLOAD OPTION */}
      {showDocModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '560px', borderRadius: '20px', padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a3a6e' }}>Add Doctor to Department</h2>
              <button onClick={() => { setShowDocModal(false); handleRemoveImage(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
            </div>

            <form onSubmit={handleSaveDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* DOCTOR IMAGE UPLOAD FIELD */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '6px', display: 'block' }}>
                  Doctor Photo (Upload Image File or Provide URL)
                </label>
                
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '14px', padding: '16px', textAlign: 'center', backgroundColor: '#f8fafc', position: 'relative' }}>
                  {previewUrl || docForm.image_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center' }}>
                      <img 
                        src={previewUrl || (docForm.image_url.startsWith('http') ? docForm.image_url : `${SERVER_URL}${docForm.image_url}`)} 
                        alt="Doctor Preview" 
                        style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00a3c8' }} 
                      />
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'block' }}>Photo Selected</span>
                        <button 
                          type="button" 
                          onClick={handleRemoveImage}
                          style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', marginTop: '4px' }}
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} color="#00a3c8" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                        Click to select doctor image file (JPG, PNG, WEBP)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      />
                    </div>
                  )}
                </div>

                {/* OR IMAGE URL INPUT */}
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Or paste external image URL (http://...)"
                    value={docForm.image_url}
                    onChange={(e) => setDocForm({ ...docForm, image_url: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DR. VIJAYAPRABHU"
                  value={docForm.name}
                  onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Assign to Department *</label>
                <select
                  value={docForm.specialty}
                  onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff' }}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Qualifications / Degrees</label>
                <input
                  type="text"
                  placeholder="e.g. MBBS, DLO, MS (ENT Surgeon)"
                  value={docForm.consults}
                  onChange={(e) => setDocForm({ ...docForm, consults: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Gender</label>
                <select
                  value={docForm.gender}
                  onChange={(e) => setDocForm({ ...docForm, gender: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 12"
                    value={docForm.experience_years}
                    onChange={(e) => setDocForm({ ...docForm, experience_years: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Consultation Fee (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. 500"
                    value={docForm.consultation_fee}
                    onChange={(e) => setDocForm({ ...docForm, consultation_fee: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Availability / Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. Mon - Sat (9 AM - 4 PM)"
                  value={docForm.availability}
                  onChange={(e) => setDocForm({ ...docForm, availability: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Spoken Languages</label>
                <input
                  type="text"
                  placeholder="e.g. English, Tamil, Hindi"
                  value={docForm.languages}
                  onChange={(e) => setDocForm({ ...docForm, languages: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              {editingDoctorId && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a3a6e', marginBottom: '10px' }}>Login Access</h3>
                  
                  {docForm.user_id || docForm.login_email ? (
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>Active Login Account:</span>
                        <strong style={{ fontSize: '14px', color: '#14532d', display: 'block', marginTop: '2px' }}>{docForm.login_email}</strong>
                      </div>
                      <button 
                        type="button" 
                        disabled 
                        style={{ background: '#f1f5f9', color: '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'not-allowed' }}
                        title="Reset password endpoint not yet implemented"
                      >
                        Reset Password
                      </button>
                    </div>
                  ) : (
                    <div>
                      {createdCredentials ? (
                        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>🎉 Login Created Successfully!</span>
                          <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#1e40af', lineHeight: '1.4' }}>
                            Please share these credentials with the doctor securely. The temporary password will not be shown again.
                          </p>
                          <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#1e3a8a', backgroundColor: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                            <strong>Email:</strong> {createdCredentials.email}<br/>
                            <strong>Password:</strong> {createdCredentials.password}
                          </div>
                        </div>
                      ) : (
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                            This doctor profile does not have a linked login account. Create one below to grant dashboard access.
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>Email Address</label>
                              <input 
                                type="email" 
                                placeholder="doctor@gjshospital.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'block' }}>Temporary Password</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                  type="text" 
                                  placeholder="Enter secure password"
                                  value={loginPassword}
                                  onChange={(e) => setLoginPassword(e.target.value)}
                                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                                    let randPass = '';
                                    for (let i = 0; i < 12; i++) {
                                      randPass += chars.charAt(Math.floor(Math.random() * chars.length));
                                    }
                                    setLoginPassword(randPass);
                                  }}
                                  style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Generate
                                </button>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={async () => {
                                if (!loginEmail || !loginPassword) {
                                  return alert('Both email and password are required to create login access!');
                                }
                                try {
                                  const res = await authFetch(`${API_BASE_URL}/doctors/${editingDoctorId}/create-login`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email: loginEmail, password: loginPassword })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setCreatedCredentials({ email: loginEmail, password: loginPassword });
                                    setDocForm(prev => ({ ...prev, user_id: 9999, login_email: loginEmail }));
                                    setLoginEmail('');
                                    setLoginPassword('');
                                    fetchData();
                                  } else {
                                    alert(data.error || 'Failed to create login.');
                                  }
                                } catch (err) {
                                  console.error('Error creating login:', err);
                                  alert('Error creating login account.');
                                }
                              }}
                              style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' }}
                            >
                              Create Login Account
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => { setShowDocModal(false); handleRemoveImage(); }} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={uploadingImage} style={{ background: '#00a3c8', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                  {uploadingImage ? 'Uploading & Saving...' : (editingDoctorId ? 'Save Doctor' : 'Add Doctor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* WALKIN APPOINTMENT MODAL */}
      <WalkinAppointmentModal
        isOpen={showWalkinModal}
        onClose={() => setShowWalkinModal(false)}
        onSuccess={(msg) => {
          fetchData();
        }}
        doctors={doctors}
        departments={departments}
      />

      {/* APPOINTMENT DETAIL & TIMELINE MODAL */}
      <AppointmentDetailModal
        isOpen={!!selectedDetailAppointmentId}
        appointmentId={selectedDetailAppointmentId}
        onClose={() => setSelectedDetailAppointmentId(null)}
        onRefresh={() => {
          fetchData();
        }}
      />

    </div>
  );
}

function MainApp() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  if (user.role === 'DOCTOR') {
    return <DoctorDashboard />;
  }

  return <AdminPanel />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
