import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function Timer({ durationMinutes = 30, onTimeExpired, onSecondsUpdate }) {
  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);

  useEffect(() => {
    setSecondsRemaining(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      if (onTimeExpired) onTimeExpired();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        const nextVal = prev - 1;
        if (onSecondsUpdate) {
          const elapsed = durationMinutes * 60 - nextVal;
          onSecondsUpdate(elapsed);
        }
        if (nextVal <= 0) {
          clearInterval(interval);
          if (onTimeExpired) onTimeExpired();
          return 0;
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, durationMinutes]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const isUrgent = secondsRemaining < 60;
  const isWarning = secondsRemaining < 300 && !isUrgent;

  let colorClasses = 'bg-slate-900/90 text-brand-400 border-slate-800';
  if (isUrgent) {
    colorClasses = 'bg-rose-950/80 text-rose-400 border-rose-500/50 animate-pulse';
  } else if (isWarning) {
    colorClasses = 'bg-amber-950/80 text-amber-400 border-amber-500/40';
  }

  return (
    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-mono font-semibold transition-all shadow-sm ${colorClasses}`}>
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
      ) : (
        <Clock className={`w-4 h-4 ${isWarning ? 'text-amber-400' : 'text-brand-400'}`} />
      )}
      <span>{formatted}</span>
    </div>
  );
}
