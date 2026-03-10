import React from 'react';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Hivio</h1>
        <button className="logout-button" onClick={onLogout}>
          Sign Out
        </button>
      </div>

      <div className="dashboard-welcome">
        <h2>Welcome, {user.name}</h2>
        <p>{user.email}</p>
        <p className="member-since">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="dashboard-placeholder">
        <p>Your application dashboard is coming soon.</p>
      </div>
    </div>
  );
}

export default Dashboard;
