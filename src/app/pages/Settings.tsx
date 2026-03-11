import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Shield, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAppContext();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', action: () => navigate('/setup') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', action: () => {} },
        { icon: Shield, label: 'Privacy', action: () => {} },
      ],
    },
  ];

  return (
    <div className="px-5 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
      </motion.div>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-4 mb-5"
      >
        <div className="w-12 h-12 bg-[#2C6E91] rounded-2xl flex items-center justify-center">
          <span className="text-white text-lg font-bold">{user?.name?.[0]?.toUpperCase() ?? 'U'}</span>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          {user?.school && <p className="text-xs text-slate-300">{user.school}</p>}
        </div>
      </motion.div>

      {settingsGroups.map((group, gi) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + gi * 0.05 }}
          className="mb-4"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 ml-1">{group.title}</p>
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            {group.items.map(({ icon: Icon, label, action }, i) => (
              <button
                key={label}
                onClick={action}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${
                  i > 0 ? 'border-t border-slate-50' : ''
                }`}
              >
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Icon size={16} className="text-slate-500" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-slate-700">{label}</span>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Logout */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        className="w-full py-3.5 bg-red-50 text-red-500 font-semibold rounded-2xl flex items-center justify-center gap-2 border border-red-100 mt-2"
      >
        <LogOut size={18} />
        Sign Out
      </motion.button>
    </div>
  );
}
