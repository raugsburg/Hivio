import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, MapPin, ChevronRight, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const CAREER_INTERESTS = [
  'Software Engineering', 'Product Management', 'Data Science',
  'UX Design', 'Marketing', 'Finance', 'Consulting', 'Research',
  'Healthcare', 'Education', 'Entrepreneurship', 'Law',
];

const GRAD_YEARS = ['2025', '2026', '2027', '2028', '2029'];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { updateProfile } = useAppContext();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    school: '',
    major: '',
    gradYear: '',
    location: '',
    careerInterests: [] as string[],
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function toggleInterest(interest: string) {
    setFormData(prev => ({
      ...prev,
      careerInterests: prev.careerInterests.includes(interest)
        ? prev.careerInterests.filter(i => i !== interest)
        : [...prev.careerInterests, interest],
    }));
  }

  function handleSave() {
    updateProfile(formData);
    navigate('/dashboard');
  }

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all";

  return (
    <div className="min-h-screen px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex gap-1.5">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-[#2C6E91] w-8' : 'bg-slate-200 w-4'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-1">{step} of 2</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">
          {step === 1 ? 'Your background' : 'Career interests'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {step === 1
            ? 'Help us personalize your experience'
            : 'Select all that apply'}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <GraduationCap size={14} className="inline mr-1.5 text-slate-400" />
                University / School
              </label>
              <input
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="e.g. University of Michigan"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Major</label>
              <input
                name="major"
                value={formData.major}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Graduation Year</label>
              <select
                name="gradYear"
                value={formData.gradYear}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select year</option>
                {GRAD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <MapPin size={14} className="inline mr-1.5 text-slate-400" />
                Location
              </label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. San Francisco, CA"
                className={inputClass}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-[#2C6E91] text-white font-semibold rounded-xl shadow-lg shadow-[#2C6E91]/25 hover:bg-[#245d7d] transition-colors flex items-center justify-center gap-2 mt-4"
            >
              Continue <ChevronRight size={18} />
            </motion.button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 text-slate-400 text-sm hover:text-slate-600 transition-colors"
            >
              Skip for now
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex flex-wrap gap-2 mb-8">
              {CAREER_INTERESTS.map(interest => {
                const selected = formData.careerInterests.includes(interest);
                return (
                  <motion.button
                    key={interest}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleInterest(interest)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-[#2C6E91] text-white border-[#2C6E91] shadow-md shadow-[#2C6E91]/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-[#2C6E91]/40'
                    }`}
                  >
                    {selected && <Check size={12} />}
                    {interest}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Back
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="flex-1 py-3.5 bg-[#2C6E91] text-white font-semibold rounded-xl shadow-lg shadow-[#2C6E91]/25 hover:bg-[#245d7d] transition-colors"
              >
                Save & Continue
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
