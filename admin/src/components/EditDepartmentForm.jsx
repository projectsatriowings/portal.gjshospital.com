import React, { useState, useEffect } from 'react';
import IconPicker from './IconPicker';
import RepeatableFieldList from './RepeatableFieldList';
import ImageUploader from './ImageUploader';
import { useAuth } from '../context/AuthContext';

import {
  Info,
  Image as ImageIcon,
  BookOpen,
  BarChart3,
  Stethoscope,
  Building,
  Users,
  Award,
  HelpCircle,
  Megaphone,
  Globe,
  Send,
  Eye,
  Save,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  PhoneCall,
  Calendar,
  Heart,
  ChevronRight,
  Star
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const EditDepartmentForm = ({ departmentId, initialTab = 'basic', onCancel, onSaveSuccess }) => {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allDoctors, setAllDoctors] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // 12-TAB FORM STATE SCHEMA WITH SAFE DEFAULTS
  const [formData, setFormData] = useState({
    basic: {
      name: '',
      slug: '',
      short_description: '',
      full_description: '',
      icon: 'HeartPulse',
      color_theme: 'blue',
      status: 'active'
    },
    hero: {
      badge_text: 'EXCELLENCE IN CLINICAL CARE',
      small_title: 'Advanced Care',
      main_title: 'Clinical Department',
      description: 'Advanced healthcare & precision clinical services for a healthier life.',
      banner_image_url: '',
      mobile_image_url: '',
      primary_button_text: 'Book Appointment',
      primary_button_link: '/appointment',
      secondary_button_text: 'Call Now',
      secondary_button_link: 'tel:+919876543210',
      overlay_style: 'gradient-blue'
    },
    overview: {
      image_url: '',
      badge_text: 'Top Ranked Clinical Department',
      eyebrow: 'DEPARTMENT OVERVIEW',
      heading: 'World-Class Care',
      description: 'Our department offers comprehensive care with a team of highly experienced specialists and state-of-the-art technology.',
      clinical_services: [],
      vision_icon: 'Target',
      vision_title: 'Our Vision',
      vision_desc: 'To be a globally recognized center of clinical excellence.',
      mission_icon: 'Compass',
      mission_title: 'Our Mission',
      mission_desc: 'To deliver affordable, evidence-based treatments with zero compromise on safety.'
    },
    stats: {
      show_stats: true,
      items: []
    },
    treatments: {
      eyebrow: 'SPECIALIZED PROCEDURES',
      title: 'Treatments & Procedures',
      subtitle: 'Comprehensive clinical interventions offered under this department.',
      items: []
    },
    facilities: {
      eyebrow: 'INFRASTRUCTURE & MEDICAL TECH',
      title: 'Facilities & Advanced Technology',
      subtitle: 'Equipped with world-class medical equipment to support precision treatment.',
      items: []
    },
    doctors: {
      assigned_ids: []
    },
    why_choose_us: {
      eyebrow: 'WHY CHOOSE US',
      title: 'Why Choose Our Department?',
      subtitle: 'We blend clinical expertise with cutting-edge technology for superior patient outcomes.',
      items: []
    },
    faqs: {
      items: []
    },
    cta: {
      badge_text: '24/7 PATIENT APPOINTMENTS AVAILABLE',
      heading: 'Need Expert Medical Care?',
      primary_button_text: 'Book Appointment',
      primary_button_link: '/appointment',
      secondary_button_text: 'Call Emergency',
      secondary_button_link: 'tel:+919876543210',
      gradient_style: 'navy-blue'
    },
    seo: {
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      og_image_url: '',
      canonical_url: ''
    }
  });

  // FETCH EXISTING DEPARTMENT DATA WITH ROBUST NORMALIZATION
  useEffect(() => {
    const fetchAdminDept = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`${API_BASE_URL}/departments/admin/${departmentId}`);
        const data = await res.json();
        if (data.success && data.data) {
          const d = data.data;
          setAllDoctors(d.all_doctors || []);
          const assignedDocIds = (d.assigned_doctors || []).map(doc => doc.id);

          // 1. Normalize Treatments Array/Object
          let treatmentsItems = [];
          if (Array.isArray(d.treatments)) {
            treatmentsItems = d.treatments.map(t => ({
              icon: t.icon || 'Zap',
              title: typeof t === 'string' ? t : (t.title || 'Treatment'),
              description: typeof t === 'string' ? 'Clinical procedure.' : (t.desc || t.description || 'Procedure details...'),
              link: '/appointment'
            }));
          } else if (d.treatments && Array.isArray(d.treatments.items)) {
            treatmentsItems = d.treatments.items;
          }

          // 2. Normalize Facilities Array/Object
          let facilitiesItems = [];
          if (Array.isArray(d.facilities)) {
            facilitiesItems = d.facilities.map(f => ({
              icon: f.icon || 'Cpu',
              name: typeof f === 'string' ? f : (f.name || 'Facility'),
              description: typeof f === 'string' ? 'Facility details.' : (f.desc || f.description || 'Facility details...')
            }));
          } else if (d.facilities && Array.isArray(d.facilities.items)) {
            facilitiesItems = d.facilities.items;
          }

          // 3. Normalize Why Choose Us Array/Object
          let whyChooseItems = [];
          if (Array.isArray(d.why_choose)) {
            whyChooseItems = d.why_choose.map(w => ({
              icon: w.icon || 'UserCheck',
              title: w.title || 'Feature',
              description: w.desc || w.description || 'Feature details...'
            }));
          } else if (d.why_choose && Array.isArray(d.why_choose.items)) {
            whyChooseItems = d.why_choose.items;
          }

          // 4. Normalize FAQs Array/Object
          let faqsItems = [];
          if (Array.isArray(d.faqs)) {
            faqsItems = d.faqs.map(q => ({
              question: q.question || 'Question?',
              answer: q.answer || 'Answer...'
            }));
          } else if (d.faqs && Array.isArray(d.faqs.items)) {
            faqsItems = d.faqs.items;
          }

          // 5. Normalize Stats
          let statsItems = [];
          if (d.stats && Array.isArray(d.stats.items)) {
            statsItems = d.stats.items;
          } else if (d.stats && typeof d.stats === 'object') {
            statsItems = [
              { value: d.stats.specialists_count || '15+', label: 'Specialists & Surgeons', icon: 'Users' },
              { value: d.stats.treatments_count || '5,000+', label: 'Successful Treatments', icon: 'HeartPulse' },
              { value: d.stats.years_excellence || '15+', label: 'Years of Excellence', icon: 'Award' },
              { value: d.stats.satisfaction_rate || '98%', label: 'Patient Satisfaction', icon: 'Star' }
            ];
          }

          setFormData(prev => ({
            basic: {
              name: d.name || '',
              slug: d.slug || '',
              short_description: d.short_description || '',
              full_description: d.full_description || '',
              icon: d.icon || 'HeartPulse',
              color_theme: d.color_theme || 'blue',
              status: d.status || 'active'
            },
            hero: {
              ...prev.hero,
              main_title: `${d.name} Department`,
              description: d.tagline || d.short_description || prev.hero.description,
              ...(d.hero || {})
            },
            overview: {
              ...prev.overview,
              heading: `World-Class Care in ${d.name}`,
              description: d.full_description || d.short_description || prev.overview.description,
              clinical_services: Array.isArray(d.services) && d.services.length > 0 ? d.services : prev.overview.clinical_services,
              vision_desc: d.vision || prev.overview.vision_desc,
              mission_desc: d.mission || prev.overview.mission_desc,
              ...(d.overview || {})
            },
            stats: { show_stats: true, items: statsItems.length > 0 ? statsItems : prev.stats.items },
            treatments: { ...prev.treatments, ...(d.treatments || {}), items: treatmentsItems.length > 0 ? treatmentsItems : prev.treatments.items },
            facilities: { ...prev.facilities, ...(d.facilities || {}), items: facilitiesItems.length > 0 ? facilitiesItems : prev.facilities.items },
            doctors: { assigned_ids: assignedDocIds },
            why_choose_us: { ...prev.why_choose_us, ...(d.why_choose || {}), items: whyChooseItems.length > 0 ? whyChooseItems : prev.why_choose_us.items },
            faqs: { ...prev.faqs, ...(d.faqs || {}), items: faqsItems.length > 0 ? faqsItems : prev.faqs.items },
            cta: { ...prev.cta, heading: `Need Expert Medical Care in ${d.name}?`, ...(d.cta || {}) },
            seo: { ...prev.seo, meta_title: `${d.name} Department | G.J.S Hospital`, ...(d.seo || {}) }
          }));
        }
      } catch (err) {
        console.error('Error fetching admin department:', err);
      } finally {
        setLoading(false);
      }
    };

    if (departmentId) fetchAdminDept();
  }, [departmentId]);

  // SAVE DRAFT HANDLER
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/departments/admin/${departmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert('Department draft saved successfully!');
        if (onSaveSuccess) onSaveSuccess();
      } else {
        alert(data.message || 'Failed to save draft');
      }
    } catch (err) {
      console.error('Save draft error:', err);
      alert('Error saving draft');
    } finally {
      setSaving(false);
    }
  };

  const saveDraftSilently = async () => {
    try {
      await authFetch(`${API_BASE_URL}/departments/admin/${departmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } catch (err) {
      console.error('Silent save draft error:', err);
    }
  };

  const handlePreviewClick = async () => {
    setSaving(true);
    await saveDraftSilently();
    setSaving(false);
    setShowPreviewModal(true);
  };

  // PUBLISH HANDLER
  const handlePublish = async () => {
    if (!formData.basic.name || !formData.basic.slug) {
      return alert('Department Name & Slug are required before publishing!');
    }

    setSaving(true);
    try {
      const publishPayload = {
        name: formData.basic.name,
        slug: formData.basic.slug,
        short_description: formData.basic.short_description,
        full_description: formData.basic.full_description,
        icon: formData.basic.icon,
        color_theme: formData.basic.color_theme,
        status: formData.basic.status,
        hero: formData.hero,
        overview: formData.overview,
        stats: formData.stats,
        treatments: formData.treatments,
        facilities: formData.facilities,
        why_choose: formData.why_choose_us,
        faqs: formData.faqs,
        cta: formData.cta,
        seo: formData.seo
      };

      const res = await authFetch(`${API_BASE_URL}/departments/admin/${departmentId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishPayload)
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 Department Published Live to Website Successfully!');
        if (onSaveSuccess) onSaveSuccess();
      } else {
        alert(data.message || 'Failed to publish department');
      }
    } catch (err) {
      console.error('Publish error:', err);
      alert('Error publishing department');
    } finally {
      setSaving(false);
    }
  };

  // AUTO-GENERATE SLUG FROM NAME
  const handleNameChange = (val) => {
    const slugVal = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      basic: { ...prev.basic, name: val, slug: slugVal },
      hero: { ...prev.hero, main_title: `${val} Department` },
      overview: { ...prev.overview, heading: `World-Class Care in ${val}` }
    }));
  };

  // TAB COMPLETION INDICATORS
  const isTabComplete = (tabKey) => {
    switch (tabKey) {
      case 'basic': return !!(formData.basic?.name && formData.basic?.slug);
      case 'hero': return !!(formData.hero?.main_title && formData.hero?.description);
      case 'overview': return !!(formData.overview?.heading && formData.overview?.description);
      case 'stats': return (formData.stats?.items?.length || 0) >= 2;
      case 'treatments': return (formData.treatments?.items?.length || 0) >= 1;
      case 'facilities': return (formData.facilities?.items?.length || 0) >= 1;
      case 'doctors': return (formData.doctors?.assigned_ids?.length || 0) >= 1;
      case 'why_choose': return (formData.why_choose_us?.items?.length || 0) >= 1;
      case 'faqs': return (formData.faqs?.items?.length || 0) >= 1;
      case 'cta': return !!formData.cta?.heading;
      case 'seo': return !!formData.seo?.meta_title;
      default: return true;
    }
  };

  const tabsList = [
    { key: 'basic', label: 'Basic Info', icon: Info },
    { key: 'hero', label: 'Hero Banner', icon: ImageIcon },
    { key: 'overview', label: 'Overview', icon: BookOpen },
    { key: 'treatments', label: 'Treatments', icon: Stethoscope },
    { key: 'facilities', label: 'Facilities', icon: Building },
    { key: 'doctors', label: 'Doctors', icon: Users },
    { key: 'stats', label: 'Statistics', icon: BarChart3 },
    { key: 'why_choose', label: 'Why Choose Us', icon: Award },
    { key: 'testimonials', label: 'Testimonials', icon: Star },
    { key: 'faqs', label: 'FAQs', icon: HelpCircle },
    { key: 'seo', label: 'SEO', icon: Globe },
    { key: 'publish', label: 'Publish', icon: Send }
  ];

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '20px', margin: '20px' }}>
        <p style={{ fontSize: '18px', color: '#0284c7', fontWeight: '700' }}>Loading Department CMS Controls...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', boxSizing: 'border-box', paddingBottom: '90px' }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Department Management CMS
          </h1>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Dashboard &gt; Departments &gt; Edit Department ({formData.basic.name || 'New'})</span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button"
            onClick={handlePreviewClick}
            style={{
              background: '#e0f2fe',
              color: '#0284c7',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={16} /> Preview Website Page ↗
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* TOP HORIZONTAL TABS */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '6px', marginBottom: '24px', display: 'flex', overflowX: 'auto', gap: '4px' }}>
        {tabsList.map((t) => {
          const IconComp = t.icon;
          const isActive = activeTab === t.key;
          const complete = isTabComplete(t.key);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: '1 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? '#0284c7' : 'transparent',
                color: isActive ? '#fff' : '#475569',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <IconComp size={16} />
              <span>{t.label}</span>
              {complete ? (
                <CheckCircle size={14} color={isActive ? '#fff' : '#16a34a'} />
              ) : (
                <AlertTriangle size={14} color={isActive ? '#fde047' : '#f59e0b'} />
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT FORM (FLEX 1) | RIGHT PREVIEW (FIXED 350PX) */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
        
        {/* LEFT COLUMN: ACTIVE TAB FORM */}
        <div style={{ flex: '1 1 0%', minWidth: 0, background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #cbd5e1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
          
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>Basic Information</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px' }}>General clinical department parameters & category icons.</p>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology"
                  value={formData.basic.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>URL Slug</label>
                <input
                  type="text"
                  placeholder="e.g. cardiology"
                  value={formData.basic.slug}
                  onChange={(e) => setFormData({ ...formData, basic: { ...formData.basic, slug: e.target.value } })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Short Description (for cards)</label>
                <textarea
                  rows={2}
                  placeholder="One-line summary..."
                  value={formData.basic.short_description}
                  onChange={(e) => setFormData({ ...formData, basic: { ...formData.basic, short_description: e.target.value } })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Full Description</label>
                <textarea
                  rows={3}
                  placeholder="Comprehensive clinical overview..."
                  value={formData.basic.full_description}
                  onChange={(e) => setFormData({ ...formData, basic: { ...formData.basic, full_description: e.target.value } })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Category Icon</label>
                  <IconPicker
                    value={formData.basic.icon}
                    onChange={(iconName) => setFormData({ ...formData, basic: { ...formData.basic, icon: iconName } })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Color Theme</label>
                  <select
                    value={formData.basic.color_theme}
                    onChange={(e) => setFormData({ ...formData, basic: { ...formData.basic, color_theme: e.target.value } })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="red">Red</option>
                    <option value="purple">Purple</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                    <option value="teal">Teal</option>
                    <option value="orange">Orange</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Department Status</label>
                  <select
                    value={formData.basic.status}
                    onChange={(e) => setFormData({ ...formData, basic: { ...formData.basic, status: e.target.value } })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO BANNER */}
          {activeTab === 'hero' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>Hero Banner Settings</h3>

              <ImageUploader
                label="Hero Background Image (Desktop)"
                recommendedSize="1920x700px"
                value={formData.hero.banner_image_url}
                onChange={(url) => setFormData({ ...formData, hero: { ...formData.hero, banner_image_url: url } })}
              />

              <ImageUploader
                label="Hero Background Image (Mobile)"
                recommendedSize="768x900px"
                value={formData.hero.mobile_image_url}
                onChange={(url) => setFormData({ ...formData, hero: { ...formData.hero, mobile_image_url: url } })}
              />

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Small Badge Title</label>
                <input
                  type="text"
                  placeholder="e.g. EXCELLENCE IN CLINICAL CARE"
                  value={formData.hero.small_title}
                  onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, small_title: e.target.value } })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Main Title</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology Department"
                  value={formData.hero.main_title}
                  onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, main_title: e.target.value } })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Description / Tagline</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Advanced Heart Care with Experienced Specialists..."
                  value={formData.hero.description}
                  onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, description: e.target.value } })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Primary Button Text</label>
                  <input
                    type="text"
                    value={formData.hero.primary_button_text}
                    onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, primary_button_text: e.target.value } })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Primary Button Link</label>
                  <input
                    type="text"
                    value={formData.hero.primary_button_link}
                    onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, primary_button_link: e.target.value } })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>Overview Section</h3>

              <ImageUploader
                label="Overview Image"
                recommendedSize="800x600px"
                value={formData.overview.image_url}
                onChange={(url) => setFormData({ ...formData, overview: { ...formData.overview, image_url: url } })}
              />

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Overview Heading</label>
                <input
                  type="text"
                  value={formData.overview.heading}
                  onChange={(e) => setFormData({ ...formData, overview: { ...formData.overview, heading: e.target.value } })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Overview Description</label>
                <textarea
                  rows={4}
                  value={formData.overview.description}
                  onChange={(e) => setFormData({ ...formData, overview: { ...formData.overview, description: e.target.value } })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '8px', display: 'block' }}>Clinical Services Checklist</label>
                <RepeatableFieldList
                  items={formData.overview.clinical_services || []}
                  addButtonText="+ Add Service Item"
                  onChange={(newItems) => setFormData({ ...formData, overview: { ...formData.overview, clinical_services: newItems } })}
                  onAddItem={() => setFormData({ ...formData, overview: { ...formData.overview, clinical_services: [...(formData.overview.clinical_services || []), 'New Service Item'] } })}
                  renderItem={(item, idx) => (
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const copy = [...(formData.overview.clinical_services || [])];
                        copy[idx] = e.target.value;
                        setFormData({ ...formData, overview: { ...formData.overview, clinical_services: copy } });
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* TAB 4: STATS - FIXED CLEAN SLEEK GRID (VALUE, LABEL, ICON) */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>Department Statistics</h3>
              
              <RepeatableFieldList
                items={formData.stats.items || []}
                minItems={2}
                addButtonText="+ Add Statistic"
                onChange={(newItems) => setFormData({ ...formData, stats: { ...formData.stats, items: newItems } })}
                onAddItem={() => setFormData({ ...formData, stats: { ...formData.stats, items: [...(formData.stats.items || []), { value: '100+', label: 'New Metric', icon: 'Award' }] } })}
                renderItem={(item, idx) => (
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 140px', gap: '10px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                    <input
                      type="text"
                      placeholder="Value (15+)"
                      value={item.value}
                      onChange={(e) => {
                        const copy = [...(formData.stats.items || [])];
                        copy[idx].value = e.target.value;
                        setFormData({ ...formData, stats: { ...formData.stats, items: copy } });
                      }}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                    />
                    <input
                      type="text"
                      placeholder="Label (e.g. Specialists)"
                      value={item.label}
                      onChange={(e) => {
                        const copy = [...(formData.stats.items || [])];
                        copy[idx].label = e.target.value;
                        setFormData({ ...formData, stats: { ...formData.stats, items: copy } });
                      }}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                    />
                    <IconPicker
                      value={item.icon}
                      onChange={(iconName) => {
                        const copy = [...(formData.stats.items || [])];
                        copy[idx].icon = iconName;
                        setFormData({ ...formData, stats: { ...formData.stats, items: copy } });
                      }}
                    />
                  </div>
                )}
              />
            </div>
          )}

          {/* TAB 5: TREATMENTS */}
          {activeTab === 'treatments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>Treatments & Procedures</h3>

              <RepeatableFieldList
                items={formData.treatments.items || []}
                addButtonText="+ Add Treatment"
                onChange={(newItems) => setFormData({ ...formData, treatments: { ...formData.treatments, items: newItems } })}
                onAddItem={() => setFormData({ ...formData, treatments: { ...formData.treatments, items: [...(formData.treatments.items || []), { icon: 'Zap', title: 'New Treatment', description: 'Procedure description...', link: '/appointment' }] } })}
                renderItem={(item, idx) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px' }}>
                      <IconPicker
                        value={item.icon}
                        onChange={(iconName) => {
                          const copy = [...(formData.treatments.items || [])];
                          copy[idx].icon = iconName;
                          setFormData({ ...formData, treatments: { ...formData.treatments, items: copy } });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Treatment Title"
                        value={item.title}
                        onChange={(e) => {
                          const copy = [...(formData.treatments.items || [])];
                          copy[idx].title = e.target.value;
                          setFormData({ ...formData, treatments: { ...formData.treatments, items: copy } });
                        }}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', boxSizing: 'border-box' }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Short description..."
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...(formData.treatments.items || [])];
                        copy[idx].description = e.target.value;
                        setFormData({ ...formData, treatments: { ...formData.treatments, items: copy } });
                      }}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              />
            </div>
          )}

          {/* TAB 6: FACILITIES */}
          {activeTab === 'facilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>Facilities & Technology</h3>

              <RepeatableFieldList
                items={formData.facilities.items || []}
                addButtonText="+ Add Facility"
                onChange={(newItems) => setFormData({ ...formData, facilities: { ...formData.facilities, items: newItems } })}
                onAddItem={() => setFormData({ ...formData, facilities: { ...formData.facilities, items: [...(formData.facilities.items || []), { icon: 'Cpu', name: 'New Facility', description: 'Facility details...' }] } })}
                renderItem={(item, idx) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px' }}>
                      <IconPicker
                        value={item.icon}
                        onChange={(iconName) => {
                          const copy = [...(formData.facilities.items || [])];
                          copy[idx].icon = iconName;
                          setFormData({ ...formData, facilities: { ...formData.facilities, items: copy } });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Facility Name"
                        value={item.name}
                        onChange={(e) => {
                          const copy = [...(formData.facilities.items || [])];
                          copy[idx].name = e.target.value;
                          setFormData({ ...formData, facilities: { ...formData.facilities, items: copy } });
                        }}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', boxSizing: 'border-box' }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Description..."
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...(formData.facilities.items || [])];
                        copy[idx].description = e.target.value;
                        setFormData({ ...formData, facilities: { ...formData.facilities, items: copy } });
                      }}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              />
            </div>
          )}

          {/* TAB 7: DOCTORS ASSIGNMENT */}
          {activeTab === 'doctors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: 0 }}>Assign Doctors</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Check doctors to assign them to {formData.basic.name || 'this department'}.</p>
                </div>
                <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px 14px', borderRadius: '20px', fontWeight: '800', fontSize: '13px' }}>
                  {(formData.doctors?.assigned_ids || []).length} Assigned
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px' }}>
                {allDoctors.map((doc) => {
                  const isAssigned = (formData.doctors?.assigned_ids || []).includes(doc.id);
                  return (
                    <label 
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isAssigned ? '#f0fdf4' : '#fff',
                        border: isAssigned ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={(e) => {
                            const current = formData.doctors?.assigned_ids || [];
                            const newIds = e.target.checked
                              ? [...current, doc.id]
                              : current.filter(id => id !== doc.id);
                            setFormData({ ...formData, doctors: { assigned_ids: newIds } });
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#00a3c8' }}
                        />
                        <div>
                          <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{doc.name}</strong>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{doc.consults}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: isAssigned ? '#16a34a' : '#94a3b8', fontWeight: '700' }}>
                        {isAssigned ? '✓ Assigned' : '+ Click to Assign'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: WHY CHOOSE US */}
          {activeTab === 'why_choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>Why Choose Us</h3>

              <RepeatableFieldList
                items={formData.why_choose_us.items || []}
                addButtonText="+ Add Feature"
                onChange={(newItems) => setFormData({ ...formData, why_choose_us: { ...formData.why_choose_us, items: newItems } })}
                onAddItem={() => setFormData({ ...formData, why_choose_us: { ...formData.why_choose_us, items: [...(formData.why_choose_us.items || []), { icon: 'Award', title: 'New Feature', description: 'Feature description...' }] } })}
                renderItem={(item, idx) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px' }}>
                      <IconPicker
                        value={item.icon}
                        onChange={(iconName) => {
                          const copy = [...(formData.why_choose_us.items || [])];
                          copy[idx].icon = iconName;
                          setFormData({ ...formData, why_choose_us: { ...formData.why_choose_us, items: copy } });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Feature Title"
                        value={item.title}
                        onChange={(e) => {
                          const copy = [...(formData.why_choose_us.items || [])];
                          copy[idx].title = e.target.value;
                          setFormData({ ...formData, why_choose_us: { ...formData.why_choose_us, items: copy } });
                        }}
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', boxSizing: 'border-box' }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Description..."
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...(formData.why_choose_us.items || [])];
                        copy[idx].description = e.target.value;
                        setFormData({ ...formData, why_choose_us: { ...formData.why_choose_us, items: copy } });
                      }}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              />
            </div>
          )}

          {/* TAB 9: TESTIMONIALS */}
          {activeTab === 'testimonials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>Patient Testimonials Module</h3>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                Testimonials are managed from the shared <strong>Testimonials Admin Module</strong> in the sidebar. Any testimonial tagged with <code>{formData.basic.name || 'this department'}</code> will automatically display on the public website.
              </p>
            </div>
          )}

          {/* TAB 10: FAQS */}
          {activeTab === 'faqs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>Frequently Asked Questions</h3>

              <RepeatableFieldList
                items={formData.faqs.items || []}
                addButtonText="+ Add FAQ"
                onChange={(newItems) => setFormData({ ...formData, faqs: { items: newItems } })}
                onAddItem={() => setFormData({ ...formData, faqs: { items: [...(formData.faqs.items || []), { question: 'New Question?', answer: 'Detailed answer...' }] } })}
                renderItem={(item, idx) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                    <input
                      type="text"
                      placeholder="Question?"
                      value={item.question}
                      onChange={(e) => {
                        const copy = [...(formData.faqs.items || [])];
                        copy[idx].question = e.target.value;
                        setFormData({ ...formData, faqs: { items: copy } });
                      }}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', boxSizing: 'border-box' }}
                    />
                    <textarea
                      rows={2}
                      placeholder="Answer..."
                      value={item.answer}
                      onChange={(e) => {
                        const copy = [...(formData.faqs.items || [])];
                        copy[idx].answer = e.target.value;
                        setFormData({ ...formData, faqs: { items: copy } });
                      }}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              />
            </div>
          )}

          {/* TAB 11: SEO */}
          {activeTab === 'seo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>SEO Optimization</h3>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Meta Title</label>
                <input
                  type="text"
                  placeholder="e.g. Best Cardiology Hospital & Heart Care Specialists"
                  value={formData.seo.meta_title}
                  onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, meta_title: e.target.value } })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#004861', marginBottom: '4px', display: 'block' }}>Meta Description</label>
                <textarea
                  rows={3}
                  placeholder="Search engine summary..."
                  value={formData.seo.meta_description}
                  onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, meta_description: e.target.value } })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* TAB 12: PUBLISH SUMMARY */}
          {activeTab === 'publish' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6e', margin: '0 0 4px' }}>Publishing Checklist</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tabsList.filter(t => t.key !== 'publish').map((t) => {
                  const done = isTabComplete(t.key);
                  return (
                    <div 
                      key={t.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: done ? '#f0fdf4' : '#fffbe0',
                        border: done ? '1px solid #bbf7d0' : '1px solid #fef08a'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{t.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: done ? '#16a34a' : '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {done ? <><CheckCircle size={16} /> Complete</> : <><AlertTriangle size={16} /> Optional / Incomplete</>}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                style={{
                  background: '#00a3c8',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '16px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  boxShadow: '0 8px 20px rgba(0,163,200,0.3)'
                }}
              >
                {saving ? 'Publishing...' : '🚀 Publish Department Live to Website'}
              </button>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW PANE */}
        <div style={{ width: '360px', flexShrink: 0, background: '#0f2b48', borderRadius: '24px', padding: '20px', color: '#fff', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', position: 'sticky', top: '20px', boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8', letterSpacing: '1px', textTransform: 'uppercase' }}>LIVE PREVIEW PANE</span>
            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '10px', color: '#93c5fd' }}>Desktop View</span>
          </div>

          {/* MINI HERO BANNER PREVIEW */}
          {(() => {
            const SERVER_URL = API_BASE_URL.replace('/api', '');
            const heroBgUrl = formData.hero?.banner_image_url 
              ? (formData.hero.banner_image_url.startsWith('http') ? formData.hero.banner_image_url : `${SERVER_URL}${formData.hero.banner_image_url}`)
              : null;
            return (
              <div style={{
                background: heroBgUrl 
                  ? `linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 60%, rgba(15,23,42,0.1) 100%), url('${heroBgUrl}')` 
                  : 'linear-gradient(135deg, #0a192f 0%, #1e3a8a 100%)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '18px',
                padding: '20px 16px',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '16px',
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', color: '#93c5fd', marginBottom: '10px' }}>
                  {formData.hero.small_title || 'EXCELLENCE IN CLINICAL CARE'}
                </span>

                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: '0 0 8px 0', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                  {formData.hero.main_title || 'Department Title'}
                </h2>

                <p style={{ fontSize: '12px', color: '#e0f2fe', margin: '0 0 14px 0', lineHeight: 1.5, textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                  {formData.hero.description || 'Department tagline preview...'}
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ background: '#00a3c8', color: '#fff', padding: '5px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>
                    {formData.hero.primary_button_text || 'Book Appointment'}
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '5px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>
                    {formData.hero.secondary_button_text || 'Call Now'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* MINI OVERVIEW PREVIEW */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '14px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800' }}>{formData.overview.eyebrow}</span>
            <h4 style={{ fontSize: '14px', color: '#fff', margin: '4px 0 6px', fontWeight: '700' }}>{formData.overview.heading}</h4>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {formData.overview.description}
            </p>
          </div>

          {/* MINI STATS PREVIEW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {(formData.stats.items || []).slice(0, 2).map((st, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <strong style={{ fontSize: '16px', color: '#38bdf8', display: 'block' }}>{st.value}</strong>
                <span style={{ fontSize: '10px', color: '#cbd5e1' }}>{st.label}</span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          left: '260px', // Offset for sidebar
          background: '#fff',
          borderTop: '1px solid #cbd5e1',
          padding: '12px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
        >
          Cancel
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={handlePreviewClick}
            style={{
              background: '#e0f2fe',
              color: '#0284c7',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={16} /> Preview Draft
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={saving}
            style={{
              background: '#00a3c8',
              color: '#fff',
              border: 'none',
              padding: '10px 28px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,163,200,0.3)'
            }}
          >
            {saving ? 'Publishing...' : '🚀 Publish Live'}
          </button>
        </div>
      </div>

      {showPreviewModal && (() => {
        const clientPort = window.location.port === '5174' ? '5173' : '5174';
        const previewUrl = `http://${window.location.hostname}:${clientPort}/departments/${formData.basic.slug || departmentId}?preview=true`;
        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 3000,
            padding: '30px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                  👁️ Live Website Preview: {formData.basic.name || 'Department'} Page
                </h3>
                <span style={{ background: '#38bdf8', color: '#0f172a', padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>
                  Live Draft Preview
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: '#0284c7', color: '#fff', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}
                >
                  Open in New Tab ↗
                </a>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >
                  Close Preview ✕
                </button>
              </div>
            </div>

            <div style={{ flex: 1, background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <iframe
                src={previewUrl}
                title="Department Preview"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default EditDepartmentForm;
