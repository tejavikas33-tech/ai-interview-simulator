import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import ResultsPage from './pages/ResultsPage';

function AppContent() {
  const { user, demoLogin, loading } = useAuth();
  
  // App views: 'landing' | 'auth' | 'dashboard' | 'setup' | 'room' | 'results'
  const [currentView, setCurrentView] = useState('landing');
  const [activeInterviewId, setActiveInterviewId] = useState(null);

  // If loading session on first visit
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Auto-navigate to dashboard when authenticated on landing/auth
  const handleAuthSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleStartNew = () => {
    if (!user) {
      setCurrentView('auth');
    } else {
      setCurrentView('setup');
    }
  };

  const handleInterviewCreated = (id) => {
    setActiveInterviewId(id);
    setCurrentView('room');
  };

  const handleResumeInterview = (id) => {
    setActiveInterviewId(id);
    setCurrentView('room');
  };

  const handleFinishEvaluation = (id) => {
    setActiveInterviewId(id);
    setCurrentView('results');
  };

  const handleViewResults = (id) => {
    setActiveInterviewId(id);
    setCurrentView('results');
  };

  const handleDemoFromLanding = async () => {
    try {
      await demoLogin();
      setCurrentView('dashboard');
    } catch (e) {
      setCurrentView('auth');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onGetStarted={(target) => {
              if (target === 'dashboard' && user) setCurrentView('dashboard');
              else if (target === 'dashboard' && !user) setCurrentView('auth');
              else setCurrentView('auth');
            }}
            onDemoLogin={handleDemoFromLanding}
          />
        )}

        {currentView === 'auth' && (
          <AuthPage
            onSuccess={handleAuthSuccess}
          />
        )}

        {currentView === 'dashboard' && (
          user ? (
            <DashboardPage
              onStartNew={() => setCurrentView('setup')}
              onViewResults={handleViewResults}
              onResumeInterview={handleResumeInterview}
            />
          ) : (
            <AuthPage onSuccess={handleAuthSuccess} />
          )
        )}

        {currentView === 'setup' && (
          user ? (
            <InterviewSetupPage
              onInterviewCreated={handleInterviewCreated}
              onCancel={() => setCurrentView('dashboard')}
            />
          ) : (
            <AuthPage onSuccess={handleAuthSuccess} />
          )
        )}

        {currentView === 'room' && activeInterviewId && (
          <InterviewRoomPage
            interviewId={activeInterviewId}
            onFinishEvaluation={handleFinishEvaluation}
            onExit={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'results' && activeInterviewId && (
          <ResultsPage
            interviewId={activeInterviewId}
            onRetake={() => setCurrentView('setup')}
            onBackDashboard={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">PrepPulse AI</span>
            <span>—</span>
            <span>AI-Driven Technical, Coding & HR Interview Simulator</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span>Powered by Gemini 2.5 & Supabase</span>
            <span>•</span>
            <span>Zod Validation</span>
            <span>•</span>
            <span>React + Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
