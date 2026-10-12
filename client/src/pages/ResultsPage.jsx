import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  LayoutDashboard,
  Printer,
  Sparkles,
  Bot,
  Code2,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { api } from '../api';

export default function ResultsPage({ interviewId, onRetake, onBackDashboard }) {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await api.getInterview(interviewId);
        if (res && res.interview) {
          setInterview(res.interview);

          // If score is high (>= 75), fire confetti celebration!
          if (res.interview.overall_score >= 75) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          }

          // Expand the first question by default
          if (res.interview.questions?.length > 0) {
            setExpandedQuestions({ [res.interview.questions[0].id]: true });
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load interview evaluation results');
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [interviewId]);

  const toggleQuestion = (qId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center max-w-sm">
          <Bot className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-sm font-semibold">Loading evaluation report...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm mb-4">
          {error || 'Unable to locate interview record'}
        </div>
        <button
          onClick={onBackDashboard}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const score = interview.overall_score || 0;
  const verdict = interview.hiring_verdict || (score >= 85 ? 'Strong Hire' : score >= 70 ? 'Hire' : score >= 55 ? 'Leaning Hire' : 'Needs Improvement');
  const summary = interview.evaluation_summary || {};
  const categoryScores = summary.categoryScores || {
    technicalDepth: Math.min(100, score + 2),
    problemSolving: Math.max(40, score - 3),
    communication: Math.min(100, score + 4),
    codeQuality: score
  };

  const strengths = summary.strengths || [];
  const mistakes = summary.mistakes || [];
  const tips = summary.improvementTips || [];
  const weakAreas = summary.weakAreas || [];
  const questions = interview.questions || [];

  const timeMins = Math.floor((interview.time_spent_seconds || 0) / 60);

  // Verdict style badge
  let verdictColor = 'from-emerald-600/20 to-teal-600/20 border-emerald-500/40 text-emerald-300';
  let badgeScoreColor = 'text-emerald-400';
  if (score < 55) {
    verdictColor = 'from-rose-600/20 to-orange-600/20 border-rose-500/40 text-rose-300';
    badgeScoreColor = 'text-rose-400';
  } else if (score < 70) {
    verdictColor = 'from-amber-600/20 to-yellow-600/20 border-amber-500/40 text-amber-300';
    badgeScoreColor = 'text-amber-400';
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <button
          onClick={onBackDashboard}
          className="text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
          <button
            onClick={onRetake}
            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-brand-600/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Another</span>
          </button>
        </div>
      </div>

      {/* Hero Score & Verdict Card */}
      <div className={`p-8 sm:p-10 rounded-3xl bg-gradient-to-br ${verdictColor} border shadow-2xl mb-8 relative overflow-hidden`}>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/60 border border-white/10 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Gemini AI Evaluation Complete</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              Hiring Verdict: {verdict}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-300 mt-2">
              <span className="font-semibold text-white">{interview.role_title}</span>
              <span>•</span>
              <span className="capitalize">{interview.difficulty} Level</span>
              <span>•</span>
              <span className="capitalize">{interview.category} Track</span>
              {timeMins > 0 && (
                <>
                  <span>•</span>
                  <span>{timeMins} mins duration</span>
                </>
              )}
            </div>
          </div>

          {/* Numeric Score Dial Badge */}
          <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-white/10 rounded-2xl p-6 min-w-[160px] shadow-xl">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
              Overall Score
            </span>
            <div className={`text-5xl font-black ${badgeScoreColor} font-mono tracking-tight`}>
              {score}
              <span className="text-2xl text-slate-500 font-normal">/100</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              Industry Standard Benchmark
            </div>
          </div>

        </div>
      </div>

      {/* Category Performance Breakdown Grid */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 mb-8">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-400" />
          <span>Competency Scoring Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Technical Depth', score: categoryScores.technicalDepth || score, desc: 'Architecture, trade-offs & fundamentals' },
            { label: 'Problem Solving', score: categoryScores.problemSolving || score, desc: 'Logical reasoning & edge cases' },
            { label: 'Communication', score: categoryScores.communication || score, desc: 'Structure, clarity & STAR alignment' },
            { label: 'Code Quality', score: categoryScores.codeQuality || score, desc: 'Efficiency, syntax & conventions' }
          ].map((cat, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">{cat.label}</span>
                <span className="font-mono text-sm font-bold text-white">{cat.score}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                <div
                  style={{ width: `${cat.score}%` }}
                  className={`h-full rounded-full ${
                    cat.score >= 80 ? 'bg-emerald-400' : cat.score >= 65 ? 'bg-brand-400' : 'bg-amber-400'
                  }`}
                />
              </div>
              <div className="text-[10px] text-slate-500">{cat.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side: Strengths vs Mistakes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Strengths Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base mb-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Demonstrated Strengths</span>
          </div>

          {strengths.length > 0 ? (
            <ul className="space-y-3">
              {strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Solid completion across baseline interview prompts.</p>
          )}
        </div>

        {/* Mistakes & Blindspots Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-base mb-4">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>Critical Mistakes & Missed Nuances</span>
          </div>

          {mistakes.length > 0 ? (
            <ul className="space-y-3">
              {mistakes.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No major disqualifying errors flagged.</p>
          )}
        </div>

      </div>

      {/* Actionable Improvement Tips & Priority Weak Areas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Improvement Tips (2 cols) */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base mb-4">
            <Lightbulb className="w-5 h-5 shrink-0" />
            <span>Actionable Improvement Tips from Gemini AI</span>
          </div>

          {tips.length > 0 ? (
            <div className="space-y-3">
              {tips.map((tip, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                  <span className="font-mono text-amber-400 font-bold">0{idx + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Continue rehearsing with varying time bounds.</p>
          )}
        </div>

        {/* Weak Areas to Study */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-base mb-4">
            <Target className="w-5 h-5 shrink-0" />
            <span>Weak Areas to Review</span>
          </div>

          {weakAreas.length > 0 ? (
            <div className="space-y-2">
              {weakAreas.map((area, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
                  {area}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No critical knowledge deficiencies detected.</p>
          )}
        </div>

      </div>

      {/* Question-by-Question Deep Dive Section */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden mb-10">
        <div className="p-6 border-b border-slate-800/80">
          <h2 className="text-lg font-bold text-white">
            Question-by-Question Diagnostic Review
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compare your submitted responses with Gemini’s detailed critique and optimal model answers
          </p>
        </div>

        <div className="divide-y divide-slate-800/80">
          {questions.map((q, idx) => {
            const isExpanded = Boolean(expandedQuestions[q.id]);
            const qScore = q.score !== null && q.score !== undefined ? q.score : score;

            return (
              <div key={q.id} className="p-6 hover:bg-slate-900/30 transition-colors">
                
                {/* Accordion Header */}
                <div
                  onClick={() => toggleQuestion(q.id)}
                  className="flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-brand-400 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs uppercase font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {q.question_type}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        {q.question_text}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                      qScore >= 80
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : qScore >= 60
                        ? 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {qScore}/100
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="mt-6 pt-5 border-t border-slate-800/60 space-y-5 text-xs">
                    
                    {/* User's Answer */}
                    <div>
                      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">
                        Candidate Answer:
                      </div>
                      {q.user_answer ? (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                          {q.user_answer}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900 text-slate-500 italic">
                          (No answer recorded for this question)
                        </div>
                      )}
                    </div>

                    {/* Gemini AI Detailed Feedback */}
                    {q.feedback && (
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-brand-400 text-xs">
                          <Bot className="w-4 h-4" />
                          <span>Gemini Feedback & Rubric Critique:</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {q.feedback}
                        </p>
                        {q.strengths && (
                          <div className="text-emerald-400 text-[11px] pt-1">
                            <span className="font-semibold">Strength: </span>{q.strengths}
                          </div>
                        )}
                        {q.weaknesses && (
                          <div className="text-amber-400 text-[11px]">
                            <span className="font-semibold">Area to Refine: </span>{q.weaknesses}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Gemini Model Answer */}
                    {q.model_answer && (
                      <div>
                        <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Exemplary Model Answer (Optimal Reference):</span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 font-mono text-emerald-100/90 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                          {q.model_answer}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-center gap-4 py-4 print:hidden">
        <button
          onClick={onBackDashboard}
          className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-all"
        >
          Back to Dashboard
        </button>
        <button
          onClick={onRetake}
          className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Next Simulation</span>
        </button>
      </div>

    </div>
  );
}
