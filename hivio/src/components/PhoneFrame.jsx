import React from 'react';
import './PhoneFrame.css';

function PhoneFrame({ children }) {
  return (
    <div className="phone-frame">
      <div className="phone-notch"></div>
      <div className="phone-content">
        {children}
      </div>
    </div>
  );
}

export default PhoneFrame;
