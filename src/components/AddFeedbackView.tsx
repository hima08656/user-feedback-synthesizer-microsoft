import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Layers,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api';
import { FeedbackItem } from '../types';
import { NavTab } from './Navigation';

interface AddFeedbackViewProps {
  onFeedbackAdded: (item: FeedbackItem) => void;
  onNavigate: (tab: NavTab) => void;
}

const TEMPLATES = [
  {
    label: 'Checkout Complaint (Pre-fix)',
    userId: 'usr_jordan_91',
    source: 'App Review',
    text: 'Why are there so many screens before payment? Five separate loading pages is completely unacceptable for a modern shopping app.',
  },
  {
    label: 'Checkout Praise (Post-fix)',
    userId: 'usr_sophia_42',
    source: 'Survey',
    text: 'Checkout is much easier now! The coupon option is easier to find and payment took less than 20 seconds.',
  },
  {
    label: 'Notification Issue (Support)',
    userId: 'usr_marcus_v',
    source: 'Support Ticket',
    text: 'I received 4 marketing push notifications in one single afternoon about random flash sales. Please add quiet hours.',
  },
  {
    label: 'Search Usability (Email)',
    userId: 'usr_clara_w',
    source: 'Email',
    text: 'When I search for hiking boots and filter by size, the filters reset immediately after clicking the back button.',
  },
];

export const AddFeedbackView: React.FC<AddFeedbackViewProps> = ({
  onFeedbackAdded,
  onNavigate,
}) => {
  const [userId, setUserId] = useState('usr_alex_dev');
  const [source, setSource] = useState('App Review');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [liveAnalysis, setLiveAnalysis] = useState<any>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applyTemplate = (tpl: (typeof TEMPLATES)[0]) => {
    setUserId(tpl.userId);
    setSource(tpl.source);
    setText(tpl.text);
    setLiveAnalysis(null);
    setSubmitResult(null);
    setErrorMessage(null);
  };

  const handleLivePreview = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter feedback text before previewing analysis.');
      return;
    }
    try {
      setIsPreviewing(true);
      setErrorMessage(null);
      const res = await api.analyzeFeedback(text.trim(), source);
      setLiveAnalysis(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Groq analysis failed');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !text.trim()) {
      setErrorMessage('User ID and feedback text are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSubmitResult(null);

      const res = await api.addFeedback({
        user_id: userId.trim(),
        source,
        date: new Date(date).toISOString(),
        text: text.trim(),
      });

      setSubmitResult(res);
      if (res.feedback) {
        onFeedbackAdded(res.feedback);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header Introduction */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Ingest User Feedback</h1>
        <p className="text-xs text-slate-400 mt-1">
          Submit customer feedback to trigger real-time Groq AI categorization and long-term memory consolidation in Hindsight Cloud.
        </p>
      </div>

      {/* Quick Templates */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Load Pre-formatted Test Scenarios:
        </span>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              User ID
            </label>
            <input
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. usr_sarah_102"
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white font-mono"
            />
          </div>

          {/* Feedback Source */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Source Channel
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white"
            >
              <option value="App Review">App Review</option>
              <option value="Support Ticket">Support Ticket</option>
              <option value="Email">Email</option>
              <option value="Survey">Survey</option>
              <option value="Social Media">Social Media</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observation Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white font-mono"
            />
          </div>
        </div>

        {/* Feedback Text */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Customer Feedback Text
            </label>
            <span className="text-[11px] text-slate-400 font-mono">{text.length} chars</span>
          </div>
          <textarea
            required
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste raw customer feedback, app review, or support transcript..."
            className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white leading-relaxed placeholder:text-slate-600"
          />
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleLivePreview}
            disabled={isPreviewing || isSubmitting || !text.trim()}
            className="px-4 py-2 rounded-lg text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPreviewing ? 'Analyzing with Groq...' : 'Preview Groq Analysis'}</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Analyzing & Retaining...' : 'Submit & Retain in Memory'}</span>
          </button>
        </div>
      </form>

      {/* Live Preview Result (if any) */}
      {liveAnalysis && !submitResult && (
        <div className="p-5 rounded-xl bg-slate-900/70 border border-indigo-500/30 space-y-3 animate-in fade-in-50">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Groq AI Preview (Not Yet Retained)
            </span>
            <span className="font-mono text-[11px] text-slate-400">Model: openai/gpt-oss-120b</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Sentiment</span>
              <span className={`text-xs font-semibold capitalize ${
                liveAnalysis.sentiment === 'positive' ? 'text-emerald-400' :
                liveAnalysis.sentiment === 'negative' ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {liveAnalysis.sentiment}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Feature</span>
              <span className="text-xs font-semibold text-slate-200">{liveAnalysis.feature}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Theme</span>
              <span className="text-xs font-semibold text-slate-200 truncate block">{liveAnalysis.theme}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Severity</span>
              <span className={`text-xs font-semibold uppercase ${
                liveAnalysis.severity === 'high' ? 'text-rose-400' :
                liveAnalysis.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {liveAnalysis.severity}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Intent</span>
              <span className="text-xs font-semibold text-slate-200 capitalize">{liveAnalysis.user_intent}</span>
            </div>
          </div>
        </div>
      )}

      {/* Completed Submission Confirmation Card */}
      {submitResult && (
        <div className="p-6 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-5 animate-in fade-in-50">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Feedback Successfully Ingested</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Assigned ID: {submitResult.feedback?.id}
                </span>
              </div>
            </div>

            {/* Hindsight Status Tag */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Hindsight Memory:</span>
              {submitResult.hindsight?.status === 'retained' ? (
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  RETAINED
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-medium">
                  FAILED ({submitResult.hindsight?.error || 'Unavailable'})
                </span>
              )}
            </div>
          </div>

          {/* Structured Analysis Result Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Sentiment</span>
              <span className={`text-xs font-bold capitalize ${
                submitResult.analysis?.sentiment === 'positive' ? 'text-emerald-400' :
                submitResult.analysis?.sentiment === 'negative' ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {submitResult.analysis?.sentiment}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Feature</span>
              <span className="text-xs font-bold text-slate-200">{submitResult.analysis?.feature}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Theme</span>
              <span className="text-xs font-bold text-slate-200 truncate block">{submitResult.analysis?.theme}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Severity</span>
              <span className={`text-xs font-bold uppercase ${
                submitResult.analysis?.severity === 'high' ? 'text-rose-400' :
                submitResult.analysis?.severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {submitResult.analysis?.severity}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">User Intent</span>
              <span className="text-xs font-bold text-slate-200 capitalize">{submitResult.analysis?.user_intent}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setText('');
                setSubmitResult(null);
                setLiveAnalysis(null);
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Add Another Record
            </button>
            <button
              onClick={() => onNavigate('timeline')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
            >
              <span>View in Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
