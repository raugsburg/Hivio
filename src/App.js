import React, { useEffect, useRef, useState } from 'react';
import PhoneFrame from './components/PhoneFrame';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import ProfileSetup from './components/onboarding/ProfileSetup';
import Dashboard from './components/home/Dashboard';
import Applications from './components/home/Applications';
import Resumes from './components/home/Resumes';
import Calendar from './components/home/Calendar';
import Settings from './components/home/Settings';
import BottomNav from './components/BottomNav';
import NotificationToast from './components/NotificationToast';
import './App.css';

import { applyThemeClass, getStoredTheme } from './utils/theme';
import { getDueNotifications, getNotificationsEnabled, setNotificationsEnabled } from './utils/notifications';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [notificationsEnabled, setNotifsEnabled] = useState(getNotificationsEnabled);
  const shownIds = useRef(new Set());

  useEffect(() => {
    applyThemeClass(getStoredTheme());
  }, []);

  useEffect(() => {
    if (!notificationsEnabled || !currentUser) return;

    function checkAndToast() {
      const due = getDueNotifications(currentUser);
      due.forEach((n) => {
        if (!shownIds.current.has(n.id)) {
          shownIds.current.add(n.id);
          setToasts((prev) => [...prev, n]);
        }
      });
    }

    checkAndToast();
    const interval = setInterval(checkAndToast, 60_000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, currentUser]);

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleToggleNotifications(val) {
    setNotifsEnabled(val);
    setNotificationsEnabled(val);
    if (!val) setToasts([]);
  }

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
      case 'calendar':
        return <Calendar user={currentUser} />;
      case 'settings':
        return (
          <Settings
            user={currentUser}
            onLogout={handleLogout}
            onUpdateUser={setCurrentUser}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={handleToggleNotifications}
          />
        );
      default:
        return <Dashboard user={currentUser} onTabChange={setActiveTab} />;
    }
  }

  function renderScreen() {
    if (screen === 'profileSetup' && currentUser) {
      return (
        <ProfileSetup user={currentUser} onProfileComplete={handleProfileComplete} />
      );
    }

    if (screen === 'app' && currentUser) {
      return (
        <div className="relative flex flex-col h-full">
          <NotificationToast toasts={toasts} onDismiss={dismissToast} />
          <div id="app-scroll-container" className="flex-1 overflow-y-auto">
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

    if (screen === 'forgotPassword') {
      return <ForgotPassword onSwitchToLogin={() => setScreen('login')} />;
    }

    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setScreen('register')}
        onSwitchToForgotPassword={() => setScreen('forgotPassword')}
      />
    );
  }

  return (
    <div className="app-wrapper">
      <PhoneFrame>{renderScreen()}</PhoneFrame>
    </div>
  );
}

export default App;