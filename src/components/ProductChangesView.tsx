import React, { useEffect, useState } from 'react';
import {
  GitCompare,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  History,
  Layers,
} from 'lucide-react';
import { api } from '../api';
import { ProductChangeItem } from '../types';
import { NavTab } from './Navigation';

interface ProductChangesViewProps {
  onNavigateToTimeMachine: (changeId: string) => void;
  onNavigate: (tab: NavTab) => void;
}

export const ProductChangesView: React.FC<ProductChangesViewProps> = ({
  onNavigateToTimeMachine,
  onNavigate,
}) => {
  const [changes, setChanges] = useState<ProductChangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Change Form State
  const [feature, setFeature] = useState('Checkout');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [relatedTheme, setRelatedTheme] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadChanges = async () => {
    try {
      setLoading(true);
      const data = await api.getProductChanges();
      setChanges(data || []);
    } catch (err) {
      console.error('Failed to load product changes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setSubmitError('Title and description are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await api.addProductChange({
        feature,
        title: title.trim(),
        description: description.trim(),
        reason: reason.trim(),
        related_theme: relatedTheme.trim(),
        date: new Date(date).toISOString(),
      });

      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setReason('');
      setRelatedTheme('');
      await loadChanges();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save product change');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-400" />
            Product Changes & Milestones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Engineered interventions recorded in SQLite and committed to Hindsight Long-Term Memory for before/after comparison.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Product Change</span>
        </button>
      </div>

      {/* Changes List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : changes.length > 0 ? (
        <div className="space-y-4">
          {changes.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono text-indigo-400 font-semibold">{item.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-300">{item.feature}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1.5">{item.title}</h2>
                </div>

                <button
                  onClick={() => onNavigateToTimeMachine(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 transition-colors self-start shrink-0"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Launch Time Machine</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {item.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-950 text-xs">
                {item.reason && (
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">
                      Underlying Rationale
                    </span>
                    <span className="text-slate-300 mt-0.5 block">{item.reason}</span>
                  </div>
                )}
                {item.related_theme && (
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">
                      Targeted Problem Theme
                    </span>
                    <span className="text-indigo-300 font-medium mt-0.5 block">{item.related_theme}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
          No product changes on record. Click "Record Product Change" to add the first one.
        </div>
      )}

      {/* Add Product Change Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="w-full max-w-lg p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Record New Product Change</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Feature Area
                  </label>
                  <select
                    value={feature}
                    onChange={(e) => setFeature(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white"
                  >
                    <option value="Checkout">Checkout</option>
                    <option value="Login">Login</option>
                    <option value="Notifications">Notifications</option>
                    <option value="Search">Search</option>
                    <option value="Performance">Performance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Deployment Date
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Change Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Checkout Simplification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description of Change
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Reduced checkout flow from 5 steps to 3 steps with consolidated coupon and payment summary."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rationale / Problem Solved
                </label>
                <input
                  type="text"
                  placeholder="e.g. Repeated complaints about hidden coupon fields and abandoned carts."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Targeted Theme
                </label>
                <input
                  type="text"
                  placeholder="e.g. Checkout Friction"
                  value={relatedTheme}
                  onChange={(e) => setRelatedTheme(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white"
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording & Retaining...' : 'Save & Retain in Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
