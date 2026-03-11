import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import type { JobApplication } from '../context/AppContext';

const STATUS_COLORS: Record<JobApplication['status'], string> = {
  Applied: 'bg-blue-500',
  Interview: 'bg-purple-500',
  Offer: 'bg-green-500',
  Rejected: 'bg-red-400',
  Saved: 'bg-slate-400',
};

export default function Analytics() {
  const { applications } = useAppContext();

  const statusCounts = (['Applied', 'Interview', 'Offer', 'Rejected', 'Saved'] as const).map(s => ({
    status: s,
    count: applications.filter(a => a.status === s).length,
    color: STATUS_COLORS[s],
  }));

  const total = applications.length;
  const responseRate = total > 0
    ? Math.round((applications.filter(a => a.status === 'Interview' || a.status === 'Offer').length / total) * 100)
    : 0;

  return (
    <div className="px-5 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Your job search insights</p>
      </motion.div>

      {/* Response rate card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#2C6E91] to-[#1F5170] rounded-2xl p-5 text-white mb-4 shadow-lg shadow-[#2C6E91]/20"
      >
        <p className="text-white/70 text-sm">Response Rate</p>
        <p className="text-4xl font-bold mt-1">{responseRate}%</p>
        <p className="text-white/60 text-xs mt-1">Based on {total} applications</p>
      </motion.div>

      {/* Status breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
      >
        <p className="text-sm font-semibold text-slate-700 mb-4">Status Breakdown</p>
        <div className="space-y-3">
          {statusCounts.map(({ status, count, color }) => (
            <div key={status} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-sm text-slate-600 flex-1">{status}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 mx-2">
                <div
                  className={`h-1.5 rounded-full ${color} transition-all`}
                  style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
