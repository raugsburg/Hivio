import React, { useState } from 'react';
import PhoneFrame from './components/PhoneFrame';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import ProfileSetup from './components/onboarding/ProfileSetup';
import Dashboard from './components/home/Dashboard';
import Applications from './components/home/Applications';
import Resumes from './components/home/Resumes';
import Analytics from './components/home/Analytics';
import Settings from './components/home/Settings';
import BottomNav from './components/BottomNav';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');

  function handleRegistrationComplete(user) {
    setCurrentUser(user);
    setScreen('profileSetup');
  }

  function handleProfileComplete(updatedUser) {
    setCurrentUser(updatedUser);
    setScreen('app');
    setActiveTab('dashboard');
  }

  function handleLogin(user) {
    setCurrentUser(user);
    if (!user.profile) {
      setScreen('profileSetup');
    } else {
      setScreen('app');
      setActiveTab('dashboard');
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setScreen('login');
    setActiveTab('dashboard');
  }

  function renderActiveTab() {
    switch (activeTab) {
      case 'applications':
        return <Applications user={currentUser} />;
      case 'resumes':
        return <Resumes user={currentUser} />;
      case 'analytics':
        return <Analytics user={currentUser} />;
      case 'settings':
        return <Settings user={currentUser} onLogout={handleLogout} />;
      default:
        return <Dashboard user={currentUser} />;
    }
  }

  function renderScreen() {
    if (screen === 'profileSetup' && currentUser) {
      return (
        <ProfileSetup
          user={currentUser}
          onProfileComplete={handleProfileComplete}
        />
      );
    }

    if (screen === 'app' && currentUser) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {renderActiveTab()}
          </div>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      );
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