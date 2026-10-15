import React from 'react';

export default function PackageCard({ item, onSelect }) {
  const savings = (item.originalPrice || 0) - item.price;

  return (
    <article className={`pricing-card ${item.popular ? 'featured' : ''}`}>
      {item.popular && (
        <div className="badge-wrapper">
          <span className="popular-badge">Most Popular</span>
        </div>
      )}

      {/* Limited Time Offer Pill */}
      <div className="limited-time-wrapper">
        <span className="limited-time-badge">
          <span className="fire-icon">&#128293;</span> Limited Time Offer
        </span>
      </div>

      <div className="pricing-header">
        <h3 className="course-count-title">{item.label}</h3>

        <div className="price-container">
          {item.originalPrice && (
            <div className="price-discount-row">
              <span className="original-price-cut">&#8377;{item.originalPrice}</span>
              <span className="discount-tag">{item.discount || '40% OFF'}</span>
            </div>
          )}
          <div className="price-tag">
            <span className="currency">&#8377;</span>
            <span className="price-number">{item.price}</span>
            <span className="price-period">/ all modules</span>
          </div>
        </div>

        {savings > 0 && (
          <div className="savings-callout">
            <span>Instant savings: <strong>&#8377;{savings}</strong></span>
          </div>
        )}
      </div>

      <ul className="package-features">
        {item.features.map((feature, idx) => (
          <li key={idx}>
            <span className="check-icon">&#10004;</span>
            <span className="feature-text">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`pricing-btn ${item.popular ? 'btn-primary' : 'btn-outline'}`}
        onClick={() => onSelect(item)}
      >
        <span>Get Started at &#8377;{item.price}</span>
        <span className="btn-arrow" aria-hidden="true">&rarr;</span>
      </button>
    </article>
  );
}
