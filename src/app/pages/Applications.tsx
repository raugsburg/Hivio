import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import type { JobApplication } from '../context/AppContext';

const STATUSES: Array<JobApplication['status'] | 'All'> = ['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'Saved'];

export default function Applications() {
  const navigate = useNavigate();
  const { applications } = useAppContext();
  const [filter, setFilter] = useState<typeof STATUSES[number]>('All');
  const [search, setSearch] = useState('');

  const filtered = applications.filter(app => {
    const matchesFilter = filter === 'All' || app.status === filter;
    const matchesSearch = !search ||
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.role.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="px-5 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Applications</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search companies or roles..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91]"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === s
                  ? 'bg-[#2C6E91] text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="space-y-2">
        {filtered.map((app, i) => (
          <motion.button
            key={app.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => navigate(`/applications/${app.id}`)}
            className="w-full bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between hover:shadow-md transition-shadow text-left"
          >
            <div>
              <p className="font-semibold text-slate-800">{app.company}</p>
              <p className="text-sm text-slate-400 mt-0.5">{app.role}</p>
              {app.location && <p className="text-xs text-slate-300 mt-0.5">{app.location}</p>}
            </div>
            <StatusBadge status={app.status} />
          </motion.button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg">No applications found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/applications/new')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#2C6E91] rounded-full shadow-lg shadow-[#2C6E91]/40 flex items-center justify-center"
      >
        <Plus size={24} className="text-white" />
      </motion.button>
    </div>
  );
}
