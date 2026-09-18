import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, 
  Brain, 
  Bone, 
  Baby, 
  Ear, 
  Eye, 
  Wind, 
  Stethoscope, 
  ShieldAlert, 
  Activity, 
  Users, 
  ArrowRight 
} from 'lucide-react';

const colorPalettes = [
  { bg: '#fef2f2', color: '#ef4444' }, // Pink / Red
  { bg: '#f3e8ff', color: '#9333ea' }, // Purple
  { bg: '#eff6ff', color: '#2563eb' }, // Blue
  { bg: '#f0fdf4', color: '#16a34a' }, // Green
  { bg: '#fefce8', color: '#ca8a04' }, // Yellow
  { bg: '#f0fdfa', color: '#0d9488' }, // Teal
  { bg: '#fff7ed', color: '#ea580c' }  // Orange
];

const getDepartmentIcon = (iconName) => {
  switch (iconName?.toLowerCase()) {
    case 'heartpulse':
    case 'heart':
      return HeartPulse;
    case 'brain':
      return Brain;
    case 'bone':
      return Bone;
    case 'baby':
    case 'child':
      return Baby;
    case 'ear':
      return Ear;
    case 'eye':
      return Eye;
    case 'wind':
    case 'lungs':
      return Wind;
    case 'stethoscope':
      return Stethoscope;
    case 'shieldalert':
    case 'oncology':
      return ShieldAlert;
    default:
      return Activity;
  }
};

const DepartmentCard = ({ department, index = 0 }) => {
  const IconComponent = getDepartmentIcon(department.icon);
  const palette = colorPalettes[index % colorPalettes.length];

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      padding: '28px 24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-6px)';
      e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,112,192,0.12)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
    }}
    >
      <div>
        {/* PASTEL ICON CONTAINER */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          backgroundColor: palette.bg,
          color: palette.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <IconComponent size={30} />
        </div>

        {/* DEPARTMENT NAME */}
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1a3a6e',
          marginBottom: '10px'
        }}>
          {department.name}
        </h3>

        {/* SHORT DESCRIPTION */}
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          lineHeight: '1.5',
          marginBottom: '18px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minHeight: '42px'
        }}>
          {department.short_description || department.description}
        </p>

        {/* DOCTOR COUNT BADGE */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#16a34a',
          fontSize: '13px',
          fontWeight: '700',
          marginBottom: '22px'
        }}>
          <Users size={16} />
          <span>{department.doctor_count || 10}+ Doctors</span>
        </div>
      </div>

      {/* LEARN MORE BUTTON */}
      <Link 
        to={`/departments/${department.slug || department.id}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          backgroundColor: '#fff',
          border: '1.5px solid #0070c0',
          color: '#0070c0',
          fontWeight: '700',
          fontSize: '14px',
          textDecoration: 'none',
          transition: 'all 0.2s ease'
        }}
      >
        Learn More
        <ArrowRight size={16} />
      </Link>
    </div>
  );
};

export default DepartmentCard;
