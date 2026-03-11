import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Camera, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useAppContext } from "../context/AppContext";

export function ProfileSetup() {
  const navigate = useNavigate();
  const { setUser } = useAppContext();
  
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ major: "", school: "", gradYear: "", location: "" });

  const handleNext = () => setStep(2);
  const handleComplete = () => {
    // In a real app we'd update user
    navigate("/dashboard");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col min-h-screen px-8 py-10 bg-white relative"
    >
      <div className="flex items-center justify-between mb-10 mt-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Profile</h1>
        <div className="text-sm font-semibold text-slate-400">Step {step} of 2</div>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative group cursor-pointer">
          <div className="w-24 h-24 bg-slate-100 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-[#2C6E91] transition-all">
            <Camera size={32} />
          </div>
          <div className="absolute bottom-0 right-0 bg-[#2C6E91] text-white p-1.5 rounded-full border-2 border-white">
            <Camera size={14} />
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-500 mt-4">Add a photo</p>
      </div>

      {step === 1 ? (
        <motion.div 
          key="step1"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="space-y-4 flex-1"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">University / School</label>
            <input type="text" placeholder="State University" value={data.school} onChange={e => setData({...data, school: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Major</label>
            <input type="text" placeholder="Computer Science" value={data.major} onChange={e => setData({...data, major: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Graduation Year</label>
            <input type="text" placeholder="2024" value={data.gradYear} onChange={e => setData({...data, gradYear: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91]" />
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="step2"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="space-y-4 flex-1"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3 ml-1">Career Interests</label>
            <div className="flex flex-wrap gap-2">
              {["Frontend", "Backend", "UX Design", "Product Mgmt", "Data Science", "Marketing"].map(tag => (
                <button key={tag} className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:border-[#2C6E91] hover:text-[#2C6E91] focus:ring-2 focus:ring-[#2C6E91]/30 transition-all">
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Preferred Location</label>
            <input type="text" placeholder="Remote / New York / San Francisco" value={data.location} onChange={e => setData({...data, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91]" />
          </div>
        </motion.div>
      )}

      <button 
        onClick={step === 1 ? handleNext : handleComplete}
        className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-8 mb-6"
      >
        {step === 1 ? "Next Step" : "Save and Continue"}
      </button>
    </motion.div>
  );
}
