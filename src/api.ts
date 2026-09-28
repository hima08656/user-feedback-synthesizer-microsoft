import {
  FeedbackItem,
  ProductChangeItem,
  DashboardSummary,
  EmergingIssue,
  TimeMachineComparison,
  AskMemoryResponse,
} from './types';

export const api = {
  async getHealth() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Failed to fetch health status');
    return res.json();
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch('/api/dashboard/summary');
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  async getSentimentTrend(): Promise<Array<{ date: string; positive: number; neutral: number; negative: number; total: number }>> {
    const res = await fetch('/api/dashboard/sentiment-trend');
    if (!res.ok) throw new Error('Failed to fetch sentiment trend');
    return res.json();
  },

  async getEmergingIssues(): Promise<{ issues: EmergingIssue[]; window: any }> {
    const res = await fetch('/api/insights/emerging-issues');
    if (!res.ok) throw new Error('Failed to fetch emerging issues');
    return res.json();
  },

  async getFeedback(params: Record<string, string> = {}): Promise<{ data: FeedbackItem[]; total: number }> {
    const searchParams = new URLSearchParams(params);
    const res = await fetch(`/api/feedback?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch feedback items');
    return res.json();
  },

  async getFeedbackById(id: string): Promise<FeedbackItem> {
    const res = await fetch(`/api/feedback/${id}`);
    if (!res.ok) throw new Error('Failed to fetch feedback details');
    return res.json();
  },

  async analyzeFeedback(text: string, source: string) {
    const res = await fetch('/api/analyze-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Feedback analysis failed');
    }
    return res.json();
  },

  async addFeedback(payload: { user_id: string; source: string; date?: string; text: string }) {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit feedback');
    }
    return res.json();
  },

  async getProductChanges(): Promise<ProductChangeItem[]> {
    const res = await fetch('/api/product-changes');
    if (!res.ok) throw new Error('Failed to fetch product changes');
    return res.json();
  },

  async addProductChange(payload: {
    feature: string;
    title: string;
    description: string;
    reason?: string;
    related_theme?: string;
    date?: string;
  }) {
    const res = await fetch('/api/product-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create product change');
    }
    return res.json();
  },

  async compareTimeMachine(payload: { changeId?: string; feature?: string; date?: string; title?: string }): Promise<TimeMachineComparison> {
    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate comparison');
    }
    return res.json();
  },

  async askProductMemory(question: string): Promise<AskMemoryResponse> {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to query product memory');
    }
    return res.json();
  },

  async recallMemoriesDirect(query: string, options: any = {}) {
    const res = await fetch('/api/memory/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...options }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Memory service unavailable. Please try again.');
    }
    return res.json();
  },

  async reseedData() {
    const res = await fetch('/api/seed', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reseed database');
    return res.json();
  },
};
