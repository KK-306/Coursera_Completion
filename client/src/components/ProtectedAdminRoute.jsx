import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function ProtectedAdminRoute({ children }) {
  const location = useLocation();
  const token = sessionStorage.getItem('coursepilot_admin_token');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsVerifying(false);
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/admin/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Session invalid or expired');
        }

        const data = await response.json();
        if (data.success && isMounted) {
          setIsAuthenticated(true);
        } else if (isMounted) {
          sessionStorage.removeItem('coursepilot_admin_token');
          sessionStorage.removeItem('coursepilot_admin_user');
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (isMounted) {
          sessionStorage.removeItem('coursepilot_admin_token');
          sessionStorage.removeItem('coursepilot_admin_user');
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (isVerifying) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-card">
          <div className="spinner-blue"></div>
          <p>Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
