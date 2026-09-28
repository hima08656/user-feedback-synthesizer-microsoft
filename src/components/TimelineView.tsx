import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { api } from '../api';
import { FeedbackItem } from '../types';
import { NavTab } from './Navigation';

interface TimelineViewProps {
  onSelectFeedbackForExplorer: (id: string) => void;
  onNavigate: (tab: NavTab) => void;
}

const SOURCES = ['All', 'App Review', 'Support Ticket', 'Email', 'Survey', 'Social Media'];
const FEATURES = ['All', 'Checkout', 'Login', 'Notifications', 'Search', 'Performance', 'Other'];
const SENTIMENTS = ['All', 'positive', 'neutral', 'negative'];

export const TimelineView: React.FC<TimelineViewProps> = ({
  onSelectFeedbackForExplorer,
  onNavigate,
}) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [source, setSource] = useState('All');
  const [feature, setFeature] = useState('All');
  const [sentiment, setSentiment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        limit: '150',
      };
      if (source !== 'All') params.source = source;
      if (feature !== 'All') params.feature = feature;
      if (sentiment !== 'All') params.sentiment = sentiment;

      const res = await api.getFeedback(params);
      setFeedbackList(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [source, feature, sentiment]);

  const filteredItems = feedbackList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.text.toLowerCase().includes(q) ||
      item.theme.toLowerCase().includes(q) ||
      item.user_id.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  const resetFilters = () => {
    setSource('All');
    setFeature('All');
    setSentiment('All');
    setSearchQuery('');
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Feedback Timeline
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological multi-channel feedback stream indexed into SQLite and linked to Hindsight memory entities.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-indigo-400 tabular-nums font-semibold">{filteredItems.length}</span> of{' '}
          <span className="text-slate-300 tabular-nums">{total}</span> records displayed
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Query */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search text, user, theme..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white"
            />
          </div>

          {/* Source Channel Filter */}
          <div>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white"
            >
              <option value="All">All Source Channels</option>
              {SOURCES.filter((s) => s !== 'All').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Feature Filter */}
          <div>
            <select
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white"
            >
              <option value="All">All Features</option>
              {FEATURES.filter((f) => f !== 'All').map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Sentiment Filter */}
          <div>
            <select
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white capitalize"
            >
              <option value="All">All Sentiments</option>
              <option value="positive">Positive Only</option>
              <option value="neutral">Neutral Only</option>
              <option value="negative">Negative Only</option>
            </select>
          </div>
        </div>

        {/* Active Filter Summary and Reset */}
        {(source !== 'All' || feature !== 'All' || sentiment !== 'All' || searchQuery) && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 text-slate-400">
            <span>Filtered view active</span>
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            let sentimentColor = 'text-slate-400';
            let borderAccent = 'border-slate-800';

            if (item.sentiment === 'positive') {
              sentimentColor = 'text-emerald-400';
              borderAccent = 'hover:border-emerald-500/40';
            } else if (item.sentiment === 'negative') {
              sentimentColor = 'text-rose-400';
              borderAccent = 'hover:border-rose-500/40';
            }

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 ${borderAccent} transition-all space-y-2 group`}
              >
                {/* Clean unboxed metadata line with typographic separators */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-semibold">{item.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">{item.source}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-200 font-medium">{item.feature}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">{item.user_id}</span>
                    {item.is_demo === 1 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[10px] text-slate-400 font-mono">synthetic</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span className={`font-semibold capitalize text-xs ${sentimentColor}`}>
                      {item.sentiment}
                    </span>
                  </div>
                </div>

                {/* Feedback Body */}
                <p className="text-xs text-slate-200 leading-relaxed">
                  "{item.text}"
                </p>

                {/* Footer Metadata & Memory Explorer Action */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-950">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span>Theme: <strong className="text-slate-300 font-medium">{item.theme}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">Intent: {item.user_intent}</span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase">Severity: {item.severity}</span>
                  </div>

                  <button
                    onClick={() => onSelectFeedbackForExplorer(item.id)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-medium flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    <span>Inspect Memory</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
          No feedback records match the current filters.
        </div>
      )}
    </div>
  );
};
