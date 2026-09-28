import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Database,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';
import { DashboardSummary, EmergingIssue } from '../types';
import { NavTab } from './Navigation';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectFeedbackForExplorer?: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectFeedbackForExplorer,
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [emerging, setEmerging] = useState<EmergingIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sumRes, trendRes, emergRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getSentimentTrend(),
          api.getEmergingIssues(),
        ]);
        setSummary(sumRes);
        setTrend(trendRes);
        setEmerging(emergRes.issues || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-xl bg-slate-900/60 border border-slate-800" />
          <div className="h-72 rounded-xl bg-slate-900/60 border border-slate-800" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-12 text-center text-slate-400">
        Unable to load dashboard intelligence. Please check server status.
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1440px] mx-auto">
      {/* Top Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Feedback */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Total Synthesized</span>
            <MessageSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white tabular-nums font-mono">
              {summary.total}
            </span>
            <span className="text-xs text-slate-400">records</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-mono">100%</span>
            <span>indexed across Groq & Hindsight</span>
          </div>
        </div>

        {/* Positive Feedback */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Positive Feedback</span>
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-400 tabular-nums font-mono">
              {summary.sentiment.positivePct}%
            </span>
            <span className="text-xs text-slate-400 tabular-nums font-mono">
              ({summary.sentiment.positive} items)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            High customer velocity & praise
          </div>
        </div>

        {/* Neutral Feedback */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Neutral / Inquiries</span>
            <MinusCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-300 tabular-nums font-mono">
              {summary.sentiment.neutralPct}%
            </span>
            <span className="text-xs text-slate-400 tabular-nums font-mono">
              ({summary.sentiment.neutral} items)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Feature requests and clarification
          </div>
        </div>

        {/* Negative Feedback */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Negative / Friction</span>
            <ThumbsDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-rose-400 tabular-nums font-mono">
              {summary.sentiment.negativePct}%
            </span>
            <span className="text-xs text-slate-400 tabular-nums font-mono">
              ({summary.sentiment.negative} items)
            </span>
          </div>
          <div className="mt-3 text-[11px] text-rose-400/80">
            Primary focus for product iterations
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Trend Over Time (Area Chart) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Sentiment Trajectory Over Time</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Weekly longitudinal volume distribution of user feedback
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Positive
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" /> Neutral
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Negative
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="positive"
                  name="Positive"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPositive)"
                />
                <Area
                  type="monotone"
                  dataKey="negative"
                  name="Negative"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNegative)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Distribution */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Top Product Features</h2>
              <p className="text-xs text-slate-400 mt-0.5">By total feedback volume</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.topFeatures}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="positive_count" name="Positive" stackId="a" fill="#10b981" />
                <Bar dataKey="negative_count" name="Negative" stackId="a" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Emerging Issues Radar Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900/70 to-slate-900/70 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Emerging Issue Radar</span>
              <span className="text-[11px] font-mono text-amber-400">
                {emerging.filter((e) => e.growthPct > 0).length} accelerating issues identified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Longitudinal comparison highlights emerging problems before they become critical churn drivers.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('emerging-issues')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all self-start md:self-auto shrink-0"
        >
          <span>Open Radar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Two Column Section: Top Themes & Recent Feedback Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Themes Card */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Top Synthesis Themes</h2>
              <p className="text-xs text-slate-400 mt-0.5">Categorized by Groq AI and indexed into Hindsight</p>
            </div>
            <button
              onClick={() => onNavigate('timeline')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {summary.topThemes.map((th) => {
              const totalTheme = th.count;
              const posPct = totalTheme > 0 ? (th.positive_count / totalTheme) * 100 : 0;
              const negPct = totalTheme > 0 ? (th.negative_count / totalTheme) * 100 : 0;

              return (
                <div
                  key={th.theme}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{th.theme}</span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {th.count} {th.count === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  {/* Proportion Bar */}
                  <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${posPct}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Positive: ${Math.round(posPct)}%`}
                    />
                    <div
                      style={{ width: `${100 - posPct - negPct}%` }}
                      className="bg-slate-600 h-full"
                      title="Neutral"
                    />
                    <div
                      style={{ width: `${negPct}%` }}
                      className="bg-rose-500 h-full"
                      title={`Negative: ${Math.round(negPct)}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Feedback Feed */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Feedback Ingestion</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time incoming customer signals</p>
            </div>
            <button
              onClick={() => onNavigate('timeline')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Explore Timeline</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {summary.recentFeedback.slice(0, 4).map((fb) => {
              const sentimentColor =
                fb.sentiment === 'positive'
                  ? 'text-emerald-400'
                  : fb.sentiment === 'negative'
                  ? 'text-rose-400'
                  : 'text-slate-400';

              return (
                <div
                  key={fb.id}
                  onClick={() => {
                    if (onSelectFeedbackForExplorer) {
                      onSelectFeedbackForExplorer(fb.id);
                    } else {
                      onNavigate('explorer');
                    }
                  }}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400">{fb.id}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300">{fb.source}</span>
                      <span aria-hidden="true">·</span>
                      <span>{fb.feature}</span>
                    </div>
                    <span className={`font-medium capitalize ${sentimentColor}`}>
                      {fb.sentiment}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-200 line-clamp-2 leading-relaxed">
                    "{fb.text}"
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-900">
                    <span>Theme: {fb.theme}</span>
                    <span className="text-slate-400 font-mono">
                      {new Date(fb.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
