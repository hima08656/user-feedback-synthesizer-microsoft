import React, { useEffect, useState } from 'react';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { api } from '../api';
import { EmergingIssue, FeedbackItem } from '../types';
import { NavTab } from './Navigation';

interface EmergingIssuesViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectFeedbackForExplorer?: (id: string) => void;
}

export const EmergingIssuesView: React.FC<EmergingIssuesViewProps> = ({
  onNavigate,
  onSelectFeedbackForExplorer,
}) => {
  const [issues, setIssues] = useState<EmergingIssue[]>([]);
  const [windowInfo, setWindowInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<EmergingIssue | null>(null);
  const [supportingFeedback, setSupportingFeedback] = useState<FeedbackItem[]>([]);
  const [loadingSupporting, setLoadingSupporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadIssues() {
      try {
        setLoading(true);
        const res = await api.getEmergingIssues();
        setIssues(res.issues || []);
        setWindowInfo(res.window);
        if (res.issues && res.issues.length > 0) {
          setSelectedIssue(res.issues[0]);
        }
      } catch (err) {
        console.error('Failed to load emerging issues:', err);
      } finally {
        setLoading(false);
      }
    }
    loadIssues();
  }, []);

  useEffect(() => {
    async function loadSupporting() {
      if (!selectedIssue || selectedIssue.supportingFeedbackIds.length === 0) {
        setSupportingFeedback([]);
        return;
      }
      try {
        setLoadingSupporting(true);
        // Fetch matching items
        const res = await api.getFeedback({ theme: selectedIssue.theme, limit: '10' });
        setSupportingFeedback(res.data || []);
      } catch (err) {
        console.error('Failed to load supporting feedback:', err);
      } finally {
        setLoadingSupporting(false);
      }
    }
    loadSupporting();
  }, [selectedIssue]);

  const filteredIssues = issues.filter(
    (i) =>
      i.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.explanation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Emerging Issue Radar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time comparative analysis between recent vs. previous period feedback clusters to detect breakout friction before escalation.
          </p>
        </div>

        {windowInfo && (
          <div className="flex items-center gap-3 text-xs bg-slate-900/60 px-3.5 py-2 rounded-lg border border-slate-800 text-slate-400 font-mono">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Midpoint: {new Date(windowInfo.midpoint).toLocaleDateString()}</span>
            <span className="text-slate-600">·</span>
            <span>Recent: {windowInfo.totalRecent} items</span>
            <span className="text-slate-600">·</span>
            <span>Prior: {windowInfo.totalPrevious} items</span>
          </div>
        )}
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter emerging themes, features, or patterns..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-96 rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Issues Radar Table (Left 7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Detected Friction Clusters ({filteredIssues.length})
              </span>
              <span className="text-[11px] text-slate-400">Click row to inspect supporting evidence</span>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-[640px] overflow-y-auto">
              {filteredIssues.map((issue) => {
                const isSelected = selectedIssue?.theme === issue.theme;
                const isAccelerating = issue.growthPct > 0;

                let severityBadge = 'text-emerald-400';
                if (issue.severity === 'high') severityBadge = 'text-rose-400 font-bold';
                else if (issue.severity === 'medium') severityBadge = 'text-amber-400 font-semibold';

                return (
                  <div
                    key={issue.theme}
                    onClick={() => setSelectedIssue(issue)}
                    className={`p-4 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/30 border-l-2 border-indigo-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{issue.theme}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-400">{issue.feature}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {issue.explanation}
                        </p>
                      </div>

                      {/* Growth % Tag */}
                      <div className="text-right shrink-0">
                        <div
                          className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${
                            isAccelerating ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isAccelerating ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span className="tabular-nums">
                            {issue.growthPct > 0 ? `+${issue.growthPct}%` : `${issue.growthPct}%`}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {issue.currentCount} now / {issue.previousCount} prior
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-300 tabular-nums">{issue.affectedUsers}</span> users
                        </span>
                        <span className={`text-[11px] uppercase ${severityBadge}`}>
                          {issue.severity} severity
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300">
                        <span>{issue.supportingFeedbackIds.length} references</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredIssues.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No issues matched the filter criteria.
                </div>
              )}
            </div>
          </div>

          {/* Issue Inspection & Supporting Ground Truth (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {selectedIssue ? (
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-5">
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-indigo-400">
                      Issue Profile
                    </span>
                    <span className={`text-xs uppercase font-semibold ${
                      selectedIssue.severity === 'high' ? 'text-rose-400' :
                      selectedIssue.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {selectedIssue.severity} severity
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">{selectedIssue.theme}</h2>
                  <div className="text-xs text-slate-400 mt-1">
                    Affecting {selectedIssue.feature} module across {selectedIssue.affectedUsers} confirmed user sessions.
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Current</span>
                    <span className="text-base font-bold text-white font-mono tabular-nums">
                      {selectedIssue.currentCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Previous</span>
                    <span className="text-base font-bold text-white font-mono tabular-nums">
                      {selectedIssue.previousCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Growth</span>
                    <span className={`text-base font-bold font-mono tabular-nums ${
                      selectedIssue.growthPct > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {selectedIssue.growthPct > 0 ? `+${selectedIssue.growthPct}%` : `${selectedIssue.growthPct}%`}
                    </span>
                  </div>
                </div>

                {/* Supporting Customer Verbatims */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      Customer Feedback Verbatims
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Ground Truth from SQLite
                    </span>
                  </div>

                  {loadingSupporting ? (
                    <div className="h-40 rounded-lg bg-slate-950/60 border border-slate-800 animate-pulse" />
                  ) : supportingFeedback.length > 0 ? (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {supportingFeedback.map((fb) => (
                        <div
                          key={fb.id}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-mono text-indigo-400">{fb.id}</span>
                            <span>{fb.source} · {new Date(fb.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            "{fb.text}"
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span>User: {fb.user_id}</span>
                            <span className={`capitalize ${
                              fb.sentiment === 'positive' ? 'text-emerald-400' :
                              fb.sentiment === 'negative' ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {fb.sentiment}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-950 text-center text-xs text-slate-400">
                      No verbatim feedback linked.
                    </div>
                  )}
                </div>

                {/* Recommended Product Action */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate('ask')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5"
                  >
                    <span>Ask Memory about "{selectedIssue.theme}"</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onNavigate('product-changes')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                  >
                    Plan Fix
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
                Select an issue on the left to inspect details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
