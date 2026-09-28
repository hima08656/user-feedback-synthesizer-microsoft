import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Brain,
  Database,
  ArrowRight,
  Search,
  Sparkles,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  Network,
  Layers,
  Activity,
  Workflow,
} from 'lucide-react';
import { api } from '../api';
import { FeedbackItem, ProductChangeItem } from '../types';
import { NavTab } from './Navigation';

interface MemoryExplorerViewProps {
  initialFeedbackId?: string | null;
  onNavigate: (tab: NavTab) => void;
}

export const MemoryExplorerView: React.FC<MemoryExplorerViewProps> = ({
  initialFeedbackId,
  onNavigate,
}) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string>(initialFeedbackId || '');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [productChanges, setProductChanges] = useState<ProductChangeItem[]>([]);
  const [recalledMemories, setRecalledMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecall, setLoadingRecall] = useState(false);

  // Custom sandbox recall
  const [customQuery, setCustomQuery] = useState('');
  const [isQueryingCustom, setIsQueryingCustom] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [fbRes, pcRes] = await Promise.all([
          api.getFeedback({ limit: '60' }),
          api.getProductChanges(),
        ]);
        setFeedbackList(fbRes.data || []);
        setProductChanges(pcRes || []);

        const targetId = initialFeedbackId || (fbRes.data?.length > 0 ? fbRes.data[0].id : '');
        setSelectedFeedbackId(targetId);

        if (targetId && fbRes.data?.length > 0) {
          const item = fbRes.data.find((f: any) => f.id === targetId) || fbRes.data[0];
          setSelectedFeedback(item);
          await loadMemoriesForFeedback(item);
        }
      } catch (err) {
        console.error('Failed to initialize Memory Explorer:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [initialFeedbackId]);

  const loadMemoriesForFeedback = async (item: FeedbackItem) => {
    try {
      setLoadingRecall(true);
      const query = `${item.feature} ${item.theme} ${item.text.slice(0, 80)}`;
      const res = await api.recallMemoriesDirect(query, { budget: 'mid' });
      setRecalledMemories(res.memories || []);
    } catch (err) {
      console.error('Failed to recall memories for feedback:', err);
      setRecalledMemories([]);
    } finally {
      setLoadingRecall(false);
    }
  };

  const handleSelectFeedback = async (id: string) => {
    setSelectedFeedbackId(id);
    const item = feedbackList.find((f) => f.id === id);
    if (item) {
      setSelectedFeedback(item);
      await loadMemoriesForFeedback(item);
    }
  };

  const handleCustomRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    try {
      setIsQueryingCustom(true);
      const res = await api.recallMemoriesDirect(customQuery.trim(), { budget: 'mid' });
      setRecalledMemories(res.memories || []);
    } catch (err) {
      console.error('Custom recall error:', err);
    } finally {
      setIsQueryingCustom(false);
    }
  };

  const relatedChanges = selectedFeedback
    ? productChanges.filter((c) => c.feature.toLowerCase() === selectedFeedback.feature.toLowerCase())
    : [];

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-400" />
          Memory Explorer & Cognitive Pipeline
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect how user signals travel through Groq AI synthesis, retain into Hindsight biomimetic memory, and activate long-term recall links.
        </p>
      </div>

      {/* Visual Pipeline Banner */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="text-[11px] font-semibold uppercase text-slate-400 mb-3 tracking-wider flex items-center gap-2">
          <Workflow className="w-4 h-4 text-indigo-400" />
          Full Cognitive Synthesis Architecture
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Step 1</span>
            <span className="text-xs font-semibold text-slate-200 mt-1 block">Feedback</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-indigo-900/60 text-indigo-300">
            <span className="text-[10px] uppercase font-mono text-indigo-400 block">Step 2</span>
            <span className="text-xs font-semibold mt-1 block">Groq AI</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-emerald-900/60 text-emerald-300">
            <span className="text-[10px] uppercase font-mono text-emerald-400 block">Step 3</span>
            <span className="text-xs font-semibold mt-1 block">Hindsight Retain</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-sky-900/60 text-sky-300">
            <span className="text-[10px] uppercase font-mono text-sky-400 block">Step 4</span>
            <span className="text-xs font-semibold mt-1 block">Long-Term Memory</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-purple-900/60 text-purple-300">
            <span className="text-[10px] uppercase font-mono text-purple-400 block">Step 5</span>
            <span className="text-xs font-semibold mt-1 block">Hindsight Recall</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-amber-900/60 text-amber-300">
            <span className="text-[10px] uppercase font-mono text-amber-400 block">Step 6</span>
            <span className="text-xs font-semibold mt-1 block">Related Memories</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-rose-900/60 text-rose-300 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-mono text-rose-400 block">Step 7</span>
            <span className="text-xs font-semibold mt-1 block">Product Impact</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Selector + Trace View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Feedback Selector & Sandbox (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Choose Feedback to Trace</span>
              <span className="text-[11px] font-mono text-slate-400">{feedbackList.length} items</span>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {feedbackList.map((fb) => {
                const isSelected = selectedFeedbackId === fb.id;
                return (
                  <button
                    key={fb.id}
                    onClick={() => handleSelectFeedback(fb.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-white font-medium'
                        : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span className="text-indigo-400">{fb.id}</span>
                      <span>{fb.feature} · {fb.sentiment}</span>
                    </div>
                    <p className="line-clamp-2 text-slate-300">{fb.text}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sandbox Recall Query Form */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-white block">
              Direct Hindsight Recall Sandbox
            </span>
            <form onSubmit={handleCustomRecall} className="space-y-2">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Query Hindsight memory directly..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white font-mono"
              />
              <button
                type="submit"
                disabled={isQueryingCustom || !customQuery.trim()}
                className="w-full py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50"
              >
                {isQueryingCustom ? 'Recalling...' : 'Run Recall Query'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Cognitive Trace Breakdown (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedFeedback ? (
            <>
              {/* 1. Original Feedback & Groq Analysis */}
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-semibold text-xs">
                      {selectedFeedback.id}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-300">{selectedFeedback.source}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(selectedFeedback.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Hindsight:</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedFeedback.hindsight_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-semibold text-slate-400 block">
                    Original Customer Text
                  </span>
                  <p className="text-sm text-slate-100 font-medium leading-relaxed">
                    "{selectedFeedback.text}"
                  </p>
                </div>

                {/* Groq Extracted Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 block">Sentiment</span>
                    <span className={`text-xs font-bold capitalize ${
                      selectedFeedback.sentiment === 'positive' ? 'text-emerald-400' :
                      selectedFeedback.sentiment === 'negative' ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {selectedFeedback.sentiment}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 block">Feature</span>
                    <span className="text-xs font-bold text-slate-200">{selectedFeedback.feature}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 block">Theme</span>
                    <span className="text-xs font-bold text-slate-200 truncate block">{selectedFeedback.theme}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 block">Severity</span>
                    <span className="text-xs font-bold uppercase text-amber-400">{selectedFeedback.severity}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 block">Intent</span>
                    <span className="text-xs font-bold capitalize text-slate-200">{selectedFeedback.user_intent}</span>
                  </div>
                </div>
              </div>

              {/* 2. Recalled Hindsight Long-Term Memories */}
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Linked Hindsight Long-Term Memories ({recalledMemories.length} facts)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hindsight Cloud Verified
                  </span>
                </div>

                {loadingRecall ? (
                  <div className="h-32 rounded-lg bg-slate-950 border border-slate-800 animate-pulse" />
                ) : recalledMemories.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {recalledMemories.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="text-sky-400 font-semibold">Memory Fact #{idx + 1}</span>
                          <span className="capitalize">{m.type || 'fact'}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed font-mono text-[11px]">{m.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-950 rounded-lg">
                    No matching memories returned for this query.
                  </div>
                )}
              </div>

              {/* 3. Linked Product Changes for this Feature */}
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Related Product Changes ({relatedChanges.length})
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('product-changes')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    View Changelog
                  </button>
                </div>

                {relatedChanges.length > 0 ? (
                  <div className="space-y-2.5">
                    {relatedChanges.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span className="font-semibold text-white">{c.title}</span>
                          <span className="font-mono">{new Date(c.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{c.description}</p>
                        {c.reason && (
                          <div className="text-[11px] text-indigo-300 pt-1">
                            Rationale: {c.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-950 rounded-lg">
                    No documented product changes for the {selectedFeedback.feature} feature area yet.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
              Select feedback on the left or run a direct recall query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
