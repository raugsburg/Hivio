import React, { createContext, useContext, useState, ReactNode } from "react";

export type ApplicationStatus = "Applied" | "Interview" | "Rejected" | "Offer";

export interface Resume {
  id: string;
  name: string;
  dateAdded: string;
  labels: string[];
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  dateApplied: string;
  followUpDate?: string;
  notes?: string;
  resumeId?: string;
}

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
  major: string;
  school: string;
  gradYear: string;
  careerInterests: string[];
  preferredJobTypes: string[];
  locationPreference: string;
  dashboardPreferences: {
    primaryFocus: string;
    showStats: boolean;
    showUpcoming: boolean;
    showRecent: boolean;
  };
}

interface AppState {
  user: User | null;
  applications: JobApplication[];
  resumes: Resume[];
  setUser: (user: User | null) => void;
  addApplication: (app: JobApplication) => void;
  updateApplication: (app: JobApplication) => void;
  deleteApplication: (id: string) => void;
  addResume: (resume: Resume) => void;
  deleteResume: (id: string) => void;
}

const mockUser: User = {
  name: "Alex Carter",
  email: "alex.c@example.edu",
  avatarUrl: "https://images.unsplash.com/photo-1622179986499-fa3dfabc8ef3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWlsaW5nJTIwY29sbGVnZSUyMHN0dWRlbnQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzMxOTQ4MTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  major: "Computer Science",
  school: "State University",
  gradYear: "2024",
  careerInterests: ["Frontend", "UX Design", "Product Management"],
  preferredJobTypes: ["Full-time", "Internship"],
  locationPreference: "Remote / Hybrid",
  dashboardPreferences: {
    primaryFocus: "Tracking Applications",
    showStats: true,
    showUpcoming: true,
    showRecent: true,
  }
};

const mockResumes: Resume[] = [
  { id: "r1", name: "Alex_Carter_Frontend_v2.pdf", dateAdded: "2024-03-01", labels: ["Frontend", "React"] },
  { id: "r2", name: "Alex_Carter_Product_v1.pdf", dateAdded: "2024-02-15", labels: ["PM"] },
];

const mockApplications: JobApplication[] = [
  { id: "a1", company: "TechFlow", role: "Junior Frontend Developer", status: "Interview", dateApplied: "2024-03-05", followUpDate: "2024-03-15", notes: "First round went well. Technical next week.", resumeId: "r1" },
  { id: "a2", company: "DataSync", role: "Product Management Intern", status: "Applied", dateApplied: "2024-03-10", followUpDate: "2024-03-24", notes: "Reached out to recruiter on LinkedIn.", resumeId: "r2" },
  { id: "a3", company: "CloudNet", role: "UX Engineer", status: "Rejected", dateApplied: "2024-02-20", notes: "Got an automated email.", resumeId: "r1" },
  { id: "a4", company: "Innovate AI", role: "Frontend Engineer", status: "Offer", dateApplied: "2024-02-10", notes: "Offer received! Deadline to accept is next Friday.", resumeId: "r1" },
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(mockUser);
  const [applications, setApplications] = useState<JobApplication[]>(mockApplications);
  const [resumes, setResumes] = useState<Resume[]>(mockResumes);

  const addApplication = (app: JobApplication) => setApplications(prev => [app, ...prev]);
  const updateApplication = (updated: JobApplication) => setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
  const deleteApplication = (id: string) => setApplications(prev => prev.filter(a => a.id !== id));
  
  const addResume = (resume: Resume) => setResumes(prev => [resume, ...prev]);
  const deleteResume = (id: string) => setResumes(prev => prev.filter(r => r.id !== id));

  return (
    <AppContext.Provider value={{
      user, setUser, applications, resumes,
      addApplication, updateApplication, deleteApplication,
      addResume, deleteResume
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}