import React, { useState } from 'react';
import PhoneFrame from './components/PhoneFrame';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState('login');

  function handleRegistrationComplete(user) {
    // After registering, send them to login to prove they can authenticate
    setScreen('login');
  }

  function handleLogin(user) {
    setCurrentUser(user);
    setScreen('dashboard');
  }

  function handleLogout() {
    setCurrentUser(null);
    setScreen('login');
  }

  function renderScreen() {
    if (screen === 'dashboard' && currentUser) {
      return <Dashboard user={currentUser} onLogout={handleLogout} />;
    }

    if (screen === 'register') {
      return (
        <Register
          onRegistrationComplete={handleRegistrationComplete}
          onSwitchToLogin={() => setScreen('login')}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setScreen('register')}
      />
    );
  }

  return (
    <div className="app-wrapper">
      <PhoneFrame>
        {renderScreen()}
      </PhoneFrame>
    </div>
  );
}

export default App;
