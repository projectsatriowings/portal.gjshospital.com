import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

export default function LogoutConfirmModal({ isOpen, onConfirm, onCancel, userName, userRole }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '28px',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={onCancel}
    >
      <style>{`
        @keyframes slideDownTop {
          from {
            opacity: 0;
            transform: translateY(-35px) scale(0.94);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulseGlowRed {
          0%, 100% {
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 28px rgba(239, 68, 68, 0.7);
          }
        }
        .logout-confirm-card {
          animation: slideDownTop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div
        className="logout-confirm-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}
      >
        {/* TOP GLOWING BANNER */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                animation: 'pulseGlowRed 2s infinite'
              }}
            >
              <LogOut size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.2px' }}>
                Confirm Account Logout
              </h3>
              <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '600' }}>
                G.J.S Hospital Management Portal
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY CONTENT */}
        <div style={{ padding: '24px' }}>
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '13px', color: '#991b1b', display: 'block', marginBottom: '2px' }}>
                Are you sure you want to log out?
              </strong>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#7f1d1d', lineHeight: '1.4' }}>
                You are currently logged in as <strong style={{ color: '#0f172a' }}>{userName || 'User'}</strong> ({userRole || 'Staff'}). Any unsaved session changes will be ended.
              </p>
            </div>
          </div>

          {/* BUTTON ACTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                width: '100%',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '12px 16px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Cancel & Stay
            </button>

            <button
              type="button"
              onClick={onConfirm}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut size={16} />
              <span>Yes, Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
