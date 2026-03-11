import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Clock, CheckCircle, Target } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, applications } = useAppContext();

  const stats = {
    total: applications.length,
    interviews: applications.filter(a => a.status === 'Interview').length,
    offers: applications.filter(a => a.status === 'Offer').length,
    pending: applications.filter(a => a.status === 'Applied').length,
  };

  const recentApps = applications.slice(0, 3);

  return (
    <div className="px-5 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-slate-500 text-sm mb-1">Good morning 👋</p>
        <h1 className="text-2xl font-bold text-slate-800">{user?.name?.split(' ')[0] ?? 'Student'}</h1>
        {user?.school && <p className="text-slate-400 text-sm mt-0.5">{user.school}</p>}
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        {[
          { label: 'Total Applied', value: stats.total, icon: Target, color: 'text-[#2C6E91]', bg: 'bg-blue-50' },
          { label: 'Interviews', value: stats.interviews, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Offers', value: stats.offers, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending', value: stats.pending, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Recent Applications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800">Recent Applications</h2>
          <button
            onClick={() => navigate('/applications')}
            className="text-sm text-[#2C6E91] font-medium"
          >
            See all
          </button>
        </div>

        <div className="space-y-2">
          {recentApps.map((app, i) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              onClick={() => navigate(`/applications/${app.id}`)}
              className="w-full bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="text-left">
                <p className="font-semibold text-slate-800 text-sm">{app.company}</p>
                <p className="text-xs text-slate-400 mt-0.5">{app.role}</p>
              </div>
              <StatusBadge status={app.status} />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/applications/new')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#2C6E91] rounded-full shadow-lg shadow-[#2C6E91]/40 flex items-center justify-center"
      >
        <Plus size={24} className="text-white" />
      </motion.button>
    </div>
  );
}
