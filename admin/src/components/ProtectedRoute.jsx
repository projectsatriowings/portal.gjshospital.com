import React from 'react';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  // SUPER_ADMIN has unrestricted access across all screens
  if (user.role === 'SUPER_ADMIN') {
    return children;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '560px',
        margin: '60px auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
        border: '1px solid #fee2e2'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: '#fef2f2',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <ShieldAlert size={36} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>
          Access Restricted (403 Forbidden)
        </h2>

        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          Your assigned role <strong>({user.role})</strong> does not have authorization to view or manage this module.
        </p>

        <p style={{ color: '#94a3b8', fontSize: '13px' }}>
          Please contact system administrator if you require access to this department module.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
