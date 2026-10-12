import React, { useState } from 'react';
import { Code2, RotateCcw, Copy, Check } from 'lucide-react';

export default function CodeEditor({
  code,
  onChange,
  starterCode,
  language = 'javascript',
  onLanguageChange
}) {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState('text-sm');

  const lineCount = (code || '').split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 12) }, (_, i) => i + 1);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (starterCode && window.confirm('Reset code to starter template? Your current changes will be overwritten.')) {
      onChange(starterCode);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/90 shadow-xl overflow-hidden flex flex-col font-mono">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-brand-400" />
            <select
              value={language}
              onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python 3</option>
              <option value="java">Java 17</option>
              <option value="cpp">C++ 20</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Selector */}
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-400 rounded px-2 py-0.5 text-[11px] focus:outline-none"
          >
            <option value="text-xs">Font: Small</option>
            <option value="text-sm">Font: Medium</option>
            <option value="text-base">Font: Large</option>
          </select>

          {starterCode && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              title="Reset to starter code"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex flex-1 min-h-[300px] max-h-[500px] overflow-auto bg-slate-950">
        {/* Line Numbers */}
        <div className="w-12 py-3 pr-3 pl-2 text-right select-none text-slate-600 bg-slate-950/50 border-r border-slate-800/80 font-mono text-xs leading-6">
          {lineNumbers.map((num) => (
            <div key={num} className="text-slate-600 leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={code || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="// Type your solution here..."
          spellCheck={false}
          className={`flex-1 p-3 bg-transparent text-slate-200 placeholder-slate-700 font-mono ${fontSize} leading-6 resize-none focus:outline-none selection:bg-brand-500/30 w-full`}
        />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/60 border-t border-slate-800/80 text-[11px] text-slate-500">
        <span>Lines: {lineCount} | Chars: {(code || '').length}</span>
        <span>Tab Size: 2 | UTF-8</span>
      </div>
    </div>
  );
}
