import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { getDb, queryAll, queryOne, execute } from './server/db.ts';
import { HindsightService } from './server/hindsight.ts';
import { GroqService } from './server/groq.ts';
import { SEED_FEEDBACK, SEED_PRODUCT_CHANGES } from './server/seedData.ts';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Helper to seed initial data if database is empty
async function initDatabaseAndSeed() {
  await getDb();
  const existingFeedback = queryAll('SELECT count(*) as count FROM feedback');
  const count = (existingFeedback[0] as any)?.count || 0;

  if (count === 0) {
    console.log('Seeding initial demo data into SQLite database...');
    for (const fb of SEED_FEEDBACK) {
      execute(
        `INSERT OR REPLACE INTO feedback 
        (id, user_id, source, date, text, sentiment, theme, feature, severity, user_intent, is_demo, hindsight_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fb.id,
          fb.user_id,
          fb.source,
          fb.date,
          fb.text,
          fb.sentiment,
          fb.theme,
          fb.feature,
          fb.severity,
          fb.user_intent,
          fb.is_demo,
          fb.hindsight_status,
          fb.created_at,
        ]
      );
    }

    for (const pc of SEED_PRODUCT_CHANGES) {
      execute(
        `INSERT OR REPLACE INTO product_changes 
        (id, date, feature, title, description, reason, related_theme, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pc.id,
          pc.date,
          pc.feature,
          pc.title,
          pc.description,
          pc.reason,
          pc.related_theme,
          pc.created_at,
        ]
      );
    }
    console.log(`Database seeded with ${SEED_FEEDBACK.length} feedback items and ${SEED_PRODUCT_CHANGES.length} product changes.`);
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Health check
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const fbCount = queryOne<any>('SELECT COUNT(*) as c FROM feedback')?.c ?? 0;
    const pcCount = queryOne<any>('SELECT COUNT(*) as c FROM product_changes')?.c ?? 0;
    const bankInfo = await HindsightService.getBankInfo();

    res.json({
      status: 'ok',
      service: 'FeedbackMind AI',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        feedbackCount: fbCount,
        productChangesCount: pcCount,
      },
      hindsight: bankInfo,
      groq: {
        status: process.env.GROQ_API_KEY ? 'configured' : 'missing_key',
        model: 'openai/gpt-oss-120b',
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. Feedback Routes
app.get('/api/feedback', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { source, feature, theme, sentiment, startDate, endDate, limit = '100', offset = '0' } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    if (source && source !== 'All') {
      conditions.push('source = ?');
      params.push(source);
    }
    if (feature && feature !== 'All') {
      conditions.push('feature = ?');
      params.push(feature);
    }
    if (theme && theme !== 'All') {
      conditions.push('theme = ?');
      params.push(theme);
    }
    if (sentiment && sentiment !== 'All') {
      conditions.push('sentiment = ?');
      params.push(sentiment);
    }
    if (startDate) {
      conditions.push('date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM feedback ${whereClause} ORDER BY date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string, 10) || 100);
    params.push(parseInt(offset as string, 10) || 0);

    const feedbackList = queryAll(sql, params);
    const countSql = `SELECT COUNT(*) as total FROM feedback ${whereClause}`;
    const totalCount = queryOne<any>(countSql, params.slice(0, -2))?.total || 0;

    res.json({
      data: feedbackList,
      total: totalCount,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feedback/:id', async (req: Request, res: Response) => {
  try {
    await getDb();
    const item = queryOne('SELECT * FROM feedback WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Analyze feedback without saving (for live previews)
app.post('/api/analyze-feedback', async (req: Request, res: Response) => {
  try {
    const { text, source } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback text is required' });
    }

    const analysis = await GroqService.analyzeFeedback(text.trim(), source);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Feedback analysis failed' });
  }
});

// Add Feedback with Groq Analysis + SQLite Persistence + Hindsight Retain
app.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { user_id, source, date, text } = req.body;

    if (!user_id || !source || !text) {
      return res.status(400).json({ error: 'user_id, source, and text are required fields.' });
    }

    const validSources = ['App Review', 'Support Ticket', 'Email', 'Survey', 'Social Media'];
    if (!validSources.includes(source)) {
      return res.status(400).json({ error: `source must be one of: ${validSources.join(', ')}` });
    }

    const feedbackDate = date ? new Date(date).toISOString() : new Date().toISOString();
    const feedbackId = `FB-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    // 1. Analyze with Groq
    const analysis = await GroqService.analyzeFeedback(text, source);

    // 2. Retain in Hindsight
    let hindsightStatus: 'retained' | 'failed' = 'failed';
    let hindsightError: string | null = null;
    let retainDetails: any = null;

    try {
      const memoryContent = `User feedback (${feedbackId}) from ${user_id} via ${source}: "${text}". Analyzed Feature: ${analysis.feature}. Theme: ${analysis.theme}. Sentiment: ${analysis.sentiment}. Severity: ${analysis.severity}. Intent: ${analysis.user_intent}.`;

      const retainRes = await HindsightService.retainMemory([
        {
          content: memoryContent,
          context: `Feedback:${analysis.feature}`,
          document_id: feedbackId,
          timestamp: feedbackDate,
          metadata: {
            user_id,
            source,
            feature: analysis.feature,
            theme: analysis.theme,
            sentiment: analysis.sentiment,
            severity: analysis.severity,
          },
          tags: [analysis.feature.toLowerCase(), analysis.sentiment.toLowerCase(), source.toLowerCase().replace(/\s+/g, '_')],
        },
      ]);

      if (retainRes.success) {
        hindsightStatus = 'retained';
        retainDetails = retainRes;
      }
    } catch (err: any) {
      console.error('Hindsight retain failed:', err.message);
      hindsightStatus = 'failed';
      hindsightError = 'Memory service unavailable. Please try again.';
    }

    // 3. Save to SQLite
    const createdAt = new Date().toISOString();
    execute(
      `INSERT INTO feedback 
      (id, user_id, source, date, text, sentiment, theme, feature, severity, user_intent, is_demo, hindsight_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feedbackId,
        user_id,
        source,
        feedbackDate,
        text,
        analysis.sentiment,
        analysis.theme,
        analysis.feature,
        analysis.severity,
        analysis.user_intent,
        0, // not demo
        hindsightStatus,
        createdAt,
      ]
    );

    const saved = queryOne('SELECT * FROM feedback WHERE id = ?', [feedbackId]);

    res.status(201).json({
      success: true,
      feedback: saved,
      analysis,
      hindsight: {
        status: hindsightStatus,
        error: hindsightError,
        details: retainDetails,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Dashboard Endpoints
app.get('/api/dashboard/summary', async (_req: Request, res: Response) => {
  try {
    await getDb();
    const totalRow = queryOne<any>('SELECT COUNT(*) as total FROM feedback');
    const total = totalRow?.total || 0;

    const sentimentRows = queryAll<any>(
      'SELECT sentiment, COUNT(*) as count FROM feedback GROUP BY sentiment'
    );
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    for (const r of sentimentRows) {
      if (r.sentiment === 'positive') positive = r.count;
      if (r.sentiment === 'neutral') neutral = r.count;
      if (r.sentiment === 'negative') negative = r.count;
    }

    const topThemes = queryAll<any>(
      `SELECT theme, COUNT(*) as count, 
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count
      FROM feedback GROUP BY theme ORDER BY count DESC LIMIT 6`
    );

    const topFeatures = queryAll<any>(
      `SELECT feature, COUNT(*) as count,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral_count
      FROM feedback GROUP BY feature ORDER BY count DESC LIMIT 6`
    );

    const recentFeedback = queryAll<any>('SELECT * FROM feedback ORDER BY date DESC LIMIT 6');
    const bankInfo = await HindsightService.getBankInfo();

    res.json({
      total,
      sentiment: {
        positive,
        positivePct: total > 0 ? Math.round((positive / total) * 100) : 0,
        neutral,
        neutralPct: total > 0 ? Math.round((neutral / total) * 100) : 0,
        negative,
        negativePct: total > 0 ? Math.round((negative / total) * 100) : 0,
      },
      topThemes,
      topFeatures,
      recentFeedback,
      hindsight: bankInfo,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/themes', async (_req: Request, res: Response) => {
  try {
    await getDb();
    const themes = queryAll<any>(
      `SELECT theme, feature, COUNT(*) as count,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
        MAX(severity) as max_severity
      FROM feedback GROUP BY theme, feature ORDER BY count DESC LIMIT 15`
    );
    res.json(themes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/sentiment-trend', async (_req: Request, res: Response) => {
  try {
    await getDb();
    // Group records by calendar week or 4-day interval for smooth timeline
    const allRecords = queryAll<any>('SELECT date, sentiment FROM feedback ORDER BY date ASC');
    if (allRecords.length === 0) {
      return res.json([]);
    }

    const buckets: Record<string, { date: string; positive: number; neutral: number; negative: number; total: number }> = {};

    for (const r of allRecords) {
      const d = new Date(r.date);
      // Group by week (start date of week)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff)).toISOString().split('T')[0];

      if (!buckets[weekStart]) {
        buckets[weekStart] = { date: weekStart, positive: 0, neutral: 0, negative: 0, total: 0 };
      }
      if (r.sentiment === 'positive') buckets[weekStart].positive++;
      else if (r.sentiment === 'neutral') buckets[weekStart].neutral++;
      else if (r.sentiment === 'negative') buckets[weekStart].negative++;
      buckets[weekStart].total++;
    }

    const trend = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
    res.json(trend);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Emerging Issue Radar
app.get('/api/insights/emerging-issues', async (_req: Request, res: Response) => {
  try {
    await getDb();
    // Find midpoint date or define last 14 days vs prior 14 days
    const minMax = queryOne<any>('SELECT MIN(date) as min_d, MAX(date) as max_d FROM feedback');
    if (!minMax || !minMax.min_d || !minMax.max_d) {
      return res.json({ issues: [], window: { recentStart: '', previousStart: '' } });
    }

    const maxTime = new Date(minMax.max_d).getTime();
    const minTime = new Date(minMax.min_d).getTime();
    const midpoint = new Date(minTime + (maxTime - minTime) * 0.55).toISOString();

    const previousRecords = queryAll<any>('SELECT * FROM feedback WHERE date < ?', [midpoint]);
    const recentRecords = queryAll<any>('SELECT * FROM feedback WHERE date >= ?', [midpoint]);

    const themeMap: Record<string, {
      theme: string;
      feature: string;
      currentCount: number;
      previousCount: number;
      severities: string[];
      affectedUsers: Set<string>;
      supportingFeedbackIds: string[];
      sampleTexts: string[];
    }> = {};

    for (const r of previousRecords) {
      if (!themeMap[r.theme]) {
        themeMap[r.theme] = {
          theme: r.theme,
          feature: r.feature,
          currentCount: 0,
          previousCount: 0,
          severities: [],
          affectedUsers: new Set(),
          supportingFeedbackIds: [],
          sampleTexts: [],
        };
      }
      themeMap[r.theme].previousCount++;
    }

    for (const r of recentRecords) {
      if (!themeMap[r.theme]) {
        themeMap[r.theme] = {
          theme: r.theme,
          feature: r.feature,
          currentCount: 0,
          previousCount: 0,
          severities: [],
          affectedUsers: new Set(),
          supportingFeedbackIds: [],
          sampleTexts: [],
        };
      }
      themeMap[r.theme].currentCount++;
      themeMap[r.theme].severities.push(r.severity);
      themeMap[r.theme].affectedUsers.add(r.user_id);
      themeMap[r.theme].supportingFeedbackIds.push(r.id);
      if (themeMap[r.theme].sampleTexts.length < 2) {
        themeMap[r.theme].sampleTexts.push(r.text);
      }
    }

    const issues = Object.values(themeMap)
      .map(t => {
        const growthPct = t.previousCount === 0
          ? (t.currentCount > 0 ? 100 : 0)
          : Math.round(((t.currentCount - t.previousCount) / t.previousCount) * 100);

        let severity: 'high' | 'medium' | 'low' = 'low';
        if (t.severities.includes('high')) severity = 'high';
        else if (t.severities.includes('medium')) severity = 'medium';

        let explanation = '';
        if (t.previousCount === 0 && t.currentCount > 0) {
          explanation = `Newly emergent theme observed across ${t.affectedUsers.size} user sessions.`;
        } else if (growthPct > 50) {
          explanation = `Accelerating volume up ${growthPct}% over the comparative window.`;
        } else if (growthPct < 0) {
          explanation = `Decelerating volume down ${Math.abs(growthPct)}% following recent fixes.`;
        } else {
          explanation = `Steady volume with consistent engagement.`;
        }

        return {
          theme: t.theme,
          feature: t.feature,
          currentCount: t.currentCount,
          previousCount: t.previousCount,
          growthPct,
          severity,
          affectedUsers: t.affectedUsers.size,
          explanation,
          supportingFeedbackIds: t.supportingFeedbackIds,
          sampleTexts: t.sampleTexts,
        };
      })
      .sort((a, b) => b.growthPct - a.growthPct);

    res.json({
      issues,
      window: {
        midpoint,
        totalRecent: recentRecords.length,
        totalPrevious: previousRecords.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Product Changes Routes
app.get('/api/product-changes', async (_req: Request, res: Response) => {
  try {
    await getDb();
    const changes = queryAll('SELECT * FROM product_changes ORDER BY date DESC');
    res.json(changes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/product-changes/:id', async (req: Request, res: Response) => {
  try {
    await getDb();
    const change = queryOne('SELECT * FROM product_changes WHERE id = ?', [req.params.id]);
    if (!change) {
      return res.status(404).json({ error: 'Product change not found' });
    }
    res.json(change);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/product-changes', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { date, feature, title, description, reason, related_theme } = req.body;

    if (!feature || !title || !description) {
      return res.status(400).json({ error: 'feature, title, and description are required' });
    }

    const changeId = `PC-${Date.now().toString(36).toUpperCase()}`;
    const changeDate = date ? new Date(date).toISOString() : new Date().toISOString();
    const createdAt = new Date().toISOString();

    // 1. Retain product change in Hindsight memory
    let memoryRetained = false;
    let hindsightError: string | null = null;
    try {
      const memoryContent = `Product Change Deployed: "${title}" for Feature: ${feature}. Date: ${changeDate}. Details: ${description}. Rationale: ${reason || 'N/A'}. Target Theme: ${related_theme || 'N/A'}.`;
      await HindsightService.retainMemory([
        {
          content: memoryContent,
          context: `ProductChange:${feature}`,
          document_id: changeId,
          timestamp: changeDate,
          metadata: {
            feature,
            title,
            related_theme: related_theme || '',
            type: 'product_change',
          },
          tags: ['product_change', feature.toLowerCase(), (related_theme || '').toLowerCase().replace(/\s+/g, '_')],
        },
      ]);
      memoryRetained = true;
    } catch (err: any) {
      console.error('Failed to retain product change in Hindsight:', err.message);
      hindsightError = 'Memory service unavailable. Please try again.';
    }

    // 2. Persist in SQLite
    execute(
      `INSERT INTO product_changes (id, date, feature, title, description, reason, related_theme, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [changeId, changeDate, feature, title, description, reason || '', related_theme || '', createdAt]
    );

    const saved = queryOne('SELECT * FROM product_changes WHERE id = ?', [changeId]);
    res.status(201).json({
      success: true,
      change: saved,
      hindsight: {
        retained: memoryRetained,
        error: hindsightError,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Feedback Time Machine (Compare Before / After)
app.post('/api/compare', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { changeId, feature: customFeature, date: customDate, title: customTitle } = req.body;

    let targetChange: any = null;
    if (changeId) {
      targetChange = queryOne('SELECT * FROM product_changes WHERE id = ?', [changeId]);
    }

    const feature = targetChange?.feature || customFeature;
    const changeDate = targetChange?.date || customDate;
    const title = targetChange?.title || customTitle || 'Selected Product Milestone';

    if (!changeDate || !feature) {
      return res.status(400).json({ error: 'changeId or (feature and date) is required for comparison.' });
    }

    // Retrieve feedback before and after the change for this feature
    const beforeRecords = queryAll<any>(
      'SELECT * FROM feedback WHERE feature = ? AND date < ? ORDER BY date DESC',
      [feature, changeDate]
    );
    const afterRecords = queryAll<any>(
      'SELECT * FROM feedback WHERE feature = ? AND date >= ? ORDER BY date ASC',
      [feature, changeDate]
    );

    const calculateMetrics = (records: any[]) => {
      const count = records.length;
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      for (const r of records) {
        if (r.sentiment === 'positive') positive++;
        else if (r.sentiment === 'neutral') neutral++;
        else if (r.sentiment === 'negative') negative++;
      }
      return {
        count,
        positive,
        positivePct: count > 0 ? Math.round((positive / count) * 100) : 0,
        neutral,
        neutralPct: count > 0 ? Math.round((neutral / count) * 100) : 0,
        negative,
        negativePct: count > 0 ? Math.round((negative / count) * 100) : 0,
        complaints: records.filter(r => r.sentiment === 'negative').slice(0, 5),
        praises: records.filter(r => r.sentiment === 'positive').slice(0, 5),
      };
    };

    const beforeMetrics = calculateMetrics(beforeRecords);
    const afterMetrics = calculateMetrics(afterRecords);

    // Recall real memories from Hindsight
    let recalledMemories: any[] = [];
    let hindsightStatus = 'ok';
    let hindsightError: string | null = null;

    try {
      const recallRes = await HindsightService.recallMemories(`${feature} user experience before and after ${title}`, {
        budget: 'mid',
      });
      recalledMemories = recallRes.memories;
    } catch (err: any) {
      hindsightStatus = 'failed';
      hindsightError = 'Memory service unavailable. Please try again.';
    }

    // Construct grounded observation (adhering to non-causation wording rule)
    let observationSummary = '';
    if (afterMetrics.positivePct > beforeMetrics.positivePct) {
      observationSummary = `Feedback became more positive during the selected period, with positive sentiment shifting from ${beforeMetrics.positivePct}% to ${afterMetrics.positivePct}%.`;
    } else if (afterMetrics.negativePct > beforeMetrics.negativePct) {
      observationSummary = `Negative feedback increased during the selected period, with negative sentiment shifting from ${beforeMetrics.negativePct}% to ${afterMetrics.negativePct}%.`;
    } else {
      observationSummary = `Sentiment distribution remained relatively consistent across the comparative window.`;
    }

    res.json({
      productChange: targetChange || { id: 'CUSTOM', feature, date: changeDate, title },
      observationSummary,
      before: beforeMetrics,
      after: afterMetrics,
      recalledMemories,
      hindsight: {
        status: hindsightStatus,
        error: hindsightError,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Ask Product Memory (Question -> Hindsight Recall -> Groq Reasoning -> Grounded Answer)
app.post('/api/ask', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { question } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // 1. Hindsight Recall
    let recalledMemories: any[] = [];
    let hindsightStatus = 'ok';
    let hindsightError: string | null = null;

    try {
      const recallRes = await HindsightService.recallMemories(question.trim(), { budget: 'mid' });
      recalledMemories = recallRes.memories;
    } catch (err: any) {
      console.error('Hindsight recall error during Ask:', err.message);
      hindsightStatus = 'failed';
      hindsightError = 'Memory service unavailable. Please try again.';
    }

    // 2. Query relevant stored feedback and product changes
    const storedFeedback = queryAll<any>('SELECT * FROM feedback ORDER BY date DESC LIMIT 25');
    const storedProductChanges = queryAll<any>('SELECT * FROM product_changes ORDER BY date DESC');

    // 3. Groq Reasoning
    const reasoning = await GroqService.askProductMemory(
      question.trim(),
      recalledMemories,
      storedFeedback,
      storedProductChanges
    );

    // Map supporting feedback IDs to actual records
    const supportingFeedbackRecords = storedFeedback.filter(f =>
      reasoning.supportingFeedbackIds.includes(f.id)
    );

    res.json({
      question: question.trim(),
      answer: reasoning.answer,
      evidence: reasoning.evidence,
      interpretation: reasoning.interpretation,
      recalledMemories,
      memoriesRetrievedCount: recalledMemories.length,
      supportingFeedbackIds: reasoning.supportingFeedbackIds,
      supportingFeedback: supportingFeedbackRecords,
      relatedProductChanges: reasoning.relatedProductChanges,
      hindsight: {
        status: hindsightStatus,
        error: hindsightError,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Direct Memory Endpoints (Retain & Recall)
app.post('/api/memory/retain', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }
    const result = await HindsightService.retainMemory(items);
    res.json(result);
  } catch (err: any) {
    res.status(503).json({ error: err.message || 'Memory service unavailable. Please try again.' });
  }
});

app.post('/api/memory/recall', async (req: Request, res: Response) => {
  try {
    const { query, budget, types, tags } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query string is required' });
    }
    const result = await HindsightService.recallMemories(query, { budget, types, tags });
    res.json(result);
  } catch (err: any) {
    res.status(503).json({ error: err.message || 'Memory service unavailable. Please try again.' });
  }
});

// 9. Reset / Seed Endpoint
app.post('/api/seed', async (_req: Request, res: Response) => {
  try {
    await getDb();
    execute('DELETE FROM feedback');
    execute('DELETE FROM product_changes');

    for (const fb of SEED_FEEDBACK) {
      execute(
        `INSERT INTO feedback 
        (id, user_id, source, date, text, sentiment, theme, feature, severity, user_intent, is_demo, hindsight_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fb.id,
          fb.user_id,
          fb.source,
          fb.date,
          fb.text,
          fb.sentiment,
          fb.theme,
          fb.feature,
          fb.severity,
          fb.user_intent,
          fb.is_demo,
          fb.hindsight_status,
          fb.created_at,
        ]
      );
    }

    for (const pc of SEED_PRODUCT_CHANGES) {
      execute(
        `INSERT INTO product_changes 
        (id, date, feature, title, description, reason, related_theme, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pc.id,
          pc.date,
          pc.feature,
          pc.title,
          pc.description,
          pc.reason,
          pc.related_theme,
          pc.created_at,
        ]
      );
    }

    res.json({
      success: true,
      message: 'Demo dataset re-seeded successfully',
      feedbackCount: SEED_FEEDBACK.length,
      changesCount: SEED_PRODUCT_CHANGES.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// VITE DEV SERVER / STATIC FILE MOUNTING
// -------------------------------------------------------------
async function startServer() {
  await initDatabaseAndSeed();

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FeedbackMind AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
