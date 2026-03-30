function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Company pool ────────────────────────────────────────────────────────────

const COMPANY_POOL = [
  { company: 'Google', title: 'Software Engineer Intern', location: 'Mountain View, CA' },
  { company: 'Meta', title: 'Software Engineer Intern', location: 'Remote' },
  { company: 'Amazon', title: 'SDE Intern', location: 'Seattle, WA' },
  { company: 'Microsoft', title: 'Software Engineer Intern', location: 'Redmond, WA' },
  { company: 'Apple', title: 'Software Engineer Intern', location: 'Cupertino, CA' },
  { company: 'OpenAI', title: 'Research Engineer Intern', location: 'San Francisco, CA' },
  { company: 'Stripe', title: 'Software Engineer Intern', location: 'San Francisco, CA' },
  { company: 'Shopify', title: 'Backend Developer Intern', location: 'Remote' },
  { company: 'Figma', title: 'Design Engineer Intern', location: 'Remote' },
  { company: 'Linear', title: 'Software Engineer', location: 'Remote' },
  { company: 'Vercel', title: 'Software Engineer Intern', location: 'Remote' },
  { company: 'Airbnb', title: 'Software Engineer Intern', location: 'San Francisco, CA' },
  { company: 'Discord', title: 'Software Engineer Intern', location: 'Remote' },
  { company: 'Duolingo', title: 'Mobile Engineer Intern', location: 'Pittsburgh, PA' },
  { company: 'Datadog', title: 'Software Engineer Intern', location: 'New York, NY' },
  { company: 'Atlassian', title: 'Software Engineer Intern', location: 'Remote' },
  { company: 'Notion', title: 'Frontend Engineer Intern', location: 'Remote' },
  { company: 'Spotify', title: 'Backend Engineer Intern', location: 'Remote' },
  { company: 'Coinbase', title: 'Software Engineer Intern', location: 'Remote' },
  { company: 'Robinhood', title: 'Software Engineer Intern', location: 'Remote' },
  { company: 'Plaid', title: 'Software Engineer Intern', location: 'Remote' },
  { company: 'Snowflake', title: 'Software Engineer Intern', location: 'San Mateo, CA' },
  { company: 'Databricks', title: 'Software Engineer Intern', location: 'San Francisco, CA' },
  { company: 'Scale AI', title: 'Software Engineer Intern', location: 'Remote' },
  { company: 'Twilio', title: 'Developer Evangelist Intern', location: 'Remote' },
  { company: 'Palantir', title: 'Forward Deployed Engineer Intern', location: 'New York, NY' },
  { company: 'Goldman Sachs', title: 'Technology Analyst', location: 'New York, NY' },
  { company: 'Deloitte', title: 'Technology Analyst Intern', location: 'Toronto, ON' },
  { company: 'KPMG', title: 'IT Advisory Intern', location: 'Vancouver, BC' },
  { company: 'TD Bank', title: 'Software Developer Co-op', location: 'Toronto, ON' },
];

// ─── Notes pool by status ─────────────────────────────────────────────────────

const NOTES_BY_STATUS = {
  Applied: [
    'Applied through careers page.',
    'Referral from a friend on the team.',
    'Found via Levels.fyi job board.',
    'Reached out to a recruiter on LinkedIn first.',
    'Campus recruiting event referral.',
    'Applied through LinkedIn Easy Apply.',
    '',
    '',
    '',
  ],
  Interview: [
    'Phone screen scheduled for next week.',
    'Technical screen went well. Waiting on next steps.',
    'Completed take-home project. Felt confident.',
    'Two rounds of technical interviews done.',
    'HireVue assessment completed.',
    'Recruiter said timeline is 2–3 weeks.',
    'First round was behavioural. Second round is technical.',
  ],
  Offer: [
    'Offer received! Need to review and respond.',
    'Verbal offer extended — written offer incoming.',
    'Offer deadline in 2 weeks. Comparing with other options.',
    'Strong offer. Negotiating start date.',
  ],
  Rejected: [
    'Got a form rejection email.',
    'No feedback provided.',
    'OA was tough. Did not advance.',
    'Technical screen did not go well.',
    'Position was filled internally.',
    '',
    '',
  ],
};

// ─── Reminder pool ────────────────────────────────────────────────────────────

const REMINDER_POOL = [
  { title: 'Follow up with recruiter', time: '10:00', notes: 'Check on interview timeline' },
  { title: 'Prepare for technical interview', time: '09:00', notes: 'Review system design and LeetCode mediums' },
  { title: 'Send thank you note after interview', time: '11:00', notes: '' },
  { title: 'Review offer terms', time: '14:00', notes: 'Compare benefits and deadline to accept' },
  { title: 'LinkedIn profile update', time: '20:00', notes: 'Update headline, skills, and featured projects' },
  { title: 'Update resume with new project', time: '15:00', notes: 'Add capstone project and new stack' },
  { title: 'Submit co-op applications', time: '23:59', notes: 'Posting deadline today' },
  { title: 'Mock interview practice', time: '18:00', notes: 'Focus on behavioural questions' },
  { title: 'Research company before interview', time: '08:00', notes: 'Read recent blog posts and news' },
  { title: 'Negotiate salary range', time: '13:00', notes: 'Look up Glassdoor and Levels.fyi comps' },
  { title: 'Complete online assessment', time: '19:00', notes: 'OA window closes in 48 hours' },
  { title: 'Email references', time: '10:30', notes: 'Give them a heads up about potential contact' },
];

const SEED_RESUMES = [
  { label: 'Software Engineer Resume v2', fileName: 'SWE_Resume_v2.pdf' },
  { label: 'General Tech Resume', fileName: 'General_Tech_Resume.pdf' },
  { label: 'Data & Analytics Resume', fileName: 'Data_Analytics_Resume.pdf' },
];

// ─── Weighted status picker ───────────────────────────────────────────────────
// Applied ~40%, Rejected ~28%, Interview ~22%, Offer ~10%

function pickStatus(weights = [40, 28, 22, 10]) {
  const statuses = ['Applied', 'Rejected', 'Interview', 'Offer'];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < statuses.length; i++) {
    r -= weights[i];
    if (r <= 0) return statuses[i];
  }
  return 'Applied';
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function seedUserData(email) {
  const e = email.toLowerCase();

  const resumes = SEED_RESUMES.map((r, i) => ({
    id: `seed_resume_${i}_${e}`,
    label: r.label,
    fileName: r.fileName,
    fileData: null,
    uploadedAt: new Date(Date.now() - (60 - i * 10) * 86400000).toISOString(),
  }));

  // Pick 20–24 random companies from the pool
  const count = randInt(20, 24);
  const companies = shuffle(COMPANY_POOL).slice(0, count);

  // Spread dates across last 55 days, with more recent apps clustered in the last 14
  const recentDays = companies.slice(0, Math.ceil(count * 0.4)).map((_, i) => randInt(0, 13));
  const olderDays = companies.slice(Math.ceil(count * 0.4)).map((_, i) => randInt(14, 55));
  const dayOffsets = shuffle([...recentDays, ...olderDays]);

  // Ensure at least 1 offer and 2 interviews in the mix
  const statuses = companies.map(() => pickStatus());
  if (!statuses.includes('Offer')) {
    // Find a non-Interview slot to avoid clobbering interviews
    const nonInterviewIdxs = statuses.map((s, i) => s !== 'Interview' ? i : -1).filter(i => i >= 0);
    const targetIdx = nonInterviewIdxs.length > 0
      ? nonInterviewIdxs[randInt(0, nonInterviewIdxs.length - 1)]
      : randInt(0, count - 1);
    statuses[targetIdx] = 'Offer';
  }
  const interviewCount = statuses.filter((s) => s === 'Interview').length;
  if (interviewCount < 2) {
    // Find non-Offer, non-Interview slots to avoid overwriting guarantees
    const fillableIdxs = statuses.map((s, i) => (s !== 'Offer' && s !== 'Interview') ? i : -1).filter(i => i >= 0);
    const needed = 2 - interviewCount;
    for (let n = 0; n < needed && fillableIdxs.length > 0; n++) {
      const pick = fillableIdxs.splice(randInt(0, fillableIdxs.length - 1), 1)[0];
      statuses[pick] = 'Interview';
    }
  }

  const apps = companies.map((c, i) => {
    const status = statuses[i];
    const age = dayOffsets[i];
    const hasFollowUp = status === 'Interview' || status === 'Offer';
    const resumeId = Math.random() > 0.25 ? resumes[randInt(0, resumes.length - 1)].id : '';

    return {
      id: `seed_app_${i}_${e}_${Date.now()}`,
      company: c.company,
      title: c.title,
      date: daysAgo(age),
      status,
      location: c.location || '',
      notes: pick(NOTES_BY_STATUS[status] || ['']),
      followUpDate: hasFollowUp ? daysFromNow(randInt(3, 21)) : '',
      resumeId,
      archived: false,
      createdAt: new Date(Date.now() - age * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - age * 86400000).toISOString(),
    };
  });

  // Pick 5–8 random reminders
  const reminderCount = randInt(5, 8);
  const pickedReminders = shuffle(REMINDER_POOL).slice(0, reminderCount);
  const reminders = pickedReminders.map((r, i) => {
    const offsetDays = pick([-7, -4, -2, 0, 1, 2, 3, 5, 7, 10, 12, 14]);
    const done = offsetDays < 0;
    return {
      id: `seed_rem_${i}_${e}_${Date.now()}`,
      title: r.title || r.company || 'Reminder',
      date: offsetDays >= 0 ? daysFromNow(offsetDays) : daysAgo(-offsetDays),
      time: r.time,
      notes: r.notes || '',
      done,
      createdAt: new Date().toISOString(),
    };
  });

  try {
    localStorage.setItem(`hivio_applications_${e}`, JSON.stringify(apps));
    localStorage.setItem(`hivio_resumes_${e}`, JSON.stringify(resumes));
    localStorage.setItem(`hivio_reminders_${e}`, JSON.stringify(reminders));
  } catch (err) {
    console.error('Seed failed:', err);
  }
}

export function clearUserData(email) {
  const e = email.toLowerCase();
  localStorage.removeItem(`hivio_applications_${e}`);
  localStorage.removeItem(`hivio_resumes_${e}`);
  localStorage.removeItem(`hivio_reminders_${e}`);
}
