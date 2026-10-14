import { useState, useEffect } from 'react';
import { packages, testimonials, faqsLeft, faqsRight } from '../data.js';
import PackageCard from '../components/PackageCard.jsx';
import RegistrationForm from '../components/RegistrationForm.jsx';
import PaymentScreen from '../components/PaymentScreen.jsx';

export default function Home() {
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [flowStep, setFlowStep] = useState('REGISTRATION'); // 'REGISTRATION' | 'PAYMENT'
  const [selectedPackageId, setSelectedPackageId] = useState('support-2');
  const [activeOrder, setActiveOrder] = useState(null);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support.Coursepilot@gmail.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  // Check for cached active order on load so page refresh doesn't lose order
  useEffect(() => {
    try {
      const saved = localStorage.getItem('coursepilot_active_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.registrationId) {
          setActiveOrder(parsed);
          setSelectedPackageId(parsed.packageId || 'support-2');
        }
      }
    } catch (err) {
      console.error('Error reading saved order:', err);
    }
  }, []);

  const handleOpenFlow = (packageId = 'support-2') => {
    setSelectedPackageId(packageId);
    if (activeOrder && activeOrder.packageId === packageId) {
      setFlowStep('PAYMENT');
    } else {
      setFlowStep('REGISTRATION');
    }
    setIsFlowOpen(true);
  };

  const handleRegistrationSuccess = (orderSummary) => {
    setActiveOrder(orderSummary);
    setFlowStep('PAYMENT');
  };

  const handleResetFlow = () => {
    localStorage.removeItem('coursepilot_active_order');
    setActiveOrder(null);
    setFlowStep('REGISTRATION');
  };

  const handleCloseFlow = () => {
    setIsFlowOpen(false);
  };

  return (
    <main className="landing-page">
      {/* Resume Order Banner if previous order exists in localStorage */}
      {activeOrder && !isFlowOpen && (
        <div className="active-order-floating-strip">
          <div className="strip-container">
            <span className="live-pill">&#9889; Active Order:</span>
            <strong>{activeOrder.registrationId}</strong>
            <span className="strip-sub">({activeOrder.packageLabel} &bull; &#8377;{activeOrder.amount})</span>
            <button
              type="button"
              className="btn-resume-order"
              onClick={() => {
                setFlowStep('PAYMENT');
                setIsFlowOpen(true);
              }}
            >
              Resume Payment / Check Status &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-headline">
              Get Your Coursera<br />
              <span className="accent-blue">Courses Completed</span><br />
              in 24 to <span className="accent-blue">48 Hours</span>
            </h1>

            <p className="hero-subline">
              Reliable, secure and student-focused support to help you complete your Coursera courses on time.
            </p>

            <div className="hero-badges-row">
              <div className="feature-pill">
                <span className="pill-icon bolt-icon">&#9889;</span>
                <div className="pill-text">
                  <strong>Fast</strong>
                  <small>24&ndash;48 hours</small>
                </div>
              </div>

              <div className="feature-pill">
                <span className="pill-icon shield-icon">&#128737;&#65039;</span>
                <div className="pill-text">
                  <strong>Secure</strong>
                  <small>Your data is safe</small>
                </div>
              </div>

              <div className="feature-pill">
                <span className="pill-icon student-icon">&#127891;</span>
                <div className="pill-text">
                  <strong>Student</strong>
                  <small>Focused service</small>
                </div>
              </div>
            </div>

            <div className="hero-cta-wrap">
              <button
                type="button"
                className="btn-explore"
                onClick={() => handleOpenFlow('support-2')}
              >
                <span>Explore Packages</span>
                <span className="arrow">&rarr;</span>
              </button>
            </div>

            <p className="hero-trust-text">
              100% Confidential &nbsp;|&nbsp; Trusted by Students &nbsp;|&nbsp; Secure Payment through UPI
            </p>
          </div>

          <div className="hero-visual-col">
            <div className="visual-wrapper">
              <div className="ambient-blob"></div>

              {/* Student image */}
              <img
                src="/student_hero.jpg"
                alt="Student holding Coursera course material"
                className="student-img"
              />

              {/* Floating Badge 1: Top Left */}
              <div className="floating-badge badge-completion">
                <div className="badge-coursera-logo">coursera</div>
                <div className="completion-info">
                  <div className="completion-head">
                    <span className="completed-label">Course Completed</span>
                    <span className="percent-text">100%</span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-fill"></div>
                  </div>
                </div>
                <div className="check-circle-green">&#10004;</div>
              </div>

              {/* Floating Badge 2: Mid Left */}
              <div className="floating-badge badge-delivery">
                <span className="clock-blue">&#128337;</span>
                <div className="delivery-text">
                  <small>Delivered within</small>
                  <strong>24 &ndash; 48 Hours</strong>
                </div>
              </div>

              {/* Floating Badge 3: Right Side Card */}
              <div className="floating-badge badge-milestones">
                <div className="milestone-item">
                  <span className="m-icon doc">&#128196;</span>
                  <span>Quizzes</span>
                </div>
                <div className="milestone-item">
                  <span className="m-icon assign">&#128221;</span>
                  <span>Assignments</span>
                </div>
                <div className="milestone-item">
                  <span className="m-icon code">&lt;/&gt;</span>
                  <span>Projects</span>
                </div>
                <div className="milestone-item highlight">
                  <span className="m-icon check">&#10004;</span>
                  <span>Final Submission</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST / FEATURES STRIP */}
      <section className="trust-strip-section">
        <div className="container">
          <div className="trust-strip-grid">
            <div className="trust-item">
              <div className="trust-icon-box blue-soft">&#127891;</div>
              <div>
                <h4>Expert Assistance</h4>
                <p>Handled by experienced learners</p>
              </div>
            </div>

            <div className="trust-item">
              <div className="trust-icon-box blue-soft">&#128337;</div>
              <div>
                <h4>Timely Delivery</h4>
                <p>Most courses completed in 24&ndash;48 hours</p>
              </div>
            </div>

            <div className="trust-item">
              <div className="trust-icon-box blue-soft">&#128737;&#65039;</div>
              <div>
                <h4>Quality Work</h4>
                <p>Accurate and high quality submissions</p>
              </div>
            </div>

            <div className="trust-item">
              <div className="trust-icon-box blue-soft">&#128172;</div>
              <div>
                <h4>Student Support</h4>
                <p>Dedicated support throughout</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRICING SECTION */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-eyebrow">PRICING</span>
            <h2>Choose Your Learning Package</h2>
            <p>Affordable and transparent pricing for Coursera course completion.</p>
          </div>

          <div className="pricing-cards-grid">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                item={pkg}
                onSelect={(item) => handleOpenFlow(item.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-eyebrow">HOW IT WORKS</span>
            <h2>Get Your Course Completed in 3 Simple Steps</h2>
          </div>

          <div className="steps-row">
            {/* Step 1 */}
            <div className="step-col">
              <div className="step-icon-circle">
                <span className="step-badge-num">1</span>
                <span className="step-icon-main">&#128203;</span>
              </div>
              <h3>Choose a Package</h3>
              <p>Select the number of Coursera courses you want us to complete.</p>
            </div>

            <div className="step-arrow">&rarr;</div>

            {/* Step 2 */}
            <div className="step-col">
              <div className="step-icon-circle">
                <span className="step-badge-num">2</span>
                <span className="step-icon-main">&#128241;</span>
              </div>
              <h3>Make a Secure Payment</h3>
              <p>Pay safely through UPI (Google Pay, PhonePe, Paytm, BHIM).</p>
            </div>

            <div className="step-arrow">&rarr;</div>

            {/* Step 3 */}
            <div className="step-col">
              <div className="step-icon-circle">
                <span className="step-badge-num">3</span>
                <span className="step-icon-main">&#9993;&#65039;</span>
              </div>
              <h3>Relax &amp; Get Completed</h3>
              <p>We complete your course within 24-48 hours and share the certificate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE COURSEPILOT */}
      <section className="why-choose-section" id="why-us">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-eyebrow">WHY CHOOSE COURSEPILOT</span>
            <h2>Built for Students, by Learners</h2>
          </div>

          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon-circle">&#127891;</div>
              <h3>100% Student Focused</h3>
              <p>We work exclusively for students and understand your academic needs.</p>
            </div>

            <div className="why-card">
              <div className="why-icon-circle">&#128737;&#65039;</div>
              <h3>Secure &amp; Confidential</h3>
              <p>Your account and data are always safe with us.</p>
            </div>

            <div className="why-card">
              <div className="why-icon-circle">&#128337;</div>
              <h3>On-Time Delivery</h3>
              <p>Most courses completed within 24&ndash;48 hours.</p>
            </div>

            <div className="why-card">
              <div className="why-icon-circle">&#128101;</div>
              <h3>Trusted Service</h3>
              <p>Helped hundreds of students achieve their learning goals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. STUDENT FEEDBACK */}
      <section className="feedback-section">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-eyebrow">STUDENT FEEDBACK</span>
            <h2>What Students Say</h2>
            <p>Trusted by learners who completed their Coursera courses with us.</p>
          </div>

          <div className="testimonials-wrapper">
            <button className="carousel-nav-btn prev" aria-label="Previous testimonial">&#8249;</button>

            <div className="testimonials-row">
              {testimonials.map((t, idx) => (
                <div className="testimonial-card" key={idx}>
                  <div className="card-author-row">
                    <div className="avatar-circle" style={{ backgroundColor: t.avatarColor }}>
                      {t.avatar}
                    </div>
                    <div className="author-info">
                      <h4>{t.name}</h4>
                      <div className="stars-row">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                    </div>
                  </div>
                  <p className="testimonial-quote">{t.quote}</p>
                </div>
              ))}
            </div>

            <button className="carousel-nav-btn next" aria-label="Next testimonial">&#8250;</button>
          </div>
        </div>
      </section>

      {/* 7. FAQS */}
      <section className="faq-section" id="faqs">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-eyebrow">FREQUENTLY ASKED QUESTIONS</span>
            <h2>Have Questions? We've Got Answers</h2>
          </div>

          <div className="faq-two-columns">
            <div className="faq-col">
              {faqsLeft.map((faq, idx) => (
                <details className="faq-accordion-item" key={idx} open={idx === 0}>
                  <summary>
                    <span>{faq.question}</span>
                    <span className="accordion-plus">+</span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>

            <div className="faq-col">
              {faqsRight.map((faq, idx) => (
                <details className="faq-accordion-item" key={idx} open={idx === 0}>
                  <summary>
                    <span>{faq.question}</span>
                    <span className="accordion-plus">+</span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. CONTACT US SECTION */}
      <section className="contact-section" id="contact">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-eyebrow">GET IN TOUCH</span>
            <h2>Contact Our Student Support Team</h2>
            <p>
              Have questions about your order, UPI payment verification, or need assistance with a course deadline? We're here for you.
            </p>
          </div>

          <div className="contact-main-grid">
            {/* Primary Email Support Card */}
            <div className="contact-featured-card">
              <div className="contact-badge-header">
                <span className="contact-icon-bubble">&#9993;&#65039;</span>
                <span className="response-time-pill">&#9889; Average Response: 1&ndash;2 Hours</span>
              </div>

              <h3>Official Email Support</h3>
              <p className="contact-desc">
                For order status inquiries, UTR verification, or custom course completion requirements, write directly to our student support desk.
              </p>

              <div className="email-display-box">
                <div className="email-address-content">
                  <span className="email-label">Support Email Address</span>
                  <a
                    href="mailto:support.Coursepilot@gmail.com?subject=CoursePilot%20Student%20Inquiry"
                    className="email-link-text"
                  >
                    support.Coursepilot@gmail.com
                  </a>
                </div>

                <div className="email-actions-row">
                  <a
                    href="mailto:support.Coursepilot@gmail.com?subject=CoursePilot%20Student%20Inquiry"
                    className="btn-send-email"
                  >
                    <span>Send Email</span>
                    <span className="arrow">&rarr;</span>
                  </a>

                  <button
                    type="button"
                    className="btn-copy-email"
                    onClick={handleCopyEmail}
                    title="Copy email to clipboard"
                  >
                    {emailCopied ? '\u2714 Copied!' : 'Copy Address'}
                  </button>
                </div>
              </div>

              <div className="contact-guarantees">
                <div className="guarantee-item">
                  <span className="g-check">&#10004;</span>
                  <span>24/7 Monitoring for payment approvals</span>
                </div>
                <div className="guarantee-item">
                  <span className="g-check">&#10004;</span>
                  <span>100% Student data confidentiality</span>
                </div>
                <div className="guarantee-item">
                  <span className="g-check">&#10004;</span>
                  <span>Dedicated assistance for assignment and quiz queries</span>
                </div>
              </div>
            </div>

            {/* Quick Inquiry Topics */}
            <div className="contact-topics-col">
              <div className="topic-card">
                <div className="topic-icon">&#128179;</div>
                <div className="topic-content">
                  <h4>UPI Verification Inquiries</h4>
                  <p>
                    Submitted your UPI reference and need expedited verification? Email us your <strong>Order ID</strong> and <strong>12-digit UTR</strong>.
                  </p>
                </div>
              </div>

              <div className="topic-card">
                <div className="topic-icon">&#128337;</div>
                <div className="topic-content">
                  <h4>Urgent Deadlines (Under 24 Hours)</h4>
                  <p>
                    Have a tight assignment or final quiz deadline approaching? Reach out with your course link for expedited processing.
                  </p>
                </div>
              </div>

              <div className="topic-card">
                <div className="topic-icon">&#128218;</div>
                <div className="topic-content">
                  <h4>Custom Packages &amp; Degree Specializations</h4>
                  <p>
                    Need assistance with 5+ courses or full specialization certificates? Contact us for custom bundled student pricing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PRE-FOOTER CTA BANNER */}
      <section className="pre-footer-cta-section">
        <div className="container">
          <div className="cta-banner-card">
            <div className="cta-left">
              <h2>Ready to Complete Your Coursera Courses?</h2>
              <p>Choose your package now and get your course completed in 24&ndash;48 hours.</p>
            </div>
            <div className="cta-right">
              <button
                type="button"
                className="btn-banner-cta"
                onClick={() => handleOpenFlow('support-2')}
              >
                <span>Explore Packages</span>
                <span className="arrow">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. STUDENT REGISTRATION & DUAL UPI QR PAYMENT MODAL */}
      {isFlowOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseFlow();
          }}
        >
          <div className="modal-dialog-large" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={handleCloseFlow}
              aria-label="Close dialog"
            >
              &times;
            </button>

            {flowStep === 'REGISTRATION' ? (
              <RegistrationForm
                initialPackageId={selectedPackageId}
                onSuccess={handleRegistrationSuccess}
                onCancel={handleCloseFlow}
              />
            ) : (
              <PaymentScreen
                order={activeOrder}
                onBackToRegistration={() => setFlowStep('REGISTRATION')}
                onReset={handleResetFlow}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
