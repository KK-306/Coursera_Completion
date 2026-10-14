import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://coursera-completion-backend.onrender.com';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // If already authenticated, redirect to /admin
  useEffect(() => {
    const existingToken = sessionStorage.getItem('coursepilot_admin_token');
    if (existingToken) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid admin credentials.');
      }

      sessionStorage.setItem('coursepilot_admin_token', data.token);
      sessionStorage.setItem('coursepilot_admin_user', data.admin?.username || 'admin');

      const destination = location.state?.from?.pathname || '/admin';
      navigate(destination, { replace: true });
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="admin-login-head">
          <span className="admin-shield">&#128737;&#65039;</span>
          <h2>CoursePilot Admin Portal</h2>
          <p>Protected Bank Payment Verification System</p>
        </div>

        {loginError && <div className="form-alert error" role="alert">{loginError}</div>}

        <form onSubmit={handleLogin} className="admin-login-form">
          <label>
            Administrator Username
            <input
              required
              type="text"
              placeholder="e.g. admin"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              autoFocus
            />
          </label>

          <label>
            Administrator Password
            <input
              required
              type="password"
              placeholder="••••••••••••"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
          </label>

          <button type="submit" className="btn-primary full" disabled={loggingIn}>
            {loggingIn ? 'Authenticating...' : 'Sign In to Admin Portal \u2192'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p className="admin-hint">
            &#128274; Authorized administrators only &bull; Protected by token authentication
          </p>
          <Link to="/" className="back-to-site-link">&larr; Return to CoursePilot Homepage</Link>
        </div>
      </div>
    </div>
  );
}
