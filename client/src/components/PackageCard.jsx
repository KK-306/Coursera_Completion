import React from 'react';

export default function PackageCard({ item, onSelect }) {
  return (
    <article className={`pricing-card ${item.popular ? 'featured' : ''}`}>
      {item.popular && (
        <div className="badge-wrapper">
          <span className="popular-badge">Most Popular</span>
        </div>
      )}

      <div className="pricing-header">
        <h3 className="course-count-title">{item.label}</h3>
        <div className="price-tag">
          <span className="currency">&#8377;</span>
          <span className="price-number">{item.price}</span>
        </div>
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
        <span>Get Started</span>
        <span className="btn-arrow" aria-hidden="true">&rarr;</span>
      </button>
    </article>
  );
}
