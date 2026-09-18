import React, { useState } from 'react';
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
  Cpu, 
  Award, 
  Truck, 
  Monitor, 
  Scan, 
  Scissors, 
  Target, 
  Compass, 
  HelpCircle, 
  Users, 
  Star, 
  Quote, 
  Zap,
  ChevronDown
} from 'lucide-react';

export const ICON_MAP = {
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
  Cpu,
  Award,
  Truck,
  Monitor,
  Scan,
  Scissors,
  Target,
  Compass,
  HelpCircle,
  Users,
  Star,
  Quote,
  Zap
};

const IconPicker = ({ value = 'Activity', onChange }) => {
  const [open, setOpen] = useState(false);
  const CurrentIcon = ICON_MAP[value] || Activity;

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1px solid #cbd5e1',
          background: '#fff',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          color: '#1e293b',
          width: '100%',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CurrentIcon size={18} />
          </div>
          <span>{value}</span>
        </div>
        <ChevronDown size={16} color="#64748b" />
      </button>

      {open && (
        <div 
          style={{
            position: 'absolute',
            top: '105%',
            left: 0,
            width: '280px',
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '14px',
            padding: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            maxHeight: '220px',
            overflowY: 'auto'
          }}
        >
          {Object.keys(ICON_MAP).map((iconName) => {
            const IconComp = ICON_MAP[iconName];
            const isSelected = iconName === value;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => {
                  onChange(iconName);
                  setOpen(false);
                }}
                title={iconName}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #00a3c8' : '1px solid #e2e8f0',
                  background: isSelected ? '#e0f2fe' : '#f8fafc',
                  color: isSelected ? '#00a3c8' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconComp size={20} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IconPicker;
