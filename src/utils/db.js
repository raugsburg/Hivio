import { db } from '../firebase';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, onSnapshot,
} from 'firebase/firestore';

// ─── User Profile ────────────────────────────────────────────────────────────

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

// ─── Applications ────────────────────────────────────────────────────────────

export function subscribeApplications(uid, callback) {
  return onSnapshot(collection(db, 'users', uid, 'applications'), (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
  });
}

export async function saveApplication(uid, app) {
  await setDoc(doc(db, 'users', uid, 'applications', app.id), app);
}

export async function deleteApplication(uid, appId) {
  await deleteDoc(doc(db, 'users', uid, 'applications', appId));
}

// ─── Resumes (metadata only — no file content) ───────────────────────────────

export function subscribeResumes(uid, callback) {
  return onSnapshot(collection(db, 'users', uid, 'resumes'), (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
  });
}

export async function saveResume(uid, resume) {
  // Strip dataUrl before saving — Firestore has a 1MB doc limit
  const { dataUrl, ...metadata } = resume;
  await setDoc(doc(db, 'users', uid, 'resumes', metadata.id), metadata);
}

export async function updateResumeLabel(uid, resumeId, label) {
  await updateDoc(doc(db, 'users', uid, 'resumes', resumeId), { label });
}

export async function deleteResume(uid, resumeId) {
  await deleteDoc(doc(db, 'users', uid, 'resumes', resumeId));
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export function subscribeReminders(uid, callback) {
  return onSnapshot(collection(db, 'users', uid, 'reminders'), (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
  });
}

export async function saveReminder(uid, reminder) {
  await setDoc(doc(db, 'users', uid, 'reminders', reminder.id), reminder);
}

export async function updateReminder(uid, reminderId, data) {
  await updateDoc(doc(db, 'users', uid, 'reminders', reminderId), data);
}

export async function deleteReminder(uid, reminderId) {
  await deleteDoc(doc(db, 'users', uid, 'reminders', reminderId));
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export async function submitFeedback(entry) {
  await setDoc(doc(db, 'feedback', entry.id), entry);
}
