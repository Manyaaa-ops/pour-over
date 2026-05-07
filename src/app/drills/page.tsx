"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

interface Drill {
  name: string;
  description: string;
  steps: string[];
  tips: string;
}

export default function DrillsPage() {
  const [drills, setDrills] = useState<Record<string, Drill>>({});
  const [activeDrill, setActiveDrill] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchDrills();
  }, []);

  const fetchDrills = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/drills");
      const data = await res.json();
      setDrills(data.drills || {});
    } catch (e) {
      console.error(e);
    }
  };

  const startPractice = () => {
    setPracticeMode(true);
    setTimer(0);
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopPractice = () => {
    setPracticeMode(false);
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeDrillData = activeDrill ? drills[activeDrill] : null;

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display text-espresso mb-4">
              🎯 Training Drills
            </h1>
            <p className="text-espresso/60 text-lg">
              Practice specific techniques to improve your pour
            </p>
          </motion.div>

          {!practiceMode ? (
            <>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {Object.entries(drills).map(([key, drill]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    className={`glass-card p-6 rounded-2xl cursor-pointer transition-all ${
                      activeDrill === key ? "ring-2 ring-warm-gold" : ""
                    }`}
                    onClick={() => setActiveDrill(key)}
                  >
                    <h3 className="text-lg font-medium text-espresso mb-2">
                      {drill.name}
                    </h3>
                    <p className="text-sm text-espresso/70 mb-4">
                      {drill.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {drill.steps.slice(0, 2).map((step, i) => (
                        <span key={i} className="text-xs text-espresso/50">
                          {i + 1}. {step.slice(0, 30)}...
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {activeDrillData && (
                <div className="glass-card rounded-3xl p-8 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-display text-espresso">
                      {activeDrillData.name}
                    </h2>
                    <button
                      onClick={startPractice}
                      className="btn-primary"
                    >
                      Start Practice Session
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="font-medium text-espresso mb-3">Steps:</h3>
                    <ol className="space-y-3">
                      {activeDrillData.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 bg-warm-gold/20 rounded-full flex items-center justify-center text-sm font-medium text-warm-gold">
                            {i + 1}
                          </span>
                          <span className="text-espresso/80">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div className="p-4 bg-warm-gold/10 rounded-xl">
                    <h4 className="font-medium text-espresso mb-2">💡 Pro Tip:</h4>
                    <p className="text-sm text-espresso/70">{activeDrillData.tips}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="mb-8">
                <p className="text-espresso/60 mb-2">Practice Mode</p>
                <p className="text-6xl font-display text-espresso">
                  {formatTime(timer)}
                </p>
              </div>
              
              {activeDrillData && (
                <div className="mb-8">
                  <h3 className="text-xl font-medium text-espresso mb-4">
                    {activeDrillData.name}
                  </h3>
                  <div className="text-left max-w-md mx-auto">
                    {activeDrillData.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 mb-3">
                        <span className="w-6 h-6 bg-warm-gold/20 rounded-full flex items-center justify-center text-xs">
                          {i + 1}
                        </span>
                        <span className="text-sm text-espresso/70">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={stopPractice}
                className="px-8 py-3 bg-red-500 text-white rounded-full font-medium"
              >
                Stop Practice
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}