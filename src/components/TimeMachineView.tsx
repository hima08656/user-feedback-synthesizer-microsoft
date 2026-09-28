import React, { useEffect, useState } from 'react';
import {
  History,
  GitCommit,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../api';
import { ProductChangeItem, TimeMachineComparison } from '../types';
import { NavTab } from './Navigation';

interface TimeMachineViewProps {
  initialChangeId?: string | null;
  onNavigate: (tab: NavTab) => void;
  onSelectFeedbackForExplorer?: (id: string) => void;
}

export const TimeMachineView: React.FC<TimeMachineViewProps> = ({
  initialChangeId,
  onNavigate,
  onSelectFeedbackForExplorer,
}) => {
  const [changes, setChanges] = useState<ProductChangeItem[]>([]);
  const [selectedChangeId, setSelectedChangeId] = useState<string>(initialChangeId || '');
  const [comparison, setComparison] = useState<TimeMachineComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const list = await api.getProductChanges();
        setChanges(list || []);

        const targetId = initialChangeId || (list.length > 0 ? list[0].id : '');
        setSelectedChangeId(targetId);

        if (targetId) {
          const comp = await api.compareTimeMachine({ changeId: targetId });
          setComparison(comp);
        }
      } catch (err) {
        console.error('Failed to load Time Machine data:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [initialChangeId]);

  const handleSelectChange = async (id: string) => {
    setSelectedChangeId(id);
    try {
      setComparing(true);
      const comp = await api.compareTimeMachine({ changeId: id });
      setComparison(comp);
    } catch (err) {
      console.error('Failed to run comparison:', err);
    } finally {
      setComparing(false);
    }
  };

  const chartData = comparison
    ? [
        {
          period: 'Before Milestone',
          Positive: comparison.before.positivePct,
          Neutral: comparison.before.neutralPct,
          Negative: comparison.before.negativePct,
        },
        {
          period: 'After Milestone',
          Positive: comparison.after.positivePct,
          Neutral: comparison.after.neutralPct,
          Negative: comparison.after.negativePct,
        },
      ]
    : [];

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Feedback Time Machine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate product intervention impact by comparing historical pre-release feedback against post-deployment customer sentiment with Hindsight Recall.
          </p>
        </div>

        {/* Milestone Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Product Milestone:</span>
          <select
            value={selectedChangeId}
            onChange={(e) => handleSelectChange(e.target.value)}
            disabled={comparing}
            className="px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white font-medium"
          >
            {changes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.feature}: {c.title} ({new Date(c.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || comparing ? (
        <div className="h-96 rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse" />
      ) : comparison ? (
        <div className="space-y-8">
          {/* Grounded Observation Banner (Adheres to non-causation policy) */}
          <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] uppercase font-semibold text-indigo-300 block tracking-wider">
                Longitudinal Synthesis Observation
              </span>
              <p className="text-sm font-semibold text-white mt-1">
                {comparison.observationSummary}
              </p>
              <div className="text-xs text-slate-400 mt-1">
                Calculated strictly from {comparison.before.count + comparison.after.count} empirical feedback records in the comparative time window.
              </div>
            </div>
          </div>

          {/* Tri-stage Flow: BEFORE -> PRODUCT CHANGE -> AFTER */}
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
            {/* 1. BEFORE (4 cols) */}
            <div className="lg:col-span-4 p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase font-bold text-rose-400 tracking-wider">
                  Phase 1: Pre-Release
                </span>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {comparison.before.count} records
                </span>
              </div>

              {/* Sentiment Percentages */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Pos</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                    {comparison.before.positivePct}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Neu</span>
                  <span className="text-sm font-bold text-slate-400 font-mono tabular-nums">
                    {comparison.before.neutralPct}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Neg</span>
                  <span className="text-sm font-bold text-rose-400 font-mono tabular-nums">
                    {comparison.before.negativePct}%
                  </span>
                </div>
              </div>

              {/* Related Complaints */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Recurring Complaints Before Change:
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {comparison.before.complaints.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onSelectFeedbackForExplorer && onSelectFeedbackForExplorer(c.id)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-rose-950/60 hover:border-rose-800/80 cursor-pointer transition-colors text-xs text-slate-300"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-mono text-indigo-400">{c.id}</span>
                        <span>{c.source} · {new Date(c.date).toLocaleDateString()}</span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed">"{c.text}"</p>
                    </div>
                  ))}
                  {comparison.before.complaints.length === 0 && (
                    <div className="text-xs text-slate-400 py-4 text-center">No complaints recorded.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. THE PRODUCT CHANGE MILESTONE (3 cols) */}
            <div className="lg:col-span-3 p-6 rounded-xl bg-indigo-950/20 border border-indigo-500/40 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-indigo-900/60 pb-3">
                  <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <GitCommit className="w-4 h-4" />
                    Product Milestone
                  </span>
                  <span className="text-xs font-mono text-indigo-300">
                    {new Date(comparison.productChange.date).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <h3 className="text-base font-bold text-white leading-snug">
                    {comparison.productChange.title}
                  </h3>
                  <div className="text-xs font-medium text-indigo-300">
                    Feature: {comparison.productChange.feature}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {comparison.productChange.description}
                  </p>
                </div>
              </div>

              {comparison.productChange.reason && (
                <div className="p-3 rounded-lg bg-slate-950/80 border border-indigo-900/40 text-xs">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Problem Solved
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {comparison.productChange.reason}
                  </p>
                </div>
              )}
            </div>

            {/* 3. AFTER (4 cols) */}
            <div className="lg:col-span-4 p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                  Phase 2: Post-Release
                </span>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {comparison.after.count} records
                </span>
              </div>

              {/* Sentiment Percentages */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Pos</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                    {comparison.after.positivePct}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Neu</span>
                  <span className="text-sm font-bold text-slate-400 font-mono tabular-nums">
                    {comparison.after.neutralPct}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">Neg</span>
                  <span className="text-sm font-bold text-rose-400 font-mono tabular-nums">
                    {comparison.after.negativePct}%
                  </span>
                </div>
              </div>

              {/* Post-Release Feedback & Praises */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Customer Signals After Change:
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {comparison.after.praises.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onSelectFeedbackForExplorer && onSelectFeedbackForExplorer(p.id)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-emerald-950/60 hover:border-emerald-800/80 cursor-pointer transition-colors text-xs text-slate-300"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-mono text-indigo-400">{p.id}</span>
                        <span>{p.source} · {new Date(p.date).toLocaleDateString()}</span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed">"{p.text}"</p>
                    </div>
                  ))}
                  {comparison.after.praises.length === 0 && (
                    <div className="text-xs text-slate-400 py-4 text-center">No post-release items recorded.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Shift Visualizer Chart */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Sentiment Distribution Shift</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Percentage breakdown before vs. after product deployment
                </p>
              </div>
            </div>

            <div className="h-56 w-full max-w-xl mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                  <YAxis unit="%" stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Positive" fill="#10b981" />
                  <Bar dataKey="Neutral" fill="#64748b" />
                  <Bar dataKey="Negative" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Real Recalled Hindsight Memories */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Hindsight Long-Term Memory Recall ({comparison.recalledMemories.length} facts)
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Real Hindsight Cloud Recall
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {comparison.recalledMemories.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="text-indigo-400">Memory Fact #{idx + 1}</span>
                    <span className="capitalize">{m.type || 'observation'}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{m.text}</p>
                </div>
              ))}
              {comparison.recalledMemories.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No memories recalled from Hindsight for this query.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400">
          No comparison data available.
        </div>
      )}
    </div>
  );
};
