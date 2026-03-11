import { NavLink, useResolvedPath, useMatch } from 'react-router-dom';
import { Home, Briefcase, FileText, BarChart2, Settings, type LucideIcon } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/applications', icon: Briefcase, label: 'Jobs' },
  { to: '/resumes', icon: FileText, label: 'Resumes' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function NavItem({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  const resolved = useResolvedPath(to);
  const isActive = useMatch({ path: resolved.pathname, end: to === '/applications' ? false : true }) !== null;

  return (
    <NavLink
      to={to}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
        isActive ? 'text-[#2C6E91]' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-100 px-2 py-2 z-50">
      <div className="flex items-center justify-around">
        {navItems.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}
