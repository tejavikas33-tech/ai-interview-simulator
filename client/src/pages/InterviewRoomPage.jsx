import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Code2,
  Cpu,
  Users2,
  Clock,
  Layers,
  Save,
  Bot
} from 'lucide-react';
import Timer from '../components/Timer';
import CodeEditor from '../components/CodeEditor';
import AudioInput from '../components/AudioInput';
import { api } from '../api';

export default function InterviewRoomPage({ interviewId, onFinishEvaluation, onExit }) {
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Local answers cache: { [questionId]: { answer: string, codeLanguage: string } }
  const [answers, setAnswers] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evalPhase, setEvalPhase] = useState(0);
  const [error, setError] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch interview data on mount
  useEffect(() => {
    async function fetchInterview() {
      try {
        const res = await api.getInterview(interviewId);
        if (res && res.interview) {
          setInterview(res.interview);
          const qList = res.interview.questions || [];
          setQuestions(qList);

          // Populate answers from DB
          const initialAnswers = {};
          qList.forEach(q => {
            initialAnswers[q.id] = {
              answer: q.user_answer || q.starter_code || '',
              codeLanguage: q.user_code_language || 'javascript'
            };
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        setError(err.message || 'Failed to load interview room');
      } finally {
        setLoading(false);
      }
    }
    fetchInterview();
  }, [interviewId]);

  const currentQ = questions[currentIndex];
  const currentAnswerState = currentQ ? (answers[currentQ.id] || { answer: '', codeLanguage: 'javascript' }) : { answer: '', codeLanguage: 'javascript' };

  // Handle local text or code update
  const handleAnswerChange = (val) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        answer: val
      }
    }));
  };

  const handleLanguageChange = (lang) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        codeLanguage: lang
      }
    }));
  };

  const handleVoiceTranscript = (spokenText) => {
    if (!currentQ) return;
    const existing = currentAnswerState.answer || '';
    const updated = existing ? `${existing} ${spokenText}` : spokenText;
    handleAnswerChange(updated);
  };

  // Auto-save or manual save current answer to server
  const saveCurrentAnswer = async () => {
    if (!currentQ) return;
    try {
      setSaveStatus('Saving...');
      await api.saveAnswer(interviewId, {
        questionId: currentQ.id,
        answer: currentAnswerState.answer,
        codeLanguage: currentAnswerState.codeLanguage,
        timeSpentSeconds: elapsedSeconds
      });
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err) {
      console.warn('Auto-save error:', err);
      setSaveStatus('Draft stored locally');
    }
  };

  // Switch questions
  const goToQuestion = (idx) => {
    saveCurrentAnswer();
    setCurrentIndex(idx);
    setShowHint(false);
  };

  // Submit interview to Gemini for comprehensive evaluation
  const handleConfirmSubmit = async () => {
    setConfirmModalOpen(false);
    setSubmitting(true);
    setError(null);

    // Save final state of current question
    await saveCurrentAnswer();

    // Cycle through animation phases
    const t1 = setTimeout(() => setEvalPhase(1), 1500);
    const t2 = setTimeout(() => setEvalPhase(2), 3000);
    const t3 = setTimeout(() => setEvalPhase(3), 4500);

    try {
      const res = await api.evaluateInterview(interviewId, {
        timeSpentSeconds: elapsedSeconds
      });

      if (res && res.interview) {
        onFinishEvaluation(res.interview.id);
      } else {
        throw new Error('Server returned invalid evaluation response');
      }
    } catch (err) {
      setError(err.message || 'Failed to evaluate interview with Gemini');
      setSubmitting(false);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center max-w-sm">
          <Bot className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-sm font-semibold">Initializing simulation environment...</p>
        </div>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm mb-4">
          {error}
        </div>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Calculate answer completion count
  const answeredCount = questions.filter(q => (answers[q.id]?.answer || '').trim().length > 0).length;
  const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100);

  const isCodingQuestion = currentQ?.question_type === 'coding';
  const isHRQuestion = currentQ?.question_type === 'hr';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-950">
      
      {/* Top Header Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-3 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Role & Track */}
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{interview?.role_title}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {interview?.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Live Timer */}
          <div className="flex items-center gap-2">
            <Timer
              durationMinutes={interview?.duration_minutes || 30}
              onSecondsUpdate={(sec) => setElapsedSeconds(sec)}
              onTimeExpired={() => setConfirmModalOpen(true)}
            />
          </div>

          {/* Right: Submit Button & Status */}
          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className="text-[11px] font-mono text-emerald-400 hidden md:inline">
                ✓ {saveStatus}
              </span>
            )}
            <button
              onClick={() => setConfirmModalOpen(true)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/30 flex items-center gap-1.5 transition-all"
            >
              <span>Submit Interview</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Question Navigator (Col 1-3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Navigation Card */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-3">
              <span>Question Navigator</span>
              <span className="font-mono text-brand-400">{answeredCount}/{questions.length} done</span>
            </div>

            {/* Visual Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
              <div
                style={{ width: `${progressPercent}%` }}
                className="bg-brand-500 h-full rounded-full transition-all duration-300"
              />
            </div>

            {/* Questions List */}
            <div className="space-y-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = (answers[q.id]?.answer || '').trim().length > 0;

                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(idx)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                      isCurrent
                        ? 'bg-brand-500/20 border-brand-500/60 text-white ring-1 ring-brand-500 font-semibold'
                        : isAnswered
                        ? 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700'
                        : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[11px] text-slate-400">Q{idx + 1}</span>
                      <span className="truncate">
                        {q.question_type === 'coding' ? 'Algorithm' : q.question_type === 'hr' ? 'Behavioral' : 'Technical'}
                      </span>
                    </div>

                    {isAnswered ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interview Context Box */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Active Competencies
            </div>
            <div className="flex flex-wrap gap-1">
              {(interview?.topics || []).map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                  {t}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Center / Right Stage: Question & Answer Workspace (Col 4-12) */}
        <div className="lg:col-span-9 flex flex-col gap-5">
          
          {/* Question Card */}
          {currentQ && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-500/15 text-brand-400 border border-brand-500/30">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs uppercase font-medium text-slate-400 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                    {isCodingQuestion ? <Code2 className="w-3.5 h-3.5 text-emerald-400" /> : isHRQuestion ? <Users2 className="w-3.5 h-3.5 text-purple-400" /> : <Cpu className="w-3.5 h-3.5 text-brand-400" />}
                    <span>{currentQ.question_type}</span>
                  </span>
                </div>

                {currentQ.hints && (
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Hide Hint' : 'Need a hint?'}</span>
                  </button>
                )}
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed mb-4">
                {currentQ.question_text}
              </h2>

              {/* Collapsible Hint */}
              {showHint && currentQ.hints && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs mb-4 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Gemini Interviewer Hint:</span>
                    <span className="text-amber-200/90">{currentQ.hints}</span>
                  </div>
                </div>
              )}

              {/* STAR Guidance Pill for HR */}
              {isHRQuestion && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="font-semibold text-purple-400">STAR Guide:</span>
                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">1. Situation</span>
                  <span>→</span>
                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">2. Task</span>
                  <span>→</span>
                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">3. Action</span>
                  <span>→</span>
                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">4. Result</span>
                </div>
              )}
            </div>
          )}

          {/* Answer Workspace Area */}
          <div className="flex-1 flex flex-col">
            
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Your Response</span>
                {isCodingQuestion && <span className="text-[10px] text-emerald-400 font-mono">(Live Code Editor)</span>}
              </label>

              {/* Voice Speech-to-Text for Behavioral/Technical answers */}
              {!isCodingQuestion && (
                <AudioInput onTranscript={handleVoiceTranscript} />
              )}
            </div>

            {isCodingQuestion ? (
              <CodeEditor
                code={currentAnswerState.answer}
                onChange={handleAnswerChange}
                starterCode={currentQ?.starter_code}
                language={currentAnswerState.codeLanguage || 'javascript'}
                onLanguageChange={handleLanguageChange}
              />
            ) : (
              <div className="glass-panel rounded-2xl border border-slate-800 p-4 flex flex-col flex-1 min-h-[320px]">
                <textarea
                  value={currentAnswerState.answer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={
                    isHRQuestion
                      ? "Explain the Situation, your specific Task, the Actions you personally drove, and the measurable Result..."
                      : "Articulate your architectural approach, system tradeoffs, data models, and edge cases..."
                  }
                  rows={12}
                  className="w-full flex-1 bg-transparent text-slate-200 placeholder-slate-600 text-sm focus:outline-none resize-none leading-relaxed"
                />
                
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Words: {(currentAnswerState.answer || '').trim() ? (currentAnswerState.answer || '').trim().split(/\s+/).length : 0} | 
                    Chars: {(currentAnswerState.answer || '').length}
                  </span>
                  <button
                    type="button"
                    onClick={saveCurrentAnswer}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Question Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(currentIndex - 1)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => goToQuestion(currentIndex + 1)}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-md shadow-brand-600/30 flex items-center gap-1.5 transition-all"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
              >
                <span>Complete & Review</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Submit Simulation for AI Evaluation?
            </h3>
            
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              Gemini will evaluate your answers against industry hiring standards, calculate an overall score, and identify key strengths and mistakes.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs mb-6 space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Answered Questions:</span>
                <span className="font-mono font-bold text-white">{answeredCount} of {questions.length}</span>
              </div>
              {answeredCount < questions.length && (
                <div className="text-amber-400 text-[11px] flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>You have {questions.length - answeredCount} unanswered questions.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
              >
                Continue Answering
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-lg shadow-brand-600/30 flex items-center gap-1.5"
              >
                <span>Yes, Submit & Evaluate</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation In Progress Animated Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-brand-500/30 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/40 mx-auto flex items-center justify-center mb-5 animate-pulse">
              <Bot className="w-8 h-8 text-brand-400 animate-spin" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Gemini AI is Evaluating Your Interview...
            </h3>
            <p className="text-slate-400 text-xs mb-5">
              Analyzing technical accuracy, communication structure, and code optimization
            </p>

            <div className="space-y-2.5 text-xs text-slate-300 text-left p-4 rounded-xl bg-slate-900 border border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Submitted {questions.length} responses to Gemini 2.5 Flash</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent ${evalPhase >= 1 ? 'hidden' : 'inline-block animate-spin'}`} />
                {evalPhase >= 1 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                <span>Grading candidate answers against industry rubric</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent ${evalPhase >= 2 ? 'hidden' : 'inline-block animate-spin'}`} />
                {evalPhase >= 2 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                <span>Extracting critical mistakes, strengths & tips</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent ${evalPhase >= 3 ? 'hidden' : 'inline-block animate-spin'}`} />
                {evalPhase >= 3 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                <span>Synthesizing model answers & saving to database</span>
              </div>
            </div>

            <p className="text-slate-500 text-[11px]">
              Finalizing evaluation report...
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
