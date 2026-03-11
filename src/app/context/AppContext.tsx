import React, { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  school?: string;
  major?: string;
  gradYear?: string;
  location?: string;
  careerInterests?: string[];
  createdAt: string;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Saved';
  dateApplied: string;
  location?: string;
  notes?: string;
  url?: string;
}

export interface Resume {
  id: string;
  name: string;
  lastModified: string;
  version: string;
}

interface AppState {
  user: User | null;
  applications: JobApplication[];
  resumes: Resume[];
}

interface AppContextType extends AppState {
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  addApplication: (app: Omit<JobApplication, 'id'>) => void;
  updateApplication: (id: string, data: Partial<JobApplication>) => void;
  deleteApplication: (id: string) => void;
  addResume: (resume: Omit<Resume, 'id'>) => void;
  deleteResume: (id: string) => void;
}

const STORAGE_KEYS = {
  USERS: 'hivio_users',
  SESSION: 'hivio_session',
};

// Mock data for demo
const mockApplications: JobApplication[] = [
  { id: '1', company: 'Google', role: 'Software Engineer Intern', status: 'Interview', dateApplied: '2026-03-01', location: 'Mountain View, CA' },
  { id: '2', company: 'Meta', role: 'Product Manager Intern', status: 'Applied', dateApplied: '2026-03-03', location: 'Menlo Park, CA' },
  { id: '3', company: 'Apple', role: 'iOS Developer Intern', status: 'Saved', dateApplied: '2026-03-05', location: 'Cupertino, CA' },
  { id: '4', company: 'Microsoft', role: 'Software Engineer Intern', status: 'Offer', dateApplied: '2026-02-20', location: 'Redmond, WA' },
  { id: '5', company: 'Amazon', role: 'SDE Intern', status: 'Rejected', dateApplied: '2026-02-15', location: 'Seattle, WA' },
];

const mockResumes: Resume[] = [
  { id: '1', name: 'Software Engineer Resume', lastModified: '2026-03-01', version: 'v3' },
  { id: '2', name: 'Product Manager Resume', lastModified: '2026-02-28', version: 'v1' },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>(mockApplications);
  const [resumes, setResumes] = useState<Resume[]>(mockResumes);

  // On app load, restore session
  useEffect(() => {
    const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (sessionData) {
      try {
        const sessionUser = JSON.parse(sessionData) as User;
        setUser(sessionUser);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    }
  }, []);

  async function register(name: string, email: string, password: string): Promise<void> {
    const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: User[] = usersData ? JSON.parse(usersData) : [];

    if (users.some(u => u.email === email)) {
      throw new Error('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newUser));
    setUser(newUser);
  }

  async function login(email: string, password: string): Promise<void> {
    const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: User[] = usersData ? JSON.parse(usersData) : [];

    const found = users.find(u => u.email === email);

    if (!found) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, found.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(found));
    setUser(found);
  }

  function logout(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    setUser(null);
  }

  function updateProfile(data: Partial<User>): void {
    if (!user) return;
    const updatedUser = { ...user, ...data };

    const usersData = localStorage.getItem(STORAGE_KEYS.USERS);
    const users: User[] = usersData ? JSON.parse(usersData) : [];
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  function addApplication(app: Omit<JobApplication, 'id'>): void {
    const newApp: JobApplication = { ...app, id: Date.now().toString() };
    setApplications(prev => [newApp, ...prev]);
  }

  function updateApplication(id: string, data: Partial<JobApplication>): void {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, ...data } : app));
  }

  function deleteApplication(id: string): void {
    setApplications(prev => prev.filter(app => app.id !== id));
  }

  function addResume(resume: Omit<Resume, 'id'>): void {
    const newResume: Resume = { ...resume, id: Date.now().toString() };
    setResumes(prev => [newResume, ...prev]);
  }

  function deleteResume(id: string): void {
    setResumes(prev => prev.filter(r => r.id !== id));
  }

  return (
    <AppContext.Provider value={{
      user, applications, resumes,
      register, login, logout, updateProfile,
      addApplication, updateApplication, deleteApplication,
      addResume, deleteResume,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
