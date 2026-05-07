"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pour-over.onrender.com";

interface TeamMember {
  member_id: string;
  analyses: number;
  avg_score: number;
  latest_score: number;
  is_certified: boolean;
  recent_designs: string[];
}

interface LeaderboardEntry {
  rank: number;
  member_id: string;
  avg_score: number;
  latest_score: number;
  improvement: number;
  total_analyses: number;
}

interface TeamStats {
  total_analyses: number;
  team_size: number;
  certified_members: number;
  avg_score: number;
  ready_to_serve: number;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [activeView, setActiveView] = useState<"members" | "leaderboard" | "stats">("members");
  const [joinTeamId, setJoinTeamId] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      // Use deployed backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pour-over.onrender.com";
      const data = await res.json();
      setUser(data);
      if (data.token) {
        loadTeamData(data.token);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamData = async (token: string) => {
    try {
      // Get user's team - for now, assume first team
      const res = await fetch("http://BACKEND_URL/api/v1/auth/teams", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.teams && Object.keys(data.teams).length > 0) {
        const teamId = Object.keys(data.teams)[0];
        const teamData = data.teams[teamId];
        setMyTeam({ id: teamId, ...teamData });
        
        // Load members
        const membersRes = await fetch(`http://BACKEND_URL/api/v1/auth/teams/${teamId}/members`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const membersData = await membersRes.json();
        setTeamMembers(membersData.members || []);
        
        // Load leaderboard
        const lbRes = await fetch(`http://BACKEND_URL/api/v1/auth/teams/${teamId}/leaderboard`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const lbData = await lbRes.json();
        setLeaderboard(lbData.leaderboard || []);
        
        // Load stats
        const statsRes = await fetch(`http://BACKEND_URL/api/v1/auth/teams/${teamId}/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim() || !user?.token) return;
    
    try {
      const res = await fetch("http://BACKEND_URL/api/v1/auth/teams/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({ name: newTeamName })
      });
      const data = await res.json();
      if (data.team) {
        setMyTeam({ id: data.team_id, ...data.team });
        loadTeamData(user.token);
      }
    } catch (e) {
      console.error(e);
    }
    
    setShowCreate(false);
    setNewTeamName("");
  };

  const joinTeam = async () => {
    if (!joinTeamId.trim() || !user?.token) return;
    
    try {
      await fetch(`http://BACKEND_URL/api/v1/auth/teams/${joinTeamId}/join`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      loadTeamData(user.token);
    } catch (e) {
      console.error(e);
    }
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-500";
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
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display text-espresso mb-4">
              👥 Cafe Management
            </h1>
            <p className="text-espresso/60 text-lg">
              Manage your barista team and track performance
            </p>
          </motion.div>

          {user?.guest ? (
            <div className="glass-card rounded-3xl p-8 text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-xl font-medium text-espresso mb-2">
                Login to Manage Team
              </h2>
              <p className="text-espresso/60">
                Login at Analyze page to create or join teams
              </p>
            </div>
          ) : (
            <>
              {!myTeam ? (
                <>
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="glass-card p-6 rounded-2xl">
                      <h3 className="font-medium text-espresso mb-4">Create New Team</h3>
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        placeholder="Cafe name (e.g., Downtown Coffee)"
                        className="w-full px-4 py-3 rounded-full border border-espresso/20 bg-white focus:outline-none focus:border-warm-gold mb-4"
                      />
                      <button
                        onClick={createTeam}
                        className="w-full btn-primary"
                      >
                        Create Team
                      </button>
                    </div>
                    
                    <div className="glass-card p-6 rounded-2xl">
                      <h3 className="font-medium text-espresso mb-4">Join Existing Team</h3>
                      <input
                        type="text"
                        value={joinTeamId}
                        onChange={e => setJoinTeamId(e.target.value)}
                        placeholder="Team ID"
                        className="w-full px-4 py-3 rounded-full border border-espresso/20 bg-white focus:outline-none focus:border-warm-gold mb-4"
                      />
                      <button
                        onClick={joinTeam}
                        className="w-full btn-secondary"
                      >
                        Join Team
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="glass-card p-6 rounded-2xl mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-medium text-espresso">
                        🏪 {myTeam.name}
                      </h2>
                      <span className="text-sm text-espresso/60">
                        Team ID: {myTeam.id}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      {(["members", "leaderboard", "stats"] as const).map((view) => (
                        <button
                          key={view}
                          onClick={() => setActiveView(view)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            activeView === view
                              ? "bg-espresso text-cream"
                              : "bg-espresso/10 text-espresso"
                          }`}
                        >
                          {view === "members" && "👥 Members"}
                          {view === "leaderboard" && "🏆 Leaderboard"}
                          {view === "stats" && "📊 Stats"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeView === "members" && (
                    <div className="glass-card rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-espresso/5">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Barista</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Analyses</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Avg Score</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Latest</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-espresso">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamMembers.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-espresso/60">
                                  No team members yet
                                </td>
                              </tr>
                            ) : (
                              teamMembers.map((member) => (
                                <tr key={member.member_id} className="border-t border-espresso/10">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-warm-gold/20 rounded-full flex items-center justify-center">
                                        {member.member_id.slice(0, 2).toUpperCase()}
                                      </div>
                                      <span className="text-sm">{member.member_id.slice(0, 8)}...</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm">{member.analyses}</td>
                                  <td className={`px-4 py-3 font-medium ${getScoreColor(member.avg_score)}`}>
                                    {member.avg_score}
                                  </td>
                                  <td className={`px-4 py-3 ${getScoreColor(member.latest_score)}`}>
                                    {member.latest_score}
                                  </td>
                                  <td className="px-4 py-3">
                                    {member.is_certified ? (
                                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                        ✅ Certified
                                      </span>
                                    ) : (
                                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                                        Learning
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeView === "leaderboard" && (
                    <div className="space-y-4">
                      {leaderboard.map((entry) => (
                        <motion.div
                          key={entry.member_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`glass-card p-4 rounded-xl flex items-center gap-4 ${
                            entry.rank <= 3 ? "border-2 border-warm-gold" : ""
                          }`}
                        >
                          <span className="text-2xl w-12 text-center">
                            {getRankEmoji(entry.rank)}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-espresso">
                              {entry.member_id.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-espresso/60">
                              {entry.total_analyses} analyses
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${getScoreColor(entry.avg_score)}`}>
                              {entry.avg_score}
                            </p>
                            <p className="text-xs text-espresso/60">
                              avg score
                            </p>
                          </div>
                          {entry.improvement > 0 && (
                            <div className="text-right">
                              <p className="text-green-600 font-medium">+{entry.improvement}</p>
                              <p className="text-xs text-espresso/60">improvement</p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                      
                      {leaderboard.length === 0 && (
                        <div className="glass-card p-8 text-center text-espresso/60">
                          No leaderboard data yet
                        </div>
                      )}
                    </div>
                  )}

                  {activeView === "stats" && stats && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="glass-card p-6 rounded-2xl text-center">
                        <p className="text-4xl font-display text-espresso">
                          {stats.total_analyses}
                        </p>
                        <p className="text-sm text-espresso/60">Total Analyses</p>
                      </div>
                      <div className="glass-card p-6 rounded-2xl text-center">
                        <p className="text-4xl font-display text-warm-gold">
                          {stats.certified_members}
                        </p>
                        <p className="text-sm text-espresso/60">Certified Baristas</p>
                      </div>
                      <div className="glass-card p-6 rounded-2xl text-center">
                        <p className={`text-4xl font-display ${getScoreColor(stats.avg_score)}`}>
                          {stats.avg_score}
                        </p>
                        <p className="text-sm text-espresso/60">Team Average</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}