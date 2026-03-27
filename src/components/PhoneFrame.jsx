import React from 'react';
import './PhoneFrame.css';

export default function PhoneFrame({ children }) {
  return (
    <div className="phone-frame">
      <div className="phone-notch" />
      <div className="phone-content" id="app-scroll-container">
        {children}
      </div>
    </div>
  );
}