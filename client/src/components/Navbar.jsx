import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Database,
  User,
  LogOut,
  LayoutDashboard,
  PlayCircle,
  History,
  CheckCircle2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, logout, systemStatus } = useAuth();
  const [statusOpen, setStatusOpen] = useState(false);

  const geminiActive = systemStatus?.geminiAi?.configured;
  const supabaseActive = systemStatus?.supabasePostgreSQL?.connected;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            onClick={() => setCurrentView(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 p-[1px] shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                PrepPulse<span className="text-brand-400">.ai</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Gemini Powered
              </span>
            </div>
          </div>

          {/* Navigation Links for Authenticated Users */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('setup')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'setup'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <PlayCircle className="w-4 h-4" />
                New Interview
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <History className="w-4 h-4" />
                History & Stats
              </button>
            </nav>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            
            {/* System Status Pill / Dropdown */}
            <div className="relative">
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
                title="Service Status"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${geminiActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="hidden sm:inline font-mono">System</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {statusOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3.5 z-50">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                    Integrated Services
                  </div>
                  
                  {/* Gemini AI Status */}
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-2">
                    <Bot className={`w-4 h-4 mt-0.5 ${geminiActive ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <div className="text-xs">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        Gemini AI (@google/genai)
                        {geminiActive ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">Live</span>
                        ) : (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">Curated</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {geminiActive ? 'Live API key connected. Generating dynamic questions & feedback.' : 'Running smart built-in engine. Add GEMINI_API_KEY to switch to live.'}
                      </p>
                    </div>
                  </div>

                  {/* Supabase Status */}
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <Database className={`w-4 h-4 mt-0.5 ${supabaseActive ? 'text-emerald-400' : 'text-blue-400'}`} />
                    <div className="text-xs">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        Supabase PostgreSQL
                        {supabaseActive ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">Connected</span>
                        ) : (
                          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">Local DB</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {supabaseActive ? 'PostgreSQL schema synced with RLS.' : 'Persistent DB active. Paste schema.sql to Supabase & set .env.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setStatusOpen(false)}
                    className="w-full mt-3 text-center text-[11px] text-slate-400 hover:text-slate-200 py-1"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-semibold">
                    {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <span className="text-slate-200 font-medium max-w-[120px] truncate">
                    {user.full_name || user.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setCurrentView('landing');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('auth')}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/30 transition-all"
                >
                  Sign In / Register
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
