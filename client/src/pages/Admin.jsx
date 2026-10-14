import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function Admin() {
  const navigate = useNavigate();
  const [token, setToken] = useState(sessionStorage.getItem('coursepilot_admin_token') || '');
  const [adminUser, setAdminUser] = useState(sessionStorage.getItem('coursepilot_admin_user') || '');

  // Admin dashboard state
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { reg, action: 'APPROVE' | 'REJECT' }
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  const handleLogout = () => {
    setToken('');
    setAdminUser('');
    sessionStorage.removeItem('coursepilot_admin_token');
    sessionStorage.removeItem('coursepilot_admin_user');
    navigate('/admin/login', { replace: true });
  };

  // 2. Fetch stats and registrations
  const fetchData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const authHeaders = { Authorization: `Bearer ${token}` };

      // Fetch Stats
      const statsRes = await fetch(`${API_BASE}/api/admin/stats`, { headers: authHeaders });
      if (statsRes.status === 401) {
        handleLogout();
        return;
      }
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Fetch Registrations
      const queryUrl = new URL(`${API_BASE}/api/admin/registrations`);
      if (statusFilter !== 'ALL') queryUrl.searchParams.set('status', statusFilter);
      if (searchTerm.trim()) queryUrl.searchParams.set('search', searchTerm.trim());

      const regRes = await fetch(queryUrl.toString(), { headers: authHeaders });
      const regData = await regRes.json();
      if (regData.success) setRegistrations(regData.registrations);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, statusFilter]);

  // 3. Perform manual verification (APPROVE / REJECT)
  const handleVerify = async () => {
    if (!actionModal || processingAction) return;

    setProcessingAction(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/registrations/${actionModal.reg.registrationId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: actionModal.action,
          notes: actionModal.action === 'APPROVE' ? (actionReason || 'Verified in bank account') : undefined,
          rejectionReason: actionModal.action === 'REJECT' ? (actionReason || 'Payment could not be verified in bank records') : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || 'Verification update failed.');
        return;
      }

      setActionModal(null);
      setActionReason('');
      fetchData(); // Refresh list & stats
    } catch (err) {
      alert('Error updating payment status: ' + err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const togglePasswordReveal = (id) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!token) {
    navigate('/admin/login', { replace: true });
    return null;
  }

  // 5. Render Authenticated Dashboard
  return (
    <div className="admin-dashboard-wrap">
      {/* Admin Top Header */}
      <header className="admin-top-bar">
        <div className="admin-header-inner container">
          <div className="admin-brand">
            <span className="brand-logo-c">c</span>
            <div>
              <strong>CoursePilot Admin</strong>
              <small>Bank Verification &amp; Order Management</small>
            </div>
          </div>

          <div className="admin-user-info">
            <span className="admin-user-pill">Logged in as: <strong>{adminUser}</strong></span>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main container">
        {/* Stats Row */}
        {stats && (
          <div className="admin-stats-grid">
            <div className="stat-card total">
              <span className="stat-label">Total Orders</span>
              <strong className="stat-num">{stats.total}</strong>
            </div>

            <div className="stat-card review">
              <span className="stat-label">Under Review (Action Needed)</span>
              <strong className="stat-num">{stats.underReview}</strong>
            </div>

            <div className="stat-card pending">
              <span className="stat-label">Pending Payment</span>
              <strong className="stat-num">{stats.pending}</strong>
            </div>

            <div className="stat-card paid">
              <span className="stat-label">Verified &amp; Paid</span>
              <strong className="stat-num">{stats.paid}</strong>
            </div>

            <div className="stat-card revenue">
              <span className="stat-label">Verified Revenue</span>
              <strong className="stat-num">&#8377;{stats.totalRevenue}</strong>
            </div>
          </div>
        )}

        {/* Controls Row: Search & Filters */}
        <div className="admin-controls-card">
          <div className="filter-tabs">
            {['ALL', 'UNDER_REVIEW', 'PENDING', 'PAID', 'REJECTED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`filter-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchData();
            }}
            className="search-form"
          >
            <input
              type="text"
              placeholder="Search by Order ID, Name, Phone, UPI Ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-search">Search</button>
            {searchTerm && (
              <button
                type="button"
                className="btn-clear"
                onClick={() => {
                  setSearchTerm('');
                  setTimeout(fetchData, 50);
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Registrations Table */}
        <div className="table-responsive-card">
          {loadingData ? (
            <div className="table-loading">Loading registration records...</div>
          ) : registrations.length === 0 ? (
            <div className="table-empty">No registrations found matching the selected filter.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID / Date</th>
                  <th>Student Info</th>
                  <th>Package &amp; Amount</th>
                  <th>Coursera Login</th>
                  <th>Course Details</th>
                  <th>UPI Ref (UTR)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg._id} className={`row-status-${reg.paymentStatus.toLowerCase()}`}>
                    <td>
                      <strong className="table-order-id">{reg.registrationId}</strong>
                      <small className="table-date">{new Date(reg.createdAt).toLocaleString('en-IN')}</small>
                    </td>

                    <td>
                      <div className="student-meta">
                        <strong>{reg.studentName}</strong>
                        <span>&#128222; {reg.studentPhone}</span>
                        <span>&#9993;&#65039; {reg.studentEmail}</span>
                      </div>
                    </td>

                    <td>
                      <div className="pkg-meta">
                        <strong>{reg.packageLabel}</strong>
                        <span className="price-bold">&#8377;{reg.amount}</span>
                      </div>
                    </td>

                    <td>
                      <div className="coursera-cred-meta">
                        {reg.courseraId ? (
                          <>
                            <small className="cred-label">User: {reg.courseraId}</small>
                            {reg.courseraPassword ? (
                              <div className="pass-row">
                                <small>
                                  Pass: {revealedPasswords[reg._id] ? reg.courseraPassword : '••••••••'}
                                </small>
                                <button
                                  type="button"
                                  className="btn-text-xs"
                                  onClick={() => togglePasswordReveal(reg._id)}
                                >
                                  {revealedPasswords[reg._id] ? 'Hide' : 'Show'}
                                </button>
                              </div>
                            ) : (
                              <small className="cred-muted">No pass provided</small>
                            )}
                          </>
                        ) : (
                          <small className="cred-muted">None</small>
                        )}
                      </div>
                    </td>

                    <td className="course-details-cell">
                      <p className="course-text" title={reg.courseDetails}>
                        {reg.courseDetails}
                      </p>
                    </td>

                    <td>
                      {reg.upiReference ? (
                        <div className="utr-box">
                          <code className="utr-code">{reg.upiReference}</code>
                          {reg.referenceSubmittedAt && (
                            <small className="utr-time">
                              Submitted: {new Date(reg.referenceSubmittedAt).toLocaleTimeString('en-IN')}
                            </small>
                          )}
                        </div>
                      ) : (
                        <span className="utr-none">No UTR yet</span>
                      )}
                    </td>

                    <td>
                      <span className={`status-pill ${reg.paymentStatus.toLowerCase()}`}>
                        {reg.paymentStatus}
                      </span>
                      {reg.rejectionReason && (
                        <small className="rejection-text">{reg.rejectionReason}</small>
                      )}
                    </td>

                    <td>
                      <div className="action-btns-cell">
                        {reg.paymentStatus !== 'PAID' && (
                          <button
                            type="button"
                            className="btn-action approve"
                            onClick={() => {
                              setActionModal({ reg, action: 'APPROVE' });
                              setActionReason('');
                            }}
                            title="Verify and Mark as PAID"
                          >
                            Approve
                          </button>
                        )}

                        {reg.paymentStatus !== 'REJECTED' && (
                          <button
                            type="button"
                            className="btn-action reject"
                            onClick={() => {
                              setActionModal({ reg, action: 'REJECT' });
                              setActionReason('');
                            }}
                            title="Reject Payment"
                          >
                            Reject
                          </button>
                        )}

                        {reg.auditTrail && reg.auditTrail.length > 0 && (
                          <button
                            type="button"
                            className="btn-action audit"
                            onClick={() => setSelectedAuditLog(reg)}
                            title="View audit history"
                          >
                            Audit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Verification Modal (Approve or Reject Confirmation) */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setActionModal(null)}>&times;</button>
            <h3>
              {actionModal.action === 'APPROVE'
                ? `Approve Payment for Order ${actionModal.reg.registrationId}`
                : `Reject Payment for Order ${actionModal.reg.registrationId}`}
            </h3>

            <div className="verify-confirm-details">
              <p><strong>Student:</strong> {actionModal.reg.studentName} ({actionModal.reg.studentPhone})</p>
              <p><strong>Amount:</strong> &#8377;{actionModal.reg.amount} &bull; {actionModal.reg.packageLabel}</p>
              <p><strong>Submitted UPI UTR:</strong> <code>{actionModal.reg.upiReference || 'None'}</code></p>
            </div>

            <div className="form-field" style={{ marginTop: '14px' }}>
              <label>
                {actionModal.action === 'APPROVE'
                  ? 'Verification Notes (Optional):'
                  : 'Reason for Rejection (Required):'}
              </label>
              <textarea
                rows="2"
                placeholder={
                  actionModal.action === 'APPROVE'
                    ? 'e.g. Matched with Bank statement @ 15:42'
                    : 'e.g. UTR not found in bank statement, amount mismatch'
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>

            <div className="confirm-actions-row">
              <button
                type="button"
                className={`btn-action-submit ${actionModal.action.toLowerCase()}`}
                disabled={processingAction}
                onClick={handleVerify}
              >
                {processingAction
                  ? 'Processing...'
                  : actionModal.action === 'APPROVE'
                  ? 'Confirm Approval (Mark as PAID)'
                  : 'Confirm Rejection'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActionModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {selectedAuditLog && (
        <div className="modal-overlay" onClick={() => setSelectedAuditLog(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedAuditLog(null)}>&times;</button>
            <h3>Audit Trail: {selectedAuditLog.registrationId}</h3>
            <p className="modal-sub">Log of all status changes and verification actions</p>

            <div className="audit-timeline">
              {selectedAuditLog.auditTrail.map((entry, idx) => (
                <div className="audit-entry" key={idx}>
                  <div className="audit-dot"></div>
                  <div className="audit-content">
                    <div className="audit-top">
                      <span className={`status-pill ${entry.status.toLowerCase()}`}>{entry.status}</span>
                      <small className="audit-time">{new Date(entry.changedAt).toLocaleString('en-IN')}</small>
                    </div>
                    <p className="audit-by">Changed by: <strong>{entry.changedBy}</strong></p>
                    {entry.reason && <p className="audit-reason">Reason: {entry.reason}</p>}
                    {entry.upiReference && <p className="audit-ref">UTR: <code>{entry.upiReference}</code></p>}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn-secondary full"
              style={{ marginTop: '16px' }}
              onClick={() => setSelectedAuditLog(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
