export const careerInterests = [
  'Software Engineering', 'Product Management', 'Data Science',
  'UX Design', 'Marketing', 'Finance', 'Consulting',
  'Research', 'Operations', 'Sales', 'Human Resources',
  'Business Analytics', 'Cybersecurity'
];

export const DEFAULT_DASHBOARD_WIDGETS = {
  pipelineHealth: true,
  weeklyGoal: false,
  statusBreakdown: false,
  weeklyActivity: true,
  applicationFunnel: true,
  resumePerformance: true,
  upcomingTasks: true,
  recentApps: true,
  rejectionRate: false
};

// Order of widget slots on the Dashboard
export const DEFAULT_DASHBOARD_ORDER = [
  'pipelineHealth',
  'weeklyActivity',
  'applicationFunnel',
  'resumePerformance',
  'upcomingTasks',
  'recentApps',
];

export const DASHBOARD_ORDER_LABELS = {
  pipelineHealth:     { label: 'Pipeline Health',         controlledBy: 'pipelineHealth' },
  applicationFunnel:  { label: 'Application Funnel',      controlledBy: 'applicationFunnel' },
  weeklyActivity:     { label: 'Weekly Activity',         controlledBy: 'weeklyActivity' },
  resumePerformance:  { label: 'Resume Performance',      controlledBy: 'resumePerformance' },
  upcomingTasks:      { label: 'Upcoming Follow-ups',     controlledBy: 'upcomingTasks' },
  recentApps:         { label: 'Recent Applications',     controlledBy: 'recentApps' },
};

export const dashboardWidgets = [
  {
    id: 'pipelineHealth',
    label: 'Pipeline Health',
    desc: 'A score (0-100) measuring your search activity, conversion, and follow-up coverage.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    )
  },
  {
    id: 'weeklyActivity',
    label: 'Weekly Activity',
    desc: 'Track how many applications you submit each week.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )
  },
  {
    id: 'applicationFunnel',
    label: 'Application Funnel',
    desc: 'Show the conversion funnel from applied to interview to offer.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    )
  },
  {
    id: 'resumePerformance',
    label: 'Resume Performance',
    desc: 'Compare resume outcomes across interviews, offers, and rejections.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    )
  },
  {
    id: 'upcomingTasks',
    label: 'Upcoming Follow-ups',
    desc: 'Reminders for follow-up dates and deadlines.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  },
  {
    id: 'recentApps',
    label: 'Recent Applications',
    desc: 'Quick access to your latest submitted applications.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    )
  }
];
