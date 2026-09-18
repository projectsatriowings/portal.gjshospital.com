import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const DepartmentBreadcrumb = ({ departmentName }) => {
  return (
    <div style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '12px 20px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
        <Link to="/" style={{ color: '#0070c0', textDecoration: 'none', fontWeight: '500' }}>Home</Link>
        <ChevronRight size={14} color="#94a3b8" />
        <Link to="/departments" style={{ color: '#0070c0', textDecoration: 'none', fontWeight: '500' }}>Departments</Link>
        <ChevronRight size={14} color="#94a3b8" />
        <span style={{ color: '#1a3a6e', fontWeight: '700' }}>{departmentName}</span>
      </div>
    </div>
  );
};

export default DepartmentBreadcrumb;
