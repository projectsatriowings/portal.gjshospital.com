import React, { createContext, useState, useEffect, useContext } from 'react';
import LogoutConfirmModal from '../components/LogoutConfirmModal';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const AUTH_BASE_URL = API_BASE_URL.replace('/api', '/admin/auth');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gjs_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('gjs_admin_access_token') || null;
  });

  const [refreshToken, setRefreshToken] = useState(() => {
    return localStorage.getItem('gjs_admin_refresh_token') || null;
  });

  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Save/clear tokens in localStorage
  const handleSetAuthData = (token, refresh, userData) => {
    setAccessToken(token);
    setRefreshToken(refresh);
    setUser(userData);

    if (token) localStorage.setItem('gjs_admin_access_token', token);
    else localStorage.removeItem('gjs_admin_access_token');

    if (refresh) localStorage.setItem('gjs_admin_refresh_token', refresh);
    else localStorage.removeItem('gjs_admin_refresh_token');

    if (userData) localStorage.setItem('gjs_admin_user', JSON.stringify(userData));
    else localStorage.removeItem('gjs_admin_user');
  };

  // Login action
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        handleSetAuthData(data.accessToken, data.refreshToken, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Login failed.' };
      }
    } catch (err) {
      console.error('Error during login:', err);
      return { success: false, error: 'Network error connecting to auth server.' };
    } finally {
      setLoading(false);
    }
  };

  // Request logout (triggers top confirmation popup)
  const requestLogout = () => {
    setShowLogoutModal(true);
  };

  // Actual logout execution (runs after user clicks Yes, Log Out)
  const performLogout = async () => {
    setShowLogoutModal(false);
    if (refreshToken) {
      try {
        await fetch(`${AUTH_BASE_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch (err) {
        console.error('Error logging out on backend:', err);
      }
    }
    handleSetAuthData(null, null, null);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Refresh token helper
  const refreshAuthToken = async () => {
    if (!refreshToken) {
      performLogout();
      return null;
    }

    try {
      const res = await fetch(`${AUTH_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await res.json();

      if (data.success && data.accessToken) {
        setAccessToken(data.accessToken);
        localStorage.setItem('gjs_admin_access_token', data.accessToken);
        return data.accessToken;
      } else {
        performLogout();
        return null;
      }
    } catch (err) {
      performLogout();
      return null;
    }
  };

  // Authenticated fetch wrapper with automatic token refresh
  const authFetch = async (url, options = {}) => {
    let currentToken = accessToken || localStorage.getItem('gjs_admin_access_token');

    const headers = {
      ...(options.headers || {}),
      ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
    };

    let response = await fetch(url, { ...options, headers });

    // Handle 401 token expiry by attempting refresh once
    if (response.status === 401) {
      const newToken = await refreshAuthToken();
      if (newToken) {
        const newHeaders = {
          ...(options.headers || {}),
          'Authorization': `Bearer ${newToken}`
        };
        response = await fetch(url, { ...options, headers: newHeaders });
      }
    }

    return response;
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await authFetch(`${AUTH_BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('gjs_admin_user', JSON.stringify(data.user));
        return { success: true, message: data.message || 'Profile updated successfully!', user: data.user };
      } else {
        return { success: false, error: data.error || 'Failed to update profile.' };
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, error: 'Network error updating profile.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      token: accessToken || localStorage.getItem('gjs_admin_access_token'),
      refreshToken,
      loading,
      login,
      logout: requestLogout,
      performLogout,
      updateProfile,
      authFetch
    }}>
      {children}

      {/* TOP TRENDING LOGOUT CONFIRMATION POPUP */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={performLogout}
        onCancel={cancelLogout}
        userName={user?.name}
        userRole={user?.role}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
