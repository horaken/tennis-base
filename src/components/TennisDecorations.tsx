import React from 'react';

export const TennisBallDecoration: React.FC<{ style?: React.CSSProperties; className?: string }> = ({ style, className }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }} className={className} aria-hidden="true">
    <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="#CCFF00" stroke="#88BB00" strokeWidth="4" />
      <path d="M20 20C35 45 35 55 20 80" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M80 20C65 45 65 55 80 80" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  </div>
);

export const TennisRacketDecoration: React.FC<{ style?: React.CSSProperties; className?: string }> = ({ style, className }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }} className={className} aria-hidden="true">
    <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <rect x="46" y="65" width="8" height="30" rx="4" fill="#8B5A2B" />
      <circle cx="50" cy="65" r="5" fill="#10B981" />
      {/* Head */}
      <ellipse cx="50" cy="35" rx="26" ry="32" fill="#E2E8F0" stroke="#059669" strokeWidth="6" />
      {/* Strings */}
      <path d="M34 20L34 50M42 16L42 54M50 15L50 55M58 16L58 54M66 20L66 50" stroke="#94A3B8" strokeWidth="2" opacity="0.7" />
      <path d="M30 25H70M26 35H74M30 45H70" stroke="#94A3B8" strokeWidth="2" opacity="0.7" />
    </svg>
  </div>
);

export const TennisCourtDecoration: React.FC<{ style?: React.CSSProperties; className?: string }> = ({ style, className }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }} className={className} aria-hidden="true">
    <svg width="48" height="36" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Court Background */}
      <rect width="120" height="80" rx="6" fill="#059669" />
      {/* Outer Lines */}
      <rect x="10" y="10" width="100" height="60" stroke="#FFFFFF" strokeWidth="3" fill="none" />
      {/* Service lines & Net */}
      <line x1="60" y1="10" x2="60" y2="70" stroke="#FFFFFF" strokeWidth="3" />
      <line x1="30" y1="20" x2="30" y2="60" stroke="#FFFFFF" strokeWidth="2" />
      <line x1="90" y1="20" x2="90" y2="60" stroke="#FFFFFF" strokeWidth="2" />
      <line x1="30" y1="40" x2="90" y2="40" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  </div>
);
