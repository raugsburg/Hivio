import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Camera, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useAppContext } from "../context/AppContext";

export function ProfileSetup() {
  const navigate = useNavigate();
  const { user, setUser } = useAppContext();
  
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ major: "", school: "", gradYear: "" });
  const [preferences, setPreferences] = useState({
    primaryFocus: "Application Tracking",
    showStats: true,
    showUpcoming: true,
    showRecent: true,
  });

  const handleNext = () => setStep(2);
  const handleComplete = () => {
    if (user) {
      setUser({ ...user, dashboardPreferences: preferences });
    }
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
          className="space-y-6 flex-1"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3 ml-1">What's your primary focus?</label>
            <div className="grid grid-cols-2 gap-3">
              {["Application Tracking", "Resume Building", "Networking", "Interview Prep"].map(focus => (
                <button 
                  key={focus} 
                  onClick={() => setPreferences({ ...preferences, primaryFocus: focus })}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                    preferences.primaryFocus === focus 
                      ? "border-[#2C6E91] bg-blue-50/50 text-[#2C6E91] ring-1 ring-[#2C6E91]/20" 
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {focus}
                </button>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <label className="block text-sm font-semibold text-slate-700 mb-3 ml-1">Dashboard Widgets</label>
            <div className="space-y-3">
              {[
                { id: "showStats", label: "Quick Stats Summary", desc: "Total applications, interviews, etc." },
                { id: "showUpcoming", label: "Upcoming Tasks", desc: "Reminders and follow-ups due soon." },
                { id: "showRecent", label: "Recent Applications", desc: "Quick access to your latest activity." }
              ].map(widget => (
                <div key={widget.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{widget.label}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{widget.desc}</div>
                  </div>
                  <button 
                    onClick={() => setPreferences({ ...preferences, [widget.id]: !preferences[widget.id as keyof typeof preferences] })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      preferences[widget.id as keyof typeof preferences] ? "bg-[#2C6E91]" : "bg-slate-300"
                    }`}
                  >
                    <span 
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        preferences[widget.id as keyof typeof preferences] ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
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
