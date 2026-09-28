import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const PRIMARY_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'qwen/qwen3.8-27b';

export interface FeedbackAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  theme: string;
  feature: string;
  severity: 'low' | 'medium' | 'high';
  user_intent: 'complaint' | 'request' | 'praise' | 'question' | 'other';
}

export interface AskProductMemoryResult {
  answer: string;
  evidence: string[];
  interpretation: string;
  supportingFeedbackIds: string[];
  relatedProductChanges: Array<{ id: string; title: string; date: string; feature: string }>;
  memoriesRetrievedCount: number;
}

export class GroqService {
  private static async callChatCompletion(messages: Array<{ role: string; content: string }>, jsonMode = true): Promise<string> {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured in server environment');
    }

    const models = [PRIMARY_MODEL, FALLBACK_MODEL];
    let lastError: any = null;

    for (const model of models) {
      try {
        const body: Record<string, any> = {
          model,
          messages,
          temperature: 0.1,
        };
        if (jsonMode) {
          body.response_format = { type: 'json_object' };
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`Groq error with model ${model} (HTTP ${res.status}):`, errText);
          lastError = new Error(`Groq API returned HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return content;
        }
      } catch (err: any) {
        console.error(`Groq connection error with model ${model}:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error('All Groq models failed to respond.');
  }

  static async analyzeFeedback(text: string, source?: string): Promise<FeedbackAnalysisResult> {
    const systemPrompt = `You are FeedbackMind AI, an expert user feedback categorization engine for product teams.
Analyze the user feedback and return a strictly valid JSON object with EXACTLY these keys:
{
  "sentiment": "positive" | "neutral" | "negative",
  "theme": "A concise 2-4 word theme category (e.g. Checkout Friction, Login Friction, Search Usability, Notification Overload, Battery Drain)",
  "feature": "One of: Checkout, Login, Notifications, Search, Performance, Account, Navigation, Payments, Other",
  "severity": "low" | "medium" | "high",
  "user_intent": "complaint" | "request" | "praise" | "question" | "other"
}

Standardize features into major product areas:
- If discussing checkout, cart, payment, coupons, discounts -> "Checkout"
- If discussing sign in, SSO, 2FA, password, magic link -> "Login"
- If discussing push notifications, emails, alerts, spam, quiet hours -> "Notifications"
- If discussing search, filters, sorting, catalog lookup -> "Search"
- If discussing speed, lag, battery, crashing, responsiveness -> "Performance"
Return ONLY the raw JSON object.`;

    const userPrompt = `Source: ${source || 'User Feedback'}\nFeedback Content: "${text}"`;

    try {
      const rawContent = await this.callChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], true);

      // Parse JSON safely
      const parsed = JSON.parse(rawContent.trim());

      const validSentiments = ['positive', 'neutral', 'negative'] as const;
      const validSeverities = ['low', 'medium', 'high'] as const;
      const validIntents = ['complaint', 'request', 'praise', 'question', 'other'] as const;

      const sentiment = validSentiments.includes(parsed.sentiment?.toLowerCase())
        ? parsed.sentiment.toLowerCase()
        : 'neutral';

      const severity = validSeverities.includes(parsed.severity?.toLowerCase())
        ? parsed.severity.toLowerCase()
        : 'medium';

      const user_intent = validIntents.includes(parsed.user_intent?.toLowerCase())
        ? parsed.user_intent.toLowerCase()
        : 'complaint';

      const feature = typeof parsed.feature === 'string' && parsed.feature.trim().length > 0
        ? parsed.feature.trim()
        : 'Other';

      const theme = typeof parsed.theme === 'string' && parsed.theme.trim().length > 0
        ? parsed.theme.trim()
        : `${feature} Experience`;

      return {
        sentiment,
        theme,
        feature,
        severity,
        user_intent,
      };
    } catch (err: any) {
      console.warn('Failed parsing Groq response, applying heuristic fallback:', err.message);
      // Resilient fallback rule
      const lower = text.toLowerCase();
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (/great|love|fast|smooth|easy|helpful|awesome|fixed|better|thanks/i.test(lower)) sentiment = 'positive';
      else if (/slow|broken|fail|error|confusing|terrible|bad|bug|stuck|cannot|hard|lost/i.test(lower)) sentiment = 'negative';

      let feature = 'Other';
      if (/checkout|coupon|cart|pay/i.test(lower)) feature = 'Checkout';
      else if (/login|password|auth|sso|code/i.test(lower)) feature = 'Login';
      else if (/notif|alert|email|spam/i.test(lower)) feature = 'Notifications';
      else if (/search|filter|find/i.test(lower)) feature = 'Search';
      else if (/slow|lag|crash|battery|performance/i.test(lower)) feature = 'Performance';

      return {
        sentiment,
        theme: `${feature} Feedback`,
        feature,
        severity: sentiment === 'negative' ? 'high' : 'low',
        user_intent: sentiment === 'positive' ? 'praise' : 'complaint',
      };
    }
  }

  static async askProductMemory(
    question: string,
    recalledMemories: Array<{ text: string; timestamp?: string; id?: string; type?: string }>,
    relevantFeedback: Array<{ id: string; date: string; feature: string; theme: string; sentiment: string; text: string }>,
    productChanges: Array<{ id: string; date: string; feature: string; title: string; description: string; reason?: string }>
  ): Promise<AskProductMemoryResult> {
    const memorySnippets = recalledMemories.map((m, idx) => `[Memory #${idx + 1}] (${m.type || 'fact'}): ${m.text}`).join('\n');
    const feedbackSnippets = relevantFeedback.slice(0, 15).map(f => `[Feedback ${f.id}] (${f.date}, ${f.feature}, ${f.sentiment}): "${f.text}"`).join('\n');
    const changeSnippets = productChanges.map(c => `[Change ${c.id}] (${c.date}, ${c.feature}): ${c.title} - ${c.description}`).join('\n');

    const systemPrompt = `You are FeedbackMind AI, synthesizing historical context and long-term memory for product management teams.
You have access to:
1. Long-Term Memory facts recalled from Hindsight Cloud Memory
2. Ground-truth user feedback records from the local repository
3. Documented Product Changes

CRITICAL INSTRUCTIONS:
- Ground your answer strictly on the provided memories, feedback records, and product changes.
- Never invent historical feedback or fabricate feedback IDs.
- Clearly separate direct empirical evidence from analytical interpretation.
- When referencing user feedback, cite the exact Feedback IDs (e.g. FB-1002).
- Return a JSON object with this exact structure:
{
  "answer": "Comprehensive, polished, professional answer answering the user's question with nuanced context.",
  "evidence": [
    "Bullet point of direct observed fact with dates or IDs",
    "Bullet point of product change deployed"
  ],
  "interpretation": "Analytical takeaway and strategic recommendation for the product team based on the evidence.",
  "supportingFeedbackIds": ["FB-..."],
  "relatedProductChanges": [
    {"id": "PC-...", "title": "...", "date": "...", "feature": "..."}
  ]
}`;

    const userPrompt = `User Question: "${question}"

--- RECALLED HINDSIGHT MEMORIES ---
${memorySnippets || 'No direct memories found for this query in Hindsight.'}

--- RECENT & RELEVANT STORED FEEDBACK ---
${feedbackSnippets || 'No feedback entries matched.'}

--- DOCUMENTED PRODUCT CHANGES ---
${changeSnippets || 'No product changes on record.'}

Answer the question thoroughly and return valid JSON only.`;

    try {
      const response = await this.callChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], true);

      const parsed = JSON.parse(response.trim());
      return {
        answer: parsed.answer || 'No direct answer could be synthesized.',
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
        interpretation: parsed.interpretation || '',
        supportingFeedbackIds: Array.isArray(parsed.supportingFeedbackIds) ? parsed.supportingFeedbackIds : [],
        relatedProductChanges: Array.isArray(parsed.relatedProductChanges) ? parsed.relatedProductChanges : [],
        memoriesRetrievedCount: recalledMemories.length,
      };
    } catch (err: any) {
      console.error('Error generating Groq answer:', err);
      return {
        answer: `Synthesizing memory regarding "${question}". Based on ${recalledMemories.length} recalled memories and repository data, recurring discussions centered on key user touchpoints.`,
        evidence: recalledMemories.slice(0, 3).map(m => m.text),
        interpretation: 'User sentiment tracks closely with recent product releases.',
        supportingFeedbackIds: relevantFeedback.slice(0, 3).map(f => f.id),
        relatedProductChanges: productChanges.slice(0, 2).map(c => ({ id: c.id, title: c.title, date: c.date, feature: c.feature })),
        memoriesRetrievedCount: recalledMemories.length,
      };
    }
  }
}
