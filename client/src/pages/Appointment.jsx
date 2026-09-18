import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import appBanner from '../assets/app-DrAuNeyQ.jpg';
import doctor1Img from '../assets/doctor1-BhGXf4qn.png';
import { 
  Search, ListChecks, Calendar, Plus, Clock, ArrowRight, 
  Mail, Phone, MapPin, Upload, CheckCircle2, ShieldCheck, 
  FileText, X, User, Sparkles, Stethoscope, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createAppointment, uploadReport } from '../services/appointmentService';
import { getDepartments } from '../services/departmentService';
import { getDoctors } from '../services/doctorService';

const Appointment = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    age: '',
    gender: 'male',
    departmentId: '',
    departmentName: '',
    doctorId: '',
    doctorName: '',
    preferredDate: '',
    preferredTime: '09:00 AM - 12:00 PM',
    reason: ''
  });

  const [departments, setDepartments] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploadingReport, setUploadingReport] = useState(false);
  const [uploadedReportUrl, setUploadedReportUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  // Today's date YYYY-MM-DD to disable past dates
  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const depRes = await getDepartments();
        if (depRes.success) setDepartments(depRes.data || []);

        const docRes = await getDoctors();
        if (docRes.success) setDoctorsList(docRes.data || []);
      } catch (err) {
        console.log('Error loading dropdown data:', err);
      }
    };
    fetchDropdownData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'departmentId') {
      const selectedDep = departments.find(d => String(d.id) === String(value));
      if (selectedDep) setFormData(prev => ({ ...prev, departmentId: value, departmentName: selectedDep.name }));
    }

    if (name === 'doctorId') {
      const selectedDoc = doctorsList.find(d => String(d.id) === String(value));
      if (selectedDoc) setFormData(prev => ({ ...prev, doctorId: value, doctorName: selectedDoc.name }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const data = new FormData();
    data.append('reportFile', file);

    setUploadingReport(true);
    try {
      const uploadRes = await uploadReport(data);
      if (uploadRes && uploadRes.success) {
        setUploadedReportUrl(uploadRes.fileUrl);
        toast.success(`Medical report "${file.name}" uploaded successfully!`);
      } else {
        toast.error('File upload failed. You can still submit the form without attachment.');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      toast.error('File upload failed. Proceeding without attachment.');
    } finally {
      setUploadingReport(false);
    }
  };

  const removeAttachedFile = () => {
    setSelectedFileName('');
    setUploadedReportUrl('');
    toast.success('File attachment removed.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobile || !formData.preferredDate) {
      toast.error('Full Name, Mobile Number, and Preferred Date are required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        reportFile: uploadedReportUrl
      };

      const response = await createAppointment(payload);

      if (response && response.success) {
        toast.success('Appointment submitted successfully!');
        setConfirmationData({
          appointmentId: response.appointmentId || 'GJS-2026-8942',
          message: response.message,
          status: response.status || 'Pending Confirmation',
          tokenNumber: response.tokenNumber,
          instructions: response.instructions,
          patientName: formData.fullName,
          date: formData.preferredDate,
          time: formData.preferredTime
        });
      } else {
        toast.error(response?.message || 'Appointment submission failed.');
      }
    } catch (err) {
      console.error('Error submitting appointment:', err);
      toast.error('Appointment submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ backgroundColor: '#f8fafc' }}>
      {/* 1. HERO BANNER */}
      <section className="appfirstdiv" style={{ backgroundImage: `url(${appBanner})` }}>
        <h1>Book Appointment</h1>
        <h2><Link to="/" style={{ color: '#007cb9', marginRight: '10px', textDecoration: 'none' }}>Home</Link> / Appointment</h2>
      </section>

      {/* 2. FORM & INFO SECTION */}
      <section className="appointment-section container" style={{ padding: '60px 20px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* LEFT FORM CARD */}
        <div className="appointment-form" style={{ flex: 1 }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '40px 35px', boxShadow: '0 20px 40px rgba(0,72,97,0.06)', border: '1px solid #e2e8f0' }}>
            
            {confirmationData ? (
              /* CONFIRMATION SCREEN */
              <div style={{ padding: '10px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle2 size={44} color="#00a3c8" />
                </div>
                <h2 style={{ fontSize: '26px', color: '#004861', marginBottom: '8px', fontWeight: '800' }}>Request Submitted Successfully!</h2>
                <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '500px', margin: '0 auto 25px', lineHeight: '1.6' }}>
                  {confirmationData.message}
                </p>

                <div style={{ background: 'linear-gradient(135deg, #004861 0%, #00a3c8 100%)', color: '#fff', padding: '25px', borderRadius: '20px', margin: '25px 0', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,163,200,0.25)' }}>
                  <span style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.9, fontWeight: '700' }}>YOUR TRACKING APPOINTMENT ID</span>
                  <h1 style={{ fontSize: '32px', letterSpacing: '2px', margin: '8px 0', color: '#fff', fontWeight: '800' }}>
                    {confirmationData.appointmentId}
                  </h1>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                    Status: {confirmationData.status}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', textAlign: 'left', marginBottom: '30px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <small style={{ color: '#64748b', fontWeight: '600' }}>PATIENT NAME</small>
                      <p style={{ margin: '2px 0 0', fontWeight: '700', color: '#0f172a' }}>{confirmationData.patientName}</p>
                    </div>
                    <div>
                      <small style={{ color: '#64748b', fontWeight: '600' }}>DATE & TIME</small>
                      <p style={{ margin: '2px 0 0', fontWeight: '700', color: '#00a3c8' }}>{new Date(confirmationData.date).toLocaleDateString()} | {confirmationData.time}</p>
                    </div>
                    <div>
                      <small style={{ color: '#64748b', fontWeight: '600' }}>TOKEN ASSIGNED</small>
                      <p style={{ margin: '2px 0 0', fontWeight: '800', color: '#004861' }}>{confirmationData.tokenNumber}</p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                    <strong>Hospital Note:</strong> {confirmationData.instructions}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/check-status" style={{ background: '#004861', color: '#fff', padding: '14px 28px', borderRadius: '30px', fontWeight: '700', textDecoration: 'none', fontSize: '15px' }}>
                    Track Status Live →
                  </Link>
                  <button
                    onClick={() => setConfirmationData(null)}
                    style={{ background: '#f1f5f9', color: '#0f172a', border: 'none', padding: '14px 28px', borderRadius: '30px', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}
                  >
                    Book Another Appointment
                  </button>
                </div>
              </div>
            ) : (
              /* APPOINTMENT FORM */
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '30px' }}>
                  <span style={{ color: '#00a3c8', fontWeight: '700', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} /> QUICK ONLINE CONSULTATION BOOKING
                  </span>
                  <h2 style={{ fontSize: '26px', color: '#004861', margin: '6px 0 0', fontWeight: '800' }}>Book Medical Consultation</h2>
                </div>

                {/* STEP 1: PATIENT INFORMATION */}
                <div style={{ marginBottom: '25px' }}>
                  <h4 style={{ fontSize: '15px', color: '#004861', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', background: '#00a3c8', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
                    Patient Details
                  </h4>

                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Patient Full Name *"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <input
                      type="tel"
                      name="mobile"
                      placeholder="Mobile Number *"
                      required
                      value={formData.mobile}
                      onChange={handleChange}
                      style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                    />
                    <input
                      type="number"
                      name="age"
                      placeholder="Age (Years)"
                      value={formData.age}
                      onChange={handleChange}
                      style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address (Optional)"
                      value={formData.email}
                      onChange={handleChange}
                      style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                    />
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff' }}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* STEP 2: DEPARTMENT & DOCTOR */}
                <div style={{ marginBottom: '25px' }}>
                  <h4 style={{ fontSize: '15px', color: '#004861', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', background: '#00a3c8', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
                    Select Specialty & Specialist
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff' }}
                    >
                      <option value="">Select Department / Specialty</option>
                      {departments.map((dep) => (
                        <option key={dep.id} value={dep.id}>{dep.name}</option>
                      ))}
                    </select>

                    <select
                      name="doctorId"
                      value={formData.doctorId}
                      onChange={handleChange}
                      style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff' }}
                    >
                      <option value="">Preferred Doctor (Optional)</option>
                      {doctorsList.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* STEP 3: PREFERRED DATE & TIME */}
                <div style={{ marginBottom: '25px' }}>
                  <h4 style={{ fontSize: '15px', color: '#004861', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', background: '#00a3c8', color: '#fff', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
                    Preferred Slot & Symptoms
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <input
                      type="date"
                      name="preferredDate"
                      min={todayDate}
                      required
                      value={formData.preferredDate}
                      onChange={handleChange}
                      style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                    />
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff' }}
                    >
                      <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM</option>
                      <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM</option>
                      <option value="06:00 PM - 08:30 PM">06:00 PM - 08:30 PM</option>
                    </select>
                  </div>

                  <textarea
                    name="reason"
                    placeholder="Describe your medical reason or symptoms..."
                    value={formData.reason}
                    onChange={handleChange}
                    rows="3"
                    style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                  ></textarea>
                </div>

                {/* TRENDING ATTACH MEDICAL REPORT BOX */}
                <div style={{ marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '2px dashed #00a3c8', textAlign: 'center', position: 'relative' }}>
                  <Upload size={28} color="#00a3c8" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '15px', color: '#004861', margin: '0 0 4px', fontWeight: '700' }}>Attach Medical Report / Prescription (Optional)</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px' }}>Supported formats: PDF, JPG, PNG (Max 10MB)</p>

                  {selectedFileName ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#e0f2fe', color: '#0369a1', padding: '8px 16px', borderRadius: '20px', fontWeight: '600', fontSize: '13px' }}>
                      <FileText size={16} />
                      <span>{selectedFileName}</span>
                      {uploadingReport ? (
                        <span style={{ fontSize: '12px', color: '#0284c7' }}>(Uploading...)</span>
                      ) : (
                        <button type="button" onClick={removeAttachedFile} style={{ background: 'transparent', border: 'none', color: '#0369a1', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <label style={{ display: 'inline-block', background: '#00a3c8', color: '#fff', padding: '10px 24px', borderRadius: '20px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                      Choose File
                      <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                    </label>
                  )}

                  {uploadedReportUrl && (
                    <div style={{ marginTop: '10px', color: '#16a34a', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} /> Report uploaded & attached successfully!
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ width: '100%', background: '#00a3c8', color: '#fff', border: 'none', padding: '16px', borderRadius: '30px', fontSize: '17px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,163,200,0.3)', transition: 'background 0.3s' }}
                >
                  {loading ? 'Submitting Request...' : 'Make Appointment'}
                </button>
              </form>
            )}

          </div>
        </div>

        {/* RIGHT INFO BOX */}
        <div className="appointment-info" style={{ flex: '0 0 380px' }}>
          <div className="info-box">
            <h4>Booking Now</h4>
            <h2>Make An Appointment</h2>

            <p>
              <strong style={{ color: '#00a3c8' }}>G.J.S Multispeciality Hospital </strong>
              — your trusted healthcare partner. We ensure safe, expert care across multiple specialties. Book a consultation with our experienced doctors today.
            </p>

            <div className="hours hours3">
              <h4>Opening Hours</h4>
              <ul>
                <li>
                  SunDay - Saturday{' '}
                  <span>
                    <Clock className="hourslii" size={18} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 5px' }} />
                    24 Hours a Day <ArrowRight className="hourslii" size={16} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 5px' }} />
                    7 Days a Week
                  </span>
                </li>
              </ul>
            </div>

            <div className="support">
              <p>
                We care for your health with dedication and expertise. Visit us anytime — we're open round the clock for your convenience.
              </p>

              <div className="contactpage-info">
                <div className="pageinfo">
                  <Mail className="hourslii" size={28} />
                  <div>
                    <strong style={{ color: '#004861' }}>Email Address</strong>
                    <br />
                    info@gjshospitals.com
                  </div>
                </div>

                <div className="pageinfo">
                  <Phone className="hourslii" size={28} />
                  <div>
                    <strong style={{ color: '#004861' }}>Phone Number</strong>
                    <br />
                    +91 72004 80576
                    <br />
                    +91 72004 90574
                  </div>
                </div>

                <div className="pageinfo">
                  <MapPin className="hourslii" size={28} />
                  <div>
                    <strong style={{ color: '#004861' }}>Address</strong>
                    <br />
                    25/2, Kamarajar Nagar, Karumari Amman Kovil Road, Avadi, Chennai - 600 071
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EASY STEPS TO BOOKING SECTION */}
      <div className="booking-row container" style={{ padding: '60px 20px', maxWidth: '1200px', margin: 'auto' }}>
        <div className="booking-image">
          <img src={doctor1Img} alt="doctor with child" style={{ width: '100%', borderRadius: '20px' }} />
        </div>
        <div className="booking-content">
          <small>Online Appointment</small>
          <h2 style={{ color: '#004861' }}>Easy Steps to Booking</h2>
          <p>
            Welcome to G.J.S Multispeciality Hospital, where we provide trusted medical care across multiple specialties in a hospital-based setting. Book your consultation in just a few simple steps.
          </p>

          <div className="step">
            <Search className="stepi" size={32} color="#00a3c8" />
            <div>
              <h4 style={{ color: '#004861' }}>Locate Our Hospital</h4>
              <p className="step-desc">
                Find G.J.S Multispeciality Hospital easily at our accessible city location for comprehensive healthcare services.
              </p>
            </div>
          </div>

          <div className="step">
            <ListChecks className="stepi" size={32} color="#00a3c8" />
            <div>
              <h4 style={{ color: '#004861' }}>Choose Medical Service</h4>
              <p className="step-desc">
                Select from a wide range of specialties including General Medicine, Surgery, Cardiology, Orthopedics, and more.
              </p>
            </div>
          </div>

          <div className="step">
            <Calendar className="stepi" size={32} color="#00a3c8" />
            <div>
              <h4 style={{ color: '#004861' }}>Book Appointment</h4>
              <p className="step-desc">
                Schedule your appointment effortlessly with our expert doctors and specialist teams.
              </p>
            </div>
          </div>

          <div className="step">
            <Plus className="stepi" size={32} color="#00a3c8" />
            <div>
              <h4 style={{ color: '#004861' }}>Visit Our Hospital</h4>
              <p className="step-desc">
                Arrive at G.J.S Multispeciality Hospital for compassionate, expert care and advanced treatment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Appointment;
