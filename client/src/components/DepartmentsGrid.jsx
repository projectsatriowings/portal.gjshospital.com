import React, { useState, useEffect } from 'react';
import DepartmentCard from './DepartmentCard';
import { getDepartments } from '../services/departmentService';
import { RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DepartmentsGrid = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDepartmentsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDepartments();
      if (response.success) {
        setDepartments(response.data || []);
      } else {
        setError('Failed to fetch departments listing.');
      }
    } catch (err) {
      console.error('Error loading departments:', err);
      setError("Couldn't load departments right now, please retry.");
      toast.error("Couldn't load departments right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentsData();
  }, []);

  return (
    <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '60px 20px' }}>
      {/* ERROR STATE */}
      {error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fef2f2', maxWidth: '600px', margin: '20px auto', borderRadius: '16px', border: '1px solid #fecaca' }}>
          <AlertCircle size={40} color="#dc2626" style={{ marginBottom: '10px' }} />
          <h3 style={{ color: '#991b1b', marginBottom: '8px' }}>Unable to Load Departments</h3>
          <p style={{ color: '#7f1d1d', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={fetchDepartmentsData}
            style={{ background: '#0070c0', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* SKELETON LOADER GRID */}
      {loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <div key={n} style={{ height: '280px', background: '#e2e8f0', borderRadius: '20px', animation: 'pulse 1.5s infinite alternate' }}></div>
          ))}
        </div>
      )}

      {/* DYNAMIC DEPARTMENTS GRID (5 COLUMNS DESKTOP) */}
      {!loading && !error && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '25px'
        }}>
          {departments.map((department, index) => (
            <DepartmentCard key={department.id} department={department} index={index} />
          ))}
        </div>
      )}
    </section>
  );
};

export default DepartmentsGrid;
