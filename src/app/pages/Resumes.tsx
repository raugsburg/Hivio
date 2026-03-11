import { motion } from 'framer-motion';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Resumes() {
  const { resumes, deleteResume } = useAppContext();

  return (
    <div className="px-5 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Resumes</h1>
        <button className="w-9 h-9 bg-[#2C6E91] rounded-xl flex items-center justify-center shadow-md shadow-[#2C6E91]/25">
          <Plus size={18} className="text-white" />
        </button>
      </motion.div>

      <div className="space-y-3">
        {resumes.map((resume, i) => (
          <motion.div
            key={resume.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center gap-3"
          >
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={20} className="text-[#2C6E91]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{resume.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{resume.version} · Modified {resume.lastModified}</p>
            </div>
            <button onClick={() => deleteResume(resume.id)} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
              <Trash2 size={14} className="text-slate-400" />
            </button>
          </motion.div>
        ))}
      </div>

      {resumes.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p>No resumes yet</p>
          <p className="text-sm mt-1">Tap + to add your first resume</p>
        </div>
      )}
    </div>
  );
}
