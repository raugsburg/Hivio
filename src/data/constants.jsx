export const careerInterests = [
  'Software Engineering', 'Product Management', 'Data Science',
  'UX Design', 'Marketing', 'Finance', 'Consulting',
  'Research', 'Operations', 'Sales', 'Human Resources',
  'Business Analytics', 'Cybersecurity'
];

export const DEFAULT_DASHBOARD_WIDGETS = {
  pipelineHealth: true,
  weeklyGoal: true,
  statusBreakdown: true,
  weeklyActivity: true,
  applicationFunnel: true,
  upcomingTasks: true,
  recentApps: true,
  rejectionRate: false
};

// Order of widget slots on the Dashboard (includes split interviewsLanded sections)
export const DEFAULT_DASHBOARD_ORDER = [
  'pipelineHealth',
  'weeklyGoal',
  'statusBreakdown',
  'applicationFunnel',
  'weeklyActivity',
  'resumePerformance',
  'upcomingTasks',
  'recentApps',
];

export const DASHBOARD_ORDER_LABELS = {
  pipelineHealth:     { label: 'Pipeline Health',         controlledBy: 'pipelineHealth' },
  weeklyGoal:         { label: 'Weekly Goal',             controlledBy: 'weeklyGoal' },
  statusBreakdown:    { label: 'Application Status',      controlledBy: 'statusBreakdown' },
  applicationFunnel:  { label: 'Application Funnel',      controlledBy: 'applicationFunnel' },
  weeklyActivity:     { label: 'Weekly Activity',         controlledBy: 'weeklyActivity' },
  resumePerformance:  { label: 'Resume Performance',      controlledBy: 'applicationFunnel' },
  upcomingTasks:      { label: 'Upcoming Follow-ups',     controlledBy: 'upcomingTasks' },
  recentApps:         { label: 'Recent Applications',     controlledBy: 'recentApps' },
};

// Removed "Response Rate" from dashboard personalization,
// so users don't toggle a widget that isn't implemented on Dashboard.
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
    id: 'weeklyGoal',
    label: 'Weekly Goal',
    desc: 'Track progress toward your weekly application target.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
    )
  },
  {
    id: 'statusBreakdown',
    label: 'Application Status',
    desc: 'See how many apps are applied, interviewing, offered, or rejected.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
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
    label: 'Application Funnel & Resume',
    desc: 'Show the conversion funnel and resume performance insights.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
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
