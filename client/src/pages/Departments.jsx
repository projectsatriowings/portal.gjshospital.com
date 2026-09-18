import React from 'react';
import DepartmentsHero from '../components/DepartmentsHero';
import DepartmentsGrid from '../components/DepartmentsGrid';
import NeedHelpCTA from '../components/NeedHelpCTA';

const Departments = () => {
  return (
    <main style={{ backgroundColor: '#f8fafc', minHeight: '80vh' }}>
      {/* 1. HERO BANNER */}
      <DepartmentsHero />

      {/* 2. DEPARTMENTS GRID (5-COLUMNS DESKTOP) */}
      <DepartmentsGrid />

      {/* 3. NEED HELP CTA BANNER */}
      <NeedHelpCTA />
    </main>
  );
};

export default Departments;
