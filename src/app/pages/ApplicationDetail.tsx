import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { applications, deleteApplication, updateApplication } = useAppContext();
  const app = applications.find(a => a.id === id);

  if (!app) {
    return (
      <div className="px-5 py-8 text-center text-slate-400">
        <p>Application not found</p>
      </div>
    );
  }

  function handleDelete() {
    if (id) {
      deleteApplication(id);
      navigate('/applications');
    }
  }

  return (
    <div className="px-5 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <button onClick={handleDelete} className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
          <Trash2 size={16} className="text-red-500" />
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{app.company}</h1>
              <p className="text-slate-500 text-sm mt-0.5">{app.role}</p>
              {app.location && <p className="text-slate-400 text-xs mt-0.5">{app.location}</p>}
            </div>
            <StatusBadge status={app.status} />
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-50 pt-3">
            Applied {new Date(app.dateApplied).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Status update */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {(['Applied', 'Interview', 'Offer', 'Rejected', 'Saved'] as const).map(s => (
              <button
                key={s}
                onClick={() => updateApplication(app.id, { status: s })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  app.status === s
                    ? 'bg-[#2C6E91] text-white border-[#2C6E91]'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#2C6E91]/40'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {app.notes && (
          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-4">
            <p className="text-sm font-medium text-slate-700 mb-1">Notes</p>
            <p className="text-sm text-slate-500">{app.notes}</p>
          </div>
        )}

        {app.url && (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 justify-center w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-medium border border-slate-200 hover:border-[#2C6E91]/40 transition-all"
          >
            <ExternalLink size={14} /> View Job Posting
          </a>
        )}
      </motion.div>
    </div>
  );
}
