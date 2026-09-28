import React from 'react';
import { NavTab } from './Navigation';
import { RotateCcw, Plus, Activity } from 'lucide-react';

interface TopBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onReseed: () => void;
  isReseeding: boolean;
}

const tabTitles: Record<NavTab, { section: string; title: string }> = {
  dashboard: { section: 'Overview', title: 'Feedback Intelligence Dashboard' },
  'add-feedback': { section: 'Ingestion', title: 'Add User Feedback' },
  'emerging-issues': { section: 'Intelligence', title: 'Emerging Issue Radar' },
  timeline: { section: 'Explorer', title: 'Feedback Timeline' },
  'product-changes': { section: 'Changelog', title: 'Product Changes' },
  'time-machine': { section: 'Evaluation', title: 'Feedback Time Machine' },
  ask: { section: 'Agent Memory', title: 'Ask Product Memory' },
  explorer: { section: 'Architecture', title: 'Memory Explorer' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onReseed,
  isReseeding,
}) => {
  const current = tabTitles[currentTab];

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Zone 1: Contextual Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">{current.section}</span>
        <span className="text-slate-600 font-mono">/</span>
        <span className="text-slate-200 font-semibold text-sm">{current.title}</span>
      </div>

      {/* Zone 2: Continuous Flow Pipeline Tag */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-md border border-slate-800">
        <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span className="text-slate-400">Feedback</span>
        <span className="text-slate-600">→</span>
        <span className="text-indigo-400">Groq</span>
        <span className="text-slate-600">→</span>
        <span className="text-emerald-400">Hindsight Retain</span>
        <span className="text-slate-600">→</span>
        <span className="text-sky-400">Recall</span>
        <span className="text-slate-600">→</span>
        <span className="text-purple-400">Time Machine</span>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReseed}
          disabled={isReseeding}
          title="Reset database to 42 synthetic multi-source records"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reset Demo Data</span>
        </button>

        {currentTab !== 'add-feedback' && (
          <button
            onClick={() => onSelectTab('add-feedback')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Feedback</span>
          </button>
        )}
      </div>
    </header>
  );
};
