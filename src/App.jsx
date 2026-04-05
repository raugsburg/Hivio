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
import DevPage from './components/dev/DevPage';
import BottomNav from './components/BottomNav';
import NotificationToast from './components/NotificationToast';
import './App.css';

import { applyThemeClass, getStoredTheme } from './utils/theme';
import { getRemindersStorageKey } from './utils/storage';
import {
  getDueNotifications,
  getNotificationsEnabled,
  setNotificationsEnabled,
  requestNotificationPermission,
  fireNativeNotification,
  getShownNotifIds,
  markNotifShown,
} from './utils/notifications';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [screen, setScreen] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [notificationsEnabled, setNotifsEnabled] = useState(getNotificationsEnabled);
  const scheduledTimeouts = useRef([]);

  useEffect(() => {
    applyThemeClass(getStoredTheme());
    if (getNotificationsEnabled()) requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!notificationsEnabled || !currentUser) return;

    function checkAndToast() {
      const due = getDueNotifications(currentUser);
      const shownIds = getShownNotifIds(currentUser);
      due.forEach((n) => {
        if (!shownIds.has(n.id)) {
          markNotifShown(currentUser, n.id);
          setToasts((prev) => [...prev, n]);
          fireNativeNotification(n.title, n.body);
        }
      });
    }

    checkAndToast();
    const interval = setInterval(checkAndToast, 10_000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, currentUser]);

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function scheduleReminder(reminder) {
    if (!notificationsEnabled || !reminder.time) return;
    const today = new Date().toISOString().slice(0, 10);
    if (reminder.date !== today) return;

    const [h, m] = reminder.time.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return;

    const fireAt = new Date();
    fireAt.setHours(h, m, 0, 0);
    const ms = fireAt - Date.now();
    if (ms <= 0) return; // time already passed

    const t = setTimeout(() => {
      pushToast({
        id: `reminder_due_${reminder.id}_${today}`,
        type: 'reminder',
        title: 'Reminder',
        body: reminder.title,
      });
    }, ms);
    scheduledTimeouts.current.push(t);
  }

  function pushToast(notification) {
    if (!notificationsEnabled) return;
    setToasts((prev) => {
      if (prev.some((t) => t.id === notification.id)) return prev;
      return [...prev, notification];
    });
    if (currentUser) markNotifShown(currentUser, notification.id);
    fireNativeNotification(notification.title, notification.body);
  }

  async function handleToggleNotifications(val) {
    if (val) await requestNotificationPermission();
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
    // Schedule timeouts for today's future reminders
    const today = new Date().toISOString().slice(0, 10);
    try {
      const reminders = JSON.parse(localStorage.getItem(getRemindersStorageKey(user)) || '[]');
      reminders.filter((r) => r.date === today && !r.done && r.time).forEach(scheduleReminder);
    } catch {}

    if (!user.profile) {
      setScreen('profileSetup');
    } else {
      setScreen('app');
      setActiveTab('dashboard');
    }
  }

  function handleLogout() {
    scheduledTimeouts.current.forEach(clearTimeout);
    scheduledTimeouts.current = [];
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
        return <Calendar user={currentUser} onNotify={pushToast} onSchedule={scheduleReminder} />;
      case 'dev':
        return <DevPage onBack={() => setActiveTab('settings')} />;
      case 'settings':
        return (
          <Settings
            user={currentUser}
            onLogout={handleLogout}
            onUpdateUser={setCurrentUser}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={handleToggleNotifications}
            onTabChange={setActiveTab}
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