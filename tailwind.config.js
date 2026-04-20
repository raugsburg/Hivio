/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        hivio: {
          primary:           '#6366F1',
          'primary-hover':   '#4F46E5',
          'primary-light':   '#EEF2FF',
          'primary-ghost':   '#E0E7FF',

          bg:                '#FAFAFA',
          surface:           '#FFFFFF',
          border:            '#E5E7EB',
          'border-focus':    '#A5B4FC',
          'text-primary':    '#111827',
          'text-secondary':  '#6B7280',
          'text-muted':      '#9CA3AF',
          'text-inverse':    '#FFFFFF',

          'bg-dark':         '#080E18',
          'surface-dark':    '#0D1626',
          'border-dark':     'rgba(255,255,255,0.07)',
          'text-primary-dark':   '#EDF2F7',
          'text-secondary-dark': '#7A96AB',
          'text-muted-dark':     '#3D5568',

          'status-applied':    '#4A7FA5',
          'status-interview':  '#9A7230',
          'status-offer':      '#2E8A5F',
          'status-rejected':   '#9A4A4A',
          'status-saved':      '#6B52A8',
          'status-ghosted':    '#6B7280',

          'status-applied-bg':   '#EAF1F7',
          'status-interview-bg': '#F7F0E4',
          'status-offer-bg':     '#E4F2EC',
          'status-rejected-bg':  '#F2E6E6',
          'status-saved-bg':     '#EDEBF7',
          'status-ghosted-bg':   '#F0F1F2',

          'status-applied-dark':      '#5eab7e',
          'status-applied-bg-dark':   '#1e3a2f',
          'status-interview-dark':    '#7eaadc',
          'status-interview-bg-dark': '#2a3f5f',
          'status-offer-dark':        '#8ab55e',
          'status-offer-bg-dark':     '#2e3a1e',
          'status-rejected-dark':     '#c47a7a',
          'status-rejected-bg-dark':  '#3d2020',
        },
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      boxShadow: {
        'hivio-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'hivio':    '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'hivio-md': '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'hivio-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
