import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  PlayCircle,
  Trophy,
  Target,
  BarChart3,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Code2,
  Cpu,
  Users2,
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function DashboardPage({ onStartNew, onViewResults, onResumeInterview }) {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [historyRes, analyticsRes] = await Promise.all([
          api.getHistory().catch(() => ({ interviews: [] })),
          api.getAnalytics().catch(() => ({ analytics: null }))
        ]);
        setInterviews(historyRes.interviews || []);
        setAnalytics(analyticsRes.analytics || null);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const avgScore = analytics?.averageScore || 0;
  const completedCount = analytics?.completedCount || 0;
  const totalCount = analytics?.totalInterviews || interviews.length;

  // Track icon helper
  const getTrackIcon = (category) => {
    switch (category) {
      case 'coding':
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'hr':
        return <Users2 className="w-4 h-4 text-purple-400" />;
      default:
        return <Cpu className="w-4 h-4 text-brand-400" />;
    }
  };

  // Score badge color helper
  const getScoreBadge = (score) => {
    if (score === null || score === undefined) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          In Progress
        </span>
      );
    }
    if (score >= 85) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {score}% Strong Hire
        </span>
      );
    }
    if (score >= 70) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
          {score}% Hire
        </span>
      );
    }
    if (score >= 55) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {score}% Leaning Hire
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        {score}% Needs Work
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-brand-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Student Practice Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Candidate'} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your simulation trajectory, target weak areas, and rehearse technical & HR scenarios.
          </p>
        </div>

        <button
          onClick={onStartNew}
          className="px-6 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2.5 transition-all text-sm shrink-0 group"
        >
          <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Start New Interview</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        
        {/* Total Interviews */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sessions</span>
            <Layers className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{totalCount}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>{completedCount} evaluated to completion</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {avgScore > 0 ? `${avgScore}%` : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {avgScore >= 75 ? 'Above typical hire benchmark' : 'Keep practicing to hit 75%+'}
          </div>
        </div>

        {/* Readiness Index */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Readiness Tier</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {avgScore >= 80 ? 'Interview Ready' : avgScore >= 60 ? 'Developing' : 'Foundational'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Based on Gemini scoring criteria
          </div>
        </div>

        {/* Active Engine */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Evaluator</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">Gemini 2.5</div>
          <div className="text-xs text-slate-400 mt-1">
            Structured JSON Rubric & Feedback
          </div>
        </div>

      </div>

      {/* Analytics & Weak Areas Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* Score Trend History */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                <span>Score Progress History</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Trajectory of evaluated interview sessions
              </p>
            </div>
          </div>

          {analytics?.scoreHistory && analytics.scoreHistory.length > 0 ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-end gap-3 h-40 pt-4 px-2 border-b border-slate-800">
                {analytics.scoreHistory.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[10px] font-mono font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.score}%
                    </div>
                    <div
                      style={{ height: `${Math.max(item.score, 15)}%` }}
                      className={`w-full max-w-[42px] rounded-t-lg transition-all ${
                        item.score >= 80
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          : item.score >= 65
                          ? 'bg-gradient-to-t from-brand-600 to-brand-400'
                          : 'bg-gradient-to-t from-amber-600 to-amber-400'
                      }`}
                    />
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-full">
                      {item.date}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 font-mono">
                <span>Earliest Session</span>
                <span>Latest Session</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Complete your first interview simulation to start tracking score trends!
            </div>
          )}
        </div>

        {/* Weak Areas & Focus Tips */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Priority Weak Areas</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Identified by Gemini AI from your past responses
            </p>

            {analytics?.recentWeakAreas && analytics.recentWeakAreas.length > 0 ? (
              <div className="space-y-2">
                {analytics.recentWeakAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No weak areas flagged yet. Complete an interview to analyze gaps.
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <button
              onClick={onStartNew}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-brand-300 flex items-center justify-center gap-2 transition-all"
            >
              <span>Practice Targeted Topics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Past Interviews Table / List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Interview History</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review questions, submitted answers, and Gemini critiques
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading interview records...</div>
        ) : interviews.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm mb-4">You have not taken any interview simulations yet.</p>
            <button
              onClick={onStartNew}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/30"
            >
              Launch Your First Simulation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {interviews.map((item) => (
              <div
                key={item.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getTrackIcon(item.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.role_title}</span>
                      <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700">
                        {item.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span>•</span>
                      <span>{item.question_count} Questions</span>
                      <span>•</span>
                      <span className="capitalize">{item.category} Track</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {getScoreBadge(item.overall_score)}
                  
                  {item.status === 'completed' ? (
                    <button
                      onClick={() => onViewResults(item.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>View Evaluation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onResumeInterview(item.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>Resume</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
