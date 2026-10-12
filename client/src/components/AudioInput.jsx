import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';

export default function AudioInput({ onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimText(interim);
      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <MicOff className="w-3.5 h-3.5" />
        <span>Voice speech-to-text supported in Chrome/Edge browsers</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleListening}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isListening
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/20 animate-pulse'
            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
        }`}
      >
        {isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <Mic className="w-4 h-4 text-rose-400" />
            <span>Listening (Speak answer)...</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-brand-400" />
            <span>Voice Input (Speech-to-Text)</span>
          </>
        )}
      </button>

      {isListening && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400/90 font-mono">
          <span className="h-2 w-1 bg-rose-500 animate-pulse" />
          <span className="h-3 w-1 bg-rose-400 animate-pulse delay-75" />
          <span className="h-4 w-1 bg-rose-300 animate-pulse delay-150" />
          <span className="h-2 w-1 bg-rose-500 animate-pulse" />
          {interimText && (
            <span className="text-slate-400 italic max-w-xs truncate ml-2">
              "{interimText}"
            </span>
          )}
        </div>
      )}
    </div>
  );
}
