import React, { useState, useEffect, useRef } from 'react';
import { QR_CONFIG } from '../config/qrConfig.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function PaymentScreen({ order, onBackToRegistration, onReset }) {
  const [currentQrIndex, setCurrentQrIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.floor(QR_CONFIG.rotationIntervalMs / 1000));
  const [upiReference, setUpiReference] = useState(order.upiReference || '');
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'PENDING');
  const [statusDetails, setStatusDetails] = useState({
    upiReference: order.upiReference || null,
    rejectionReason: null,
    verifiedAt: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // References to guarantee single interval and StrictMode stability
  const intervalRef = useRef(null);
  const isDocumentVisibleRef = useRef(!document.hidden);

  const qrList = QR_CONFIG.qrCodes && QR_CONFIG.qrCodes.length > 0
    ? QR_CONFIG.qrCodes
    : ['/qr/bank1.png', '/qr/bank2.png'];

  const totalQrs = qrList.length;

  // 1. QR Rotation Timer: 120,000 ms (2 minutes)
  useEffect(() => {
    // Only run rotation if payment is not yet marked as PAID
    if (paymentStatus === 'PAID') return;

    const handleVisibilityChange = () => {
      isDocumentVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 1-second ticker to update countdown and trigger switch
    intervalRef.current = setInterval(() => {
      if (!isDocumentVisibleRef.current) return; // Pause when tab is inactive

      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Time to switch to next QR
          setCurrentQrIndex((currIdx) => (currIdx + 1) % totalQrs);
          return Math.floor(QR_CONFIG.rotationIntervalMs / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [totalQrs, paymentStatus]);

  // 2. Manual switch button
  const handleManualSwitch = () => {
    setCurrentQrIndex((prev) => (prev + 1) % totalQrs);
    setSecondsRemaining(Math.floor(QR_CONFIG.rotationIntervalMs / 1000));
  };

  // 3. Format MM:SS for rotation countdown
  const formatCountdown = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 4. Copy Order ID
  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.registrationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 5. Submit UPI reference
  const handleSubmitReference = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanRef = upiReference.trim().toUpperCase();
    if (!cleanRef || cleanRef.length < 8 || cleanRef.length > 24) {
      setErrorMsg('Please enter a valid UPI reference number (usually 12-digit UTR from your UPI payment receipt).');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/payments/submit-reference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: order.registrationId,
          upiReference: cleanRef,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit reference.');
      }

      setPaymentStatus(data.status); // UNDER_REVIEW
      setStatusDetails((prev) => ({ ...prev, upiReference: cleanRef }));
      setSuccessMsg(data.message || 'UPI reference submitted. Payment is currently under manual verification.');

      // Update cached order in localStorage
      const cached = JSON.parse(localStorage.getItem('coursepilot_active_order') || '{}');
      cached.paymentStatus = data.status;
      cached.upiReference = cleanRef;
      localStorage.setItem('coursepilot_active_order', JSON.stringify(cached));
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting UPI reference.');
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Check verification status from server
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${API_BASE}/api/registrations/${encodeURIComponent(order.registrationId)}/status`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not fetch status.');
      }

      setPaymentStatus(data.paymentStatus);
      setStatusDetails({
        upiReference: data.upiReference || statusDetails.upiReference,
        rejectionReason: data.rejectionReason,
        verifiedAt: data.verifiedAt,
      });

      // Update cached order
      const cached = JSON.parse(localStorage.getItem('coursepilot_active_order') || '{}');
      cached.paymentStatus = data.paymentStatus;
      cached.upiReference = data.upiReference;
      localStorage.setItem('coursepilot_active_order', JSON.stringify(cached));
    } catch (err) {
      setErrorMsg(err.message || 'Unable to check status right now.');
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="payment-screen-wrap">
      {/* Top Banner / Order Summary Header */}
      <div className="payment-top-bar">
        <div className="order-id-pill">
          <span className="order-label">Order ID:</span>
          <strong className="order-code">{order.registrationId}</strong>
          <button
            type="button"
            className="btn-copy-id"
            onClick={handleCopyOrderId}
            title="Copy Registration ID"
          >
            {copied ? 'Copied \u2714' : 'Copy'}
          </button>
        </div>

        <button
          type="button"
          className="btn-view-summary"
          onClick={() => setShowSummaryModal(true)}
        >
          View Order Details
        </button>
      </div>

      {/* Prominent Amount Payable */}
      <div className="amount-payable-card">
        <div className="amount-left">
          <span className="pkg-name">{order.packageLabel || `${order.packageCount} Courses`}</span>
          <span className="pkg-timeline">&#9889; 24&ndash;48 Hours Guaranteed Completion</span>
        </div>
        <div className="amount-right">
          <span className="amt-label">Total Payable</span>
          <div className="amt-value">
            <span className="curr">&#8377;</span>
            <span className="num">{order.amount}</span>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      <div className={`status-banner status-${paymentStatus.toLowerCase()}`}>
        <div className="status-badge-icon">
          {paymentStatus === 'PAID' && '\u2714'}
          {paymentStatus === 'UNDER_REVIEW' && '\u23F3'}
          {paymentStatus === 'PENDING' && '\u26A0'}
          {paymentStatus === 'REJECTED' && '\u2716'}
        </div>
        <div className="status-text-content">
          <strong>
            {paymentStatus === 'PENDING' && 'Status: Payment Pending'}
            {paymentStatus === 'UNDER_REVIEW' && 'Status: Under Review (Verification in Progress)'}
            {paymentStatus === 'PAID' && 'Status: Payment Verified & Confirmed!'}
            {paymentStatus === 'REJECTED' && 'Status: Payment Verification Failed'}
          </strong>
          <p>
            {paymentStatus === 'PENDING' && 'Please scan the bank UPI QR code below and submit your transaction reference.'}
            {paymentStatus === 'UNDER_REVIEW' && `Reference ${statusDetails.upiReference || upiReference} is being verified against our bank records. This typically takes 15–30 minutes.`}
            {paymentStatus === 'PAID' && 'Your payment is confirmed! Our coordinator will contact your WhatsApp to deliver your course materials.'}
            {paymentStatus === 'REJECTED' && (statusDetails.rejectionReason || 'The submitted reference could not be matched with bank deposits. Please check the UTR or contact support.')}
          </p>
        </div>
        <button
          type="button"
          className="btn-refresh-status"
          onClick={handleCheckStatus}
          disabled={checkingStatus}
        >
          {checkingStatus ? 'Checking...' : '\u21BB Refresh'}
        </button>
      </div>

      {/* Two QR Codes Display Card */}
      {paymentStatus !== 'PAID' && (
        <div className="qr-container-card">
          <div className="qr-card-header">
            <div className="qr-indicator-pill">
              <span className="pulse-dot" />
              <span>QR {currentQrIndex + 1} of {totalQrs}</span>
            </div>

            <div className="qr-timer-pill">
              <span className="clock-icon">&#128337;</span>
              <span>Next switch in: <strong>{formatCountdown(secondsRemaining)}</strong></span>
            </div>

            <button
              type="button"
              className="btn-switch-qr"
              onClick={handleManualSwitch}
              title="Switch to alternate bank QR code"
            >
              Switch QR &#8644;
            </button>
          </div>

          {/* QR Image Box */}
          <div className="qr-image-display">
            <img
              src={qrList[currentQrIndex]}
              alt={`Bank UPI QR Code ${currentQrIndex + 1}`}
              className="qr-img"
            />
            <div className="qr-caption">
              <strong>Scan to Pay &#8377;{order.amount}</strong>
              <small>Compatible with GPay, PhonePe, Paytm &amp; BHIM UPI</small>
            </div>
          </div>

          <p className="qr-rotation-note">
            &#9432; Multiple bank QR routes ensure zero server downtime. The rotation is a display feature; payment remains valid on either QR.
          </p>
        </div>
      )}

      {/* UPI Reference Submission Section */}
      {paymentStatus !== 'PAID' && (
        <div className="reference-submission-card">
          <h3>Submit UPI Transaction Reference</h3>
          <p className="ref-instruction">
            After completing payment, enter the <strong>12-digit UPI reference (UTR / Transaction ID)</strong> from your payment receipt for manual bank verification.
          </p>

          {errorMsg && <div className="form-alert error">{errorMsg}</div>}
          {successMsg && <div className="form-alert success">{successMsg}</div>}

          <form onSubmit={handleSubmitReference} className="ref-form">
            <div className="ref-input-group">
              <input
                type="text"
                placeholder="Enter 12-digit UTR (e.g. 428901234567)"
                value={upiReference}
                onChange={(e) => setUpiReference(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                maxLength="24"
                required
              />
              <button
                type="submit"
                className="btn-submit-ref"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit for Verification \u2192'}
              </button>
            </div>
          </form>

          <div className="manual-verify-note">
            <span className="shield">&#128737;&#65039;</span>
            <small>
              Payments are verified manually by an authorized administrator against bank account statements before marking as PAID.
            </small>
          </div>
        </div>
      )}

      {/* Paid Celebration Box */}
      {paymentStatus === 'PAID' && (
        <div className="paid-celebration-box">
          <div className="celeb-icon">&#127881;</div>
          <h2>Payment Approved &amp; Active!</h2>
          <p>
            Your payment of <strong>&#8377;{order.amount}</strong> has been verified by the administrator. Course completion for <strong>{order.packageLabel}</strong> is now underway.
          </p>
          <div className="paid-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={onReset}
            >
              Start Another Registration
            </button>
          </div>
        </div>
      )}

      {/* Order Summary Modal Popup */}
      {showSummaryModal && (
        <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowSummaryModal(false)}>&times;</button>
            <h2>Registration Summary</h2>
            <div className="summary-list">
              <div className="s-row">
                <span>Order ID:</span>
                <strong>{order.registrationId}</strong>
              </div>
              <div className="s-row">
                <span>Student Name:</span>
                <strong>{order.studentName}</strong>
              </div>
              <div className="s-row">
                <span>Phone:</span>
                <strong>{order.studentPhone}</strong>
              </div>
              <div className="s-row">
                <span>Email:</span>
                <strong>{order.studentEmail}</strong>
              </div>
              <div className="s-row">
                <span>Package:</span>
                <strong>{order.packageLabel} ({order.packageCount} Course{order.packageCount > 1 ? 's' : ''})</strong>
              </div>
              <div className="s-row">
                <span>Amount:</span>
                <strong>&#8377;{order.amount}</strong>
              </div>
              <div className="s-row">
                <span>Payment Status:</span>
                <span className={`badge-status ${paymentStatus.toLowerCase()}`}>{paymentStatus}</span>
              </div>
              {statusDetails.upiReference && (
                <div className="s-row">
                  <span>UPI Reference:</span>
                  <strong>{statusDetails.upiReference}</strong>
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-primary full"
              style={{ marginTop: '16px' }}
              onClick={() => setShowSummaryModal(false)}
            >
              Back to Payment Screen
            </button>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="payment-footer-nav">
        <button
          type="button"
          className="btn-back-link"
          onClick={onBackToRegistration}
        >
          &larr; Back to Registration
        </button>
      </div>
    </div>
  );
}
