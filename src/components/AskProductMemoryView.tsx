import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Brain,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api';
import { AskMemoryResponse } from '../types';
import { NavTab } from './Navigation';

interface AskProductMemoryViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectFeedbackForExplorer?: (id: string) => void;
}

const SUGGESTIONS = [
  'What have users complained about regarding checkout?',
  'Has checkout been a recurring problem?',
  'What problems are emerging?',
  'What are users repeatedly requesting?',
  'What changed after the checkout simplification?',
];

export const AskProductMemoryView: React.FC<AskProductMemoryViewProps> = ({
  onNavigate,
  onSelectFeedbackForExplorer,
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AskMemoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setQuestion(q);
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setActiveStep(1); // 1: Hindsight Recall

    try {
      // Step tracker animation
      const stepTimer1 = setTimeout(() => setActiveStep(2), 1200); // 2: Retrieved Memories
      const stepTimer2 = setTimeout(() => setActiveStep(3), 2400); // 3: Groq Reasoning

      const res = await api.askProductMemory(q);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setActiveStep(4); // 4: Grounded Answer
      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Failed to query product memory');
      setActiveStep(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Ask Product Memory
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Query the agent's biomimetic long-term memory in Hindsight Cloud. Groq reasons exclusively over real retrieved memories and repository records.
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Suggested Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(s)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors disabled:opacity-50 text-left"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Box */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder="Ask anything about past user feedback, recurring complaints, or the impact of product changes..."
            className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white leading-relaxed placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Pipeline: Hindsight Recall → Groq Reasoning → Grounded Synthesis
          </span>

          <button
            onClick={() => handleAsk()}
            disabled={isLoading || !question.trim()}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Querying Memory...' : 'Ask Memory'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Workflow Visualizer */}
      {(isLoading || response) && (
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="text-[11px] uppercase font-semibold text-slate-400 mb-3 tracking-wider">
            Agent Execution Pipeline
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            {/* Step 1 */}
            <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
              activeStep >= 1 ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <Brain className="w-4 h-4 shrink-0 text-indigo-400" />
              <div className="min-w-0">
                <span className="font-semibold block truncate">1. Hindsight Recall</span>
                <span className="text-[10px] text-slate-400">Vector & Spreading</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
              activeStep >= 2 ? 'bg-sky-950/40 border-sky-500/40 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <Database className="w-4 h-4 shrink-0 text-sky-400" />
              <div className="min-w-0">
                <span className="font-semibold block truncate">2. Retrieved Memories</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {response ? `${response.memoriesRetrievedCount} facts` : 'Querying bank...'}
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
              activeStep >= 3 ? 'bg-purple-950/40 border-purple-500/40 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <Cpu className="w-4 h-4 shrink-0 text-purple-400" />
              <div className="min-w-0">
                <span className="font-semibold block truncate">3. Groq Reasoning</span>
                <span className="text-[10px] text-slate-400">openai/gpt-oss-120b</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
              activeStep >= 4 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <span className="font-semibold block truncate">4. Grounded Synthesis</span>
                <span className="text-[10px] text-slate-400">Verified Evidence</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Synthesized Response */}
      {response && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Main Answer Card */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase text-indigo-400 tracking-wider">
                Synthesized Answer
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Grounded via Hindsight Memory
              </span>
            </div>

            <p className="text-sm text-slate-100 leading-relaxed font-normal">
              {response.answer}
            </p>
          </div>

          {/* Evidence vs Interpretation Separation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Direct Evidence */}
            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                Empirical Evidence (Direct Observations)
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {response.evidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sky-400 font-mono text-[11px] mt-0.5">•</span>
                    <span className="leading-relaxed">{ev}</span>
                  </li>
                ))}
                {response.evidence.length === 0 && (
                  <li className="text-slate-400">Direct observations extracted from recalled facts.</li>
                )}
              </ul>
            </div>

            {/* Strategic Interpretation */}
            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                Strategic Interpretation & Takeaways
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {response.interpretation || 'No strategic interpretation generated.'}
              </p>

              {response.relatedProductChanges.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Related Product Changes:
                  </span>
                  <div className="space-y-1">
                    {response.relatedProductChanges.map((c, i) => (
                      <div key={i} className="text-xs text-indigo-300 font-medium">
                        {c.title} ({c.date ? new Date(c.date).toLocaleDateString() : 'Recorded'})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supporting Feedback Verbatims (Ground truth from SQLite) */}
          {response.supportingFeedback.length > 0 && (
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  Supporting User Feedback Citations ({response.supportingFeedback.length})
                </span>
                <span className="font-mono text-[11px] text-slate-400">Verified IDs</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.supportingFeedback.map((fb) => (
                  <div
                    key={fb.id}
                    onClick={() => onSelectFeedbackForExplorer && onSelectFeedbackForExplorer(fb.id)}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="text-indigo-400 font-semibold">{fb.id}</span>
                      <span>{fb.source} · {new Date(fb.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-200 line-clamp-2 leading-relaxed">"{fb.text}"</p>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Feature: {fb.feature} · Theme: {fb.theme}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recalled Hindsight Memories Drawer */}
          <div className="p-5 rounded-xl bg-slate-900/30 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">
                Raw Recalled Hindsight Memories ({response.recalledMemories.length} facts)
              </span>
              <span className="text-[11px] text-indigo-400 font-mono">Bank: feedbackmind-ai</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {response.recalledMemories.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-950 text-[11px] text-slate-300 font-mono border border-slate-900"
                >
                  <span className="text-indigo-400 font-semibold mr-2">[{idx + 1}]</span>
                  <span>{m.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
