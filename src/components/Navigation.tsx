import React from 'react';
import {
  LayoutDashboard,
  MessageSquarePlus,
  Flame,
  Clock,
  GitCompare,
  History,
  Sparkles,
  Cpu,
  Database,
  CheckCircle2,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'add-feedback'
  | 'emerging-issues'
  | 'timeline'
  | 'product-changes'
  | 'time-machine'
  | 'ask'
  | 'explorer';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  bankFactCount?: number;
  totalFeedback?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  bankFactCount = 134,
  totalFeedback = 42,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: totalFeedback ? `${totalFeedback}` : undefined,
    },
    {
      id: 'add-feedback' as NavTab,
      label: 'Add Feedback',
      icon: MessageSquarePlus,
    },
    {
      id: 'emerging-issues' as NavTab,
      label: 'Emerging Issues',
      icon: Flame,
      highlight: true,
    },
    {
      id: 'timeline' as NavTab,
      label: 'Feedback Timeline',
      icon: Clock,
    },
    {
      id: 'product-changes' as NavTab,
      label: 'Product Changes',
      icon: GitCompare,
    },
    {
      id: 'time-machine' as NavTab,
      label: 'Feedback Time Machine',
      icon: History,
      highlight: true,
    },
    {
      id: 'ask' as NavTab,
      label: 'Ask Product Memory',
      icon: Sparkles,
      highlight: true,
    },
    {
      id: 'explorer' as NavTab,
      label: 'Memory Explorer',
      icon: Cpu,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 select-none">
      {/* Brand Zone */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-sm shadow-indigo-500/10">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>FeedbackMind</span>
              <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Product Feedback Synthesizer
            </div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[11px] tabular-nums font-mono px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Real-time System Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Hindsight Memory
            </span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </span>
          </div>

          <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Bank:</span>
              <span className="text-slate-200 truncate max-w-[110px]">feedbackmind-ai</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Facts Retained:</span>
              <span className="text-indigo-300 tabular-nums">{bankFactCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Engine:</span>
              <span className="text-slate-200">Groq LLM</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
