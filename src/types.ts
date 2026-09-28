export interface FeedbackItem {
  id: string;
  user_id: string;
  source: 'App Review' | 'Support Ticket' | 'Email' | 'Survey' | 'Social Media';
  date: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  theme: string;
  feature: string;
  severity: 'low' | 'medium' | 'high';
  user_intent: 'complaint' | 'request' | 'praise' | 'question' | 'other';
  is_demo: number;
  hindsight_status: 'retained' | 'failed' | 'pending';
  created_at: string;
}

export interface ProductChangeItem {
  id: string;
  date: string;
  feature: string;
  title: string;
  description: string;
  reason: string;
  related_theme: string;
  created_at: string;
}

export interface DashboardSummary {
  total: number;
  sentiment: {
    positive: number;
    positivePct: number;
    neutral: number;
    neutralPct: number;
    negative: number;
    negativePct: number;
  };
  topThemes: Array<{
    theme: string;
    count: number;
    negative_count: number;
    positive_count: number;
  }>;
  topFeatures: Array<{
    feature: string;
    count: number;
    negative_count: number;
    positive_count: number;
    neutral_count: number;
  }>;
  recentFeedback: FeedbackItem[];
  hindsight: {
    status: string;
    bankId: string;
    factCount?: number;
    totalDocuments?: number;
    totalObservations?: number;
    totalLinks?: number;
  };
}

export interface EmergingIssue {
  theme: string;
  feature: string;
  currentCount: number;
  previousCount: number;
  growthPct: number;
  severity: 'high' | 'medium' | 'low';
  affectedUsers: number;
  explanation: string;
  supportingFeedbackIds: string[];
  sampleTexts: string[];
}

export interface TimeMachineComparison {
  productChange: ProductChangeItem;
  observationSummary: string;
  before: {
    count: number;
    positive: number;
    positivePct: number;
    neutral: number;
    neutralPct: number;
    negative: number;
    negativePct: number;
    complaints: FeedbackItem[];
    praises: FeedbackItem[];
  };
  after: {
    count: number;
    positive: number;
    positivePct: number;
    neutral: number;
    neutralPct: number;
    negative: number;
    negativePct: number;
    complaints: FeedbackItem[];
    praises: FeedbackItem[];
  };
  recalledMemories: Array<{
    id?: string;
    text: string;
    type?: string;
    score?: number;
    timestamp?: string;
    context?: string;
  }>;
  hindsight: {
    status: string;
    error: string | null;
  };
}

export interface AskMemoryResponse {
  question: string;
  answer: string;
  evidence: string[];
  interpretation: string;
  recalledMemories: Array<{
    id?: string;
    text: string;
    type?: string;
    score?: number;
    timestamp?: string;
  }>;
  memoriesRetrievedCount: number;
  supportingFeedbackIds: string[];
  supportingFeedback: FeedbackItem[];
  relatedProductChanges: Array<{
    id: string;
    title: string;
    date: string;
    feature: string;
  }>;
  hindsight: {
    status: string;
    error: string | null;
  };
}
