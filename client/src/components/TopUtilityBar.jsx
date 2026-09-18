import React from 'react';
import { PhoneCall, Truck, Clock, Globe, ChevronDown, Share2 } from 'lucide-react';

const TopUtilityBar = () => {
  return (
    <div style={{
      backgroundColor: '#eaf5fb',
      color: '#1a3a6e',
      borderBottom: '1px solid #d0e8f5',
      fontSize: '13px',
      padding: '8px 25px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '10px'
    }}>
      {/* LEFT INFORMATION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PhoneCall size={15} color="#0070c0" />
          <span>Emergency : <strong style={{ color: '#0070c0' }}>+91 98765 43210</strong></span>
        </div>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Truck size={15} color="#0070c0" />
          <span>Ambulance : <strong>24/7 Available</strong></span>
        </div>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={15} color="#0070c0" />
          <span>Mon - Sun : <strong>24x7 Open</strong></span>
        </div>
      </div>


    </div>
  );
};

export default TopUtilityBar;
