import React, { useState } from 'react';
import { packages } from '../data.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function RegistrationForm({ initialPackageId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    packageId: initialPackageId || 'support-2',
    courseDetails: '',
    courseraId: '',
    courseraPassword: '',
    consent: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const selectedPkg = packages.find((p) => p.id === formData.packageId) || packages[1];

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Please enter your full name (minimum 2 characters).';
    }
    if (!formData.phone.trim() || !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.courseDetails.trim() || formData.courseDetails.trim().length < 3) {
      errs.courseDetails = 'Please provide the Coursera course title(s) or link(s).';
    }
    if (!formData.consent) {
      errs.consent = 'You must agree to information processing to continue.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim().toLowerCase(),
          packageId: formData.packageId,
          packageCount: selectedPkg.count,
          courseDetails: formData.courseDetails.trim(),
          courseraId: formData.courseraId.trim(),
          courseraPassword: formData.courseraPassword,
          consent: formData.consent,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit registration.');
      }

      // Persist in localStorage so page refresh doesn't lose registration
      localStorage.setItem('coursepilot_active_order', JSON.stringify(data.orderSummary));

      onSuccess(data.orderSummary);
    } catch (err) {
      console.error('Registration error:', err);
      setApiError(err.message || 'Unable to register at this time. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="registration-form-wrap">
      <div className="form-head">
        <span className="step-tag">Step 1 of 2</span>
        <h2>Student Registration</h2>
        <p>Enter your details to generate your course completion order and UPI QR code.</p>
      </div>

      {apiError && <div className="form-alert error" role="alert">{apiError}</div>}

      <form onSubmit={handleSubmit} className="reg-form" noValidate>
        {/* Full Name */}
        <div className="form-field">
          <label htmlFor="reg-name">
            Full Name <span className="req">*</span>
          </label>
          <input
            id="reg-name"
            type="text"
            placeholder="e.g. Aditi Sharma"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            className={errors.name ? 'has-error' : ''}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        {/* Mobile & Email 2-col row */}
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="reg-phone">
              10-Digit Mobile (WhatsApp) <span className="req">*</span>
            </label>
            <input
              id="reg-phone"
              type="tel"
              maxLength="10"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phone: cleaned });
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              className={errors.phone ? 'has-error' : ''}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="reg-email">
              Email Address <span className="req">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="name@college.edu"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              className={errors.email ? 'has-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
        </div>

        {/* Package Selection */}
        <div className="form-field">
          <label>
            Select Package <span className="req">*</span>
          </label>
          <div className="package-selector-grid">
            {packages.map((pkg) => (
              <label
                key={pkg.id}
                className={`pkg-option-card ${formData.packageId === pkg.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="packageId"
                  value={pkg.id}
                  checked={formData.packageId === pkg.id}
                  onChange={() => setFormData({ ...formData, packageId: pkg.id })}
                />
                <div className="pkg-option-info">
                  <strong>{pkg.label}</strong>
                  <span className="pkg-price">&#8377;{pkg.price}</span>
                  <small>24&ndash;48 hrs</small>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Course Titles or URLs */}
        <div className="form-field">
          <label htmlFor="reg-course-details">
            Coursera Course Title(s) or URL(s) <span className="req">*</span>
          </label>
          <textarea
            id="reg-course-details"
            rows="2"
            placeholder="e.g. Google Data Analytics (Course 1 & 2) or paste course link"
            value={formData.courseDetails}
            onChange={(e) => {
              setFormData({ ...formData, courseDetails: e.target.value });
              if (errors.courseDetails) setErrors({ ...errors, courseDetails: '' });
            }}
            className={errors.courseDetails ? 'has-error' : ''}
          />
          {errors.courseDetails && <span className="field-error">{errors.courseDetails}</span>}
        </div>

        {/* Coursera Credentials for Managed Completion */}
        <div className="credentials-box">
          <div className="cred-head">
            <strong>Coursera Login Credentials</strong>
            <small>Provided for managed course &amp; quiz completion</small>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="coursera-id">Coursera User ID / Email</label>
              <input
                id="coursera-id"
                type="text"
                placeholder="coursera_user@email.com"
                value={formData.courseraId}
                onChange={(e) => setFormData({ ...formData, courseraId: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="coursera-pass">
                Coursera Password
                <button
                  type="button"
                  className="toggle-show-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                id="coursera-pass"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.courseraPassword}
                onChange={(e) => setFormData({ ...formData, courseraPassword: e.target.value })}
              />
            </div>
          </div>
          <span className="cred-note">&#128274; Handled confidentially &bull; Only used for requested coursework</span>
        </div>

        {/* Consent Checkbox */}
        <div className="form-field consent-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.consent}
              onChange={(e) => {
                setFormData({ ...formData, consent: e.target.checked });
                if (errors.consent) setErrors({ ...errors, consent: '' });
              }}
            />
            <span>
              I agree to the processing of submitted information for Coursera course completion assistance in accordance with the{' '}
              <a href="#why-us" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
            </span>
          </label>
          {errors.consent && <span className="field-error">{errors.consent}</span>}
        </div>

        {/* Amount Summary and Submit */}
        <div className="form-submit-row">
          <div className="submit-summary">
            <span>Total Payable:</span>
            <strong>&#8377;{selectedPkg.price}</strong>
            <small>One-time &bull; Secure UPI</small>
          </div>
          <button type="submit" className="btn-submit-reg" disabled={submitting}>
            {submitting ? 'Generating Order...' : 'Continue to UPI QR Payment \u2192'}
          </button>
        </div>
      </form>
    </div>
  );
}
