import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { getUserProfile, subscribeApplications, subscribeReminders } from './utils/db';

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
  const [currentUser, setCurrentUser] = useState(null); // merged Firebase Auth + Firestore profile
  const [screen, setScreen] = useState('loading');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [notificationsEnabled, setNotifsEnabled] = useState(getNotificationsEnabled);
  const scheduledTimeouts = useRef([]);

  // Live data for notification checking (subscriptions set up when user is logged in)
  const [liveApps, setLiveApps] = useState([]);
  const [liveReminders, setLiveReminders] = useState([]);

  useEffect(() => {
    applyThemeClass(getStoredTheme());
    if (getNotificationsEnabled()) requestNotificationPermission();
  }, []);

  // ── Firebase Auth state listener ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setScreen('login');
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
          // Registered but no profile saved yet — shouldn't happen, but handle gracefully
          setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          setScreen('profileSetup');
          return;
        }

        const merged = { uid: firebaseUser.uid, email: firebaseUser.email, ...profile };
        setCurrentUser(merged);

        if (!profile.profile) {
          setScreen('profileSetup');
        } else {
          setScreen('app');
        }
      } catch {
        setCurrentUser(null);
        setScreen('login');
      }
    });
    return unsub;
  }, []);

  // ── Live subscriptions for notifications ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.uid || screen !== 'app') return;
    const unsubApps = subscribeApplications(currentUser.uid, setLiveApps);
    const unsubRem = subscribeReminders(currentUser.uid, setLiveReminders);
    return () => { unsubApps(); unsubRem(); };
  }, [currentUser?.uid, screen]);

  // ── Notification polling ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!notificationsEnabled || !currentUser || screen !== 'app') return;

    function checkAndToast() {
      const due = getDueNotifications(liveApps, liveReminders);
      const shownIds = getShownNotifIds(currentUser.uid);
      due.forEach((n) => {
        if (!shownIds.has(n.id)) {
          markNotifShown(currentUser.uid, n.id);
          setToasts((prev) => [...prev, n]);
          fireNativeNotification(n.title, n.body);
        }
      });
    }

    checkAndToast();
    const interval = setInterval(checkAndToast, 10_000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, currentUser, screen, liveApps, liveReminders]);

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
    if (ms <= 0) return;

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
    if (currentUser) markNotifShown(currentUser.uid, notification.id);
    fireNativeNotification(notification.title, notification.body);
  }

  async function handleToggleNotifications(val) {
    if (val) await requestNotificationPermission();
    setNotifsEnabled(val);
    setNotificationsEnabled(val);
    if (!val) setToasts([]);
  }

  function handleProfileComplete(updatedUser) {
    setCurrentUser(updatedUser);
    setScreen('app');
    setActiveTab('dashboard');
  }

  async function handleLogout() {
    scheduledTimeouts.current.forEach(clearTimeout);
    scheduledTimeouts.current = [];
    setLiveApps([]);
    setLiveReminders([]);
    setCurrentUser(null);
    setActiveTab('dashboard');
    await signOut(auth);
  }

  // ── Screens ───────────────────────────────────────────────────────────────────

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
    if (screen === 'loading') {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', background: 'var(--bg-app)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40, border: '3px solid var(--border)',
              borderTopColor: 'var(--brand)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ color: 'var(--text-3)', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
              Loading…
            </p>
          </div>
        </div>
      );
    }

    if (screen === 'profileSetup' && currentUser) {
      return <ProfileSetup user={currentUser} onProfileComplete={handleProfileComplete} />;
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
      return <Register onSwitchToLogin={() => setScreen('login')} />;
    }

    if (screen === 'forgotPassword') {
      return <ForgotPassword onSwitchToLogin={() => setScreen('login')} />;
    }

    return (
      <Login
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
