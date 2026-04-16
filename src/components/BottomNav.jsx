import React from 'react';

function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={active ? '0' : '1.75'}
          strokeLinecap="round" strokeLinejoin="round">
          {active
            ? <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            : <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>
          }
        </svg>
      )
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={active ? '0' : '1.75'}
          strokeLinecap="round" strokeLinejoin="round">
          {active
            ? <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9 9v-4h2v4h-2zm-4 0V9h2v7H7zm8 0V9h2v7h-2z"/>
            : <><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>
          }
        </svg>
      )
    },
    {
      id: 'resumes',
      label: 'Resumes',
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={active ? '0' : '1.75'}
          strokeLinecap="round" strokeLinejoin="round">
          {active
            ? <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 8H13V3.5zM8 13h8v1.5H8V13zm0 3h8v1.5H8V16zm0-6h3v1.5H8V10z"/>
            : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>
          }
        </svg>
      )
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={active ? '0' : '1.75'}
          strokeLinecap="round" strokeLinejoin="round">
          {active
            ? <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM8 2v4m8-4v4M3 10h18v2H3z"/>
            : <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>
          }
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={active ? '0' : '1.75'}
          strokeLinecap="round" strokeLinejoin="round">
          {active
            ? <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.32.07-.64.07-.98s-.03-.67-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.33-.07.65-.07.98s.03.65.07.98l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/>
            : <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>
          }
        </svg>
      )
    }
  ];

  return (
    <nav
      style={{
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        boxShadow: 'var(--shadow-nav)',
      }}
      className="pt-2 pb-4 px-1"
    >
      <div className="flex justify-around items-center">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 min-w-[60px] min-h-[48px] justify-center transition-all duration-200 relative"
              style={{ color: active ? 'var(--brand)' : 'var(--text-3)' }}
            >
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 32,
                    height: 3,
                    borderRadius: '0 0 4px 4px',
                    background: 'var(--brand)',
                  }}
                />
              )}
              <div
                style={{
                  padding: '5px 12px',
                  borderRadius: 10,
                  background: active ? 'var(--brand-light)' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                {tab.icon(active)}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '0.01em',
                  lineHeight: 1.6,
                  paddingBottom: 1,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
