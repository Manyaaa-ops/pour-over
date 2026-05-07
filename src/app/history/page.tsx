"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pour-over.onrender.com";

interface HistoryItem {
  video_id: string;
  score: number;
  technique_score: number;
  consistency_score: number;
  latte_art_score: number;
  design: string;
  timestamp: string;
}

interface Summary {
  total_analyses: number;
  avg_score: number;
  best_design: string;
  improvement: number;
  recent_scores: number[];
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("http://BACKEND_URL/api/v1/auth/me");
      const data = await res.json();
      setUser(data);
      if (data.token) {
        fetchHistory(data.token);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (token: string) => {
    try {
      const res = await fetch("http://BACKEND_URL/api/v1/auth/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data.history || []);
      setSummary(data.summary);
    } catch (e) {
      console.error(e);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-amber-100";
    return "bg-red-100";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-32 text-center">
          <p className="text-espresso/60">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-display text-espresso mb-2">
              📊 Progress Dashboard
            </h1>
            <p className="text-espresso/60 mb-8">
              Track your improvement over time
            </p>
          </motion.div>

          {user?.guest ? (
            <div className="glass-card rounded-3xl p-8 text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-xl font-medium text-espresso mb-2">
                Login to View Progress
              </h2>
              <p className="text-espresso/60">
                Sign in at the Analyze page to track your progress
              </p>
            </div>
          ) : (
            <>
              {summary && (
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                  <div className="glass-card p-6 rounded-2xl text-center">
                    <p className="text-4xl font-display text-espresso">
                      {summary.total_analyses}
                    </p>
                    <p className="text-sm text-espresso/60">Total Analyses</p>
                  </div>
                  <div className="glass-card p-6 rounded-2xl text-center">
                    <p className={`text-4xl font-display ${getScoreColor(summary.avg_score)}`}>
                      {summary.avg_score}
                    </p>
                    <p className="text-sm text-espresso/60">Average Score</p>
                  </div>
                  <div className="glass-card p-6 rounded-2xl text-center">
                    <p className="text-4xl font-display text-warm-gold">
                      {summary.best_design}
                    </p>
                    <p className="text-sm text-espresso/60">Best Design</p>
                  </div>
                  <div className="glass-card p-6 rounded-2xl text-center">
                    <p className={`text-4xl font-display ${summary.improvement >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {summary.improvement >= 0 ? "+" : ""}{summary.improvement}
                    </p>
                    <p className="text-sm text-espresso/60">Improvement</p>
                  </div>
                </div>
              )}

              {summary?.recent_scores && summary.recent_scores.length > 0 && (
                <div className="glass-card p-6 rounded-2xl mb-8">
                  <h3 className="font-medium text-espresso mb-4">Recent Scores</h3>
                  <div className="flex items-end gap-2 h-32">
                    {summary.recent_scores.map((score: number, i: number) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div 
                          className={`w-full rounded-t-lg ${getScoreBg(score)}`}
                          style={{ height: `${score}%` }}
                        />
                        <span className="text-xs text-espresso/60 mt-1">{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-espresso/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Design</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Overall</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Technique</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Consistency</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Latte Art</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-espresso/60">
                            No analyses yet. Start practicing!
                          </td>
                        </tr>
                      ) : (
                        history.slice().reverse().map((item, i) => (
                          <tr key={i} className="border-t border-espresso/10">
                            <td className="px-4 py-3 text-sm text-espresso/60">{item.timestamp}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-warm-gold/20 rounded-full text-sm">
                                {item.design}
                              </span>
                            </td>
                            <td className={`px-4 py-3 font-medium ${getScoreColor(item.score)}`}>
                              {item.score}
                            </td>
                            <td className={`px-4 py-3 ${getScoreColor(item.technique_score)}`}>
                              {item.technique_score}
                            </td>
                            <td className={`px-4 py-3 ${getScoreColor(item.consistency_score)}`}>
                              {item.consistency_score}
                            </td>
                            <td className={`px-4 py-3 ${getScoreColor(item.latte_art_score)}`}>
                              {item.latte_art_score}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}