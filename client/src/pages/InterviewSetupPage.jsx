import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Code2,
  Users2,
  Layers,
  Clock,
  HelpCircle,
  ArrowRight,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Bot
} from 'lucide-react';
import { api } from '../api';

const PRESET_ROLES = [
  'Frontend Engineer',
  'Backend Engineer',
  'Full-Stack Developer',
  'Machine Learning Engineer',
  'DevOps & Cloud Engineer',
  'Mobile Developer (React Native/iOS)',
  'Data Scientist',
  'System Software Engineer'
];

const SUGGESTED_TOPICS = {
  technical: ['Distributed Systems', 'Database Indexing & Locks', 'Microservices Architecture', 'REST & GraphQL APIs', 'Caching with Redis', 'Concurrency & Threads', 'CI/CD Pipelines'],
  coding: ['Dynamic Programming', 'Binary Trees & Graphs', 'Two Pointers & Sliding Window', 'Recursion & Backtracking', 'String Manipulation', 'Hash Maps', 'Time & Space Complexity'],
  hr: ['STAR Methodology', 'Conflict Resolution', 'Handling Deadline Pressures', 'Project Ownership', 'Team Collaboration', 'Overcoming Technical Failure', 'Mentorship'],
  mixed: ['Full-Stack Architecture', 'Algorithms & Code Optimization', 'Behavioral Leadership', 'Database Scaling', 'API Design']
};

export default function InterviewSetupPage({ onInterviewCreated, onCancel }) {
  const [category, setCategory] = useState('technical');
  const [roleTitle, setRoleTitle] = useState('Frontend Engineer');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');
  
  const [difficulty, setDifficulty] = useState('mid');
  const [topics, setTopics] = useState(['Distributed Systems', 'REST & GraphQL APIs']);
  const [customTopicInput, setCustomTopicInput] = useState('');
  
  const [questionCount, setQuestionCount] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(30);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);

  // When category changes, refresh recommended topic suggestions
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const defaults = SUGGESTED_TOPICS[newCat] ? SUGGESTED_TOPICS[newCat].slice(0, 2) : ['Core Fundamentals'];
    setTopics(defaults);
  };

  const toggleTopic = (topic) => {
    if (topics.includes(topic)) {
      if (topics.length > 1) {
        setTopics(topics.filter(t => t !== topic));
      }
    } else {
      setTopics([...topics, topic]);
    }
  };

  const addCustomTopic = (e) => {
    e.preventDefault();
    const trimmed = customTopicInput.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setCustomTopicInput('');
    }
  };

  const removeTopic = (tToRemove) => {
    if (topics.length > 1) {
      setTopics(topics.filter(t => t !== tToRemove));
    }
  };

  const handleStartSimulation = async () => {
    const activeRole = isCustomRole ? customRoleInput.trim() : roleTitle;
    if (!activeRole) {
      setError('Please provide a target job role');
      return;
    }
    if (topics.length === 0) {
      setError('Please add at least one topic or focus area');
      return;
    }

    setError(null);
    setLoading(true);

    // Simulate animated loading steps
    const timer1 = setTimeout(() => setLoadingStep(1), 1200);
    const timer2 = setTimeout(() => setLoadingStep(2), 2500);

    try {
      const res = await api.setupInterview({
        roleTitle: activeRole,
        category,
        difficulty,
        topics,
        questionCount: Number(questionCount),
        durationMinutes: Number(durationMinutes)
      });

      if (res && res.interview) {
        onInterviewCreated(res.interview.id);
      } else {
        throw new Error('Server returned invalid interview response');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate interview with Gemini AI');
      setLoading(false);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Simulation Setup</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Configure Your Practice Session
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Tailor interview track, target role, technical domains, and duration. Gemini will synthesize realistic questions.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Modal Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-brand-500/30 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/40 mx-auto flex items-center justify-center mb-5 animate-pulse">
              <Bot className="w-8 h-8 text-brand-400 animate-spin" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Generating Interview Session...
            </h3>

            <div className="space-y-2 text-xs text-slate-300 my-4 text-left p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Invoking Gemini 2.5 Flash Model</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent ${loadingStep >= 1 ? 'hidden' : 'inline-block animate-spin'}`} />
                {loadingStep >= 1 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                <span>Synthesizing {difficulty} questions for {isCustomRole ? customRoleInput : roleTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent ${loadingStep >= 2 ? 'hidden' : 'inline-block animate-spin'}`} />
                {loadingStep >= 2 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                <span>Constructing evaluation criteria & starter templates</span>
              </div>
            </div>

            <p className="text-slate-500 text-[11px]">
              This takes about 3-5 seconds. Preparing simulation room...
            </p>
          </div>
        </div>
      )}

      {/* Setup Form Container */}
      <div className="space-y-8">
        
        {/* Step 1: Select Track */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <label className="block text-sm font-bold text-white mb-3">
            1. Select Interview Track
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            <button
              type="button"
              onClick={() => handleCategoryChange('technical')}
              className={`p-4 rounded-xl border text-left transition-all ${
                category === 'technical'
                  ? 'bg-brand-500/15 border-brand-500/60 ring-1 ring-brand-500 text-white'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <Cpu className="w-5 h-5 text-brand-400 mb-2" />
              <div className="font-semibold text-sm text-slate-200">Technical Architecture</div>
              <div className="text-[11px] text-slate-400 mt-1">Systems, scaling, trade-offs & fundamentals</div>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange('coding')}
              className={`p-4 rounded-xl border text-left transition-all ${
                category === 'coding'
                  ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500 text-white'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <Code2 className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="font-semibold text-sm text-slate-200">Live Coding</div>
              <div className="text-[11px] text-slate-400 mt-1">Algorithms, data structures & clean code</div>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange('hr')}
              className={`p-4 rounded-xl border text-left transition-all ${
                category === 'hr'
                  ? 'bg-purple-500/15 border-purple-500/60 ring-1 ring-purple-500 text-white'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <Users2 className="w-5 h-5 text-purple-400 mb-2" />
              <div className="font-semibold text-sm text-slate-200">HR & Behavioral</div>
              <div className="text-[11px] text-slate-400 mt-1">STAR methodology, culture & leadership</div>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryChange('mixed')}
              className={`p-4 rounded-xl border text-left transition-all ${
                category === 'mixed'
                  ? 'bg-sky-500/15 border-sky-500/60 ring-1 ring-sky-500 text-white'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <Layers className="w-5 h-5 text-sky-400 mb-2" />
              <div className="font-semibold text-sm text-slate-200">Mixed Simulation</div>
              <div className="text-[11px] text-slate-400 mt-1">Comprehensive blend of all 3 rounds</div>
            </button>

          </div>
        </div>

        {/* Step 2: Target Role & Experience Level */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Target Role */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              2. Target Job Role
            </label>
            {!isCustomRole ? (
              <div className="space-y-2">
                <select
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {PRESET_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCustomRole(true)}
                  className="text-xs text-brand-400 hover:underline"
                >
                  + Specify custom / niche role title
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  placeholder="e.g. Lead SRE / Distributed Systems Engineer"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomRole(false)}
                  className="text-xs text-slate-400 hover:underline"
                >
                  ← Select from standard roles
                </button>
              </div>
            )}
          </div>

          {/* Experience / Difficulty */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              3. Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'entry', label: 'Junior / Entry', desc: '0-2 yrs' },
                { id: 'mid', label: 'Mid-Level', desc: '2-5 yrs' },
                { id: 'senior', label: 'Senior / Staff', desc: '5+ yrs' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setDifficulty(lvl.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    difficulty === lvl.id
                      ? 'bg-brand-500/20 border-brand-500/60 text-white ring-1 ring-brand-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{lvl.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Step 3: Topics / Skills Focus */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-white">
              4. Focus Topics & Technical Competencies
            </label>
            <span className="text-xs text-slate-400">
              {topics.length} selected
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Select suggested competencies or type your own below. Gemini creates questions specifically targeting these.
          </p>

          {/* Active Topics */}
          <div className="flex flex-wrap gap-2 mb-4">
            {topics.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-500/15 text-brand-300 border border-brand-500/30"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => removeTopic(t)}
                  className="hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Suggested Suggestions */}
          <div className="mb-4">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
              Recommended for {category} track:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(SUGGESTED_TOPICS[category] || []).map((suggestion) => {
                const active = topics.includes(suggestion);
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => toggleTopic(suggestion)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                      active
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800/80'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {suggestion}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Custom Topic Input */}
          <form onSubmit={addCustomTopic} className="flex gap-2">
            <input
              type="text"
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              placeholder="Add another topic (e.g. GraphQL, WebSockets, Kafka)..."
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Step 4: Questions Count & Duration */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              5. Number of Questions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { count: 3, label: '3 Questions', desc: 'Fast Warmup' },
                { count: 5, label: '5 Questions', desc: 'Standard Round' },
                { count: 8, label: '8 Questions', desc: 'In-Depth' }
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setQuestionCount(item.count)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    questionCount === item.count
                      ? 'bg-brand-500/20 border-brand-500/60 text-white ring-1 ring-brand-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">
              6. Target Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mins: 15, label: '15 Minutes', desc: 'Speed drill' },
                { mins: 30, label: '30 Minutes', desc: 'Realistic test' },
                { mins: 45, label: '45 Minutes', desc: 'Full loop' }
              ].map((item) => (
                <button
                  key={item.mins}
                  type="button"
                  onClick={() => setDurationMinutes(item.mins)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    durationMinutes === item.mins
                      ? 'bg-brand-500/20 border-brand-500/60 text-white ring-1 ring-brand-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Button Bar */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to Dashboard
          </button>

          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={loading}
            className="px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-xl shadow-brand-600/30 flex items-center gap-2.5 transition-all text-sm group"
          >
            <Sparkles className="w-4 h-4 text-brand-200 group-hover:rotate-12 transition-transform" />
            <span>Generate & Start Simulation</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

    </div>
  );
}
