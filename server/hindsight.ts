import dotenv from 'dotenv';
dotenv.config();

const HINDSIGHT_BASE_URL = process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io';
const HINDSIGHT_API_KEY = process.env.HINDSIGHT_API_KEY || '';
const HINDSIGHT_BANK_ID = process.env.HINDSIGHT_BANK_ID || 'feedbackmind-ai';

export interface MemoryItemPayload {
  content: string;
  context?: string;
  document_id?: string;
  timestamp?: string;
  metadata?: Record<string, string>;
  tags?: string[];
}

export interface RecallOptions {
  types?: ('world' | 'experience' | 'observation')[];
  budget?: 'low' | 'mid' | 'high';
  max_tokens?: number;
  tags?: string[];
  temporal_window?: {
    start?: string;
    end?: string;
  };
}

export interface RecallResult {
  memories: Array<{
    id?: string;
    text: string;
    type?: string;
    score?: number;
    timestamp?: string;
    document_id?: string;
    entities?: string[];
    context?: string;
  }>;
  entities: Record<string, any>;
  raw?: any;
}

export class HindsightService {
  private static getHeaders() {
    if (!HINDSIGHT_API_KEY) {
      throw new Error('HINDSIGHT_API_KEY is not configured in server environment');
    }
    return {
      'Authorization': `Bearer ${HINDSIGHT_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  static async retainMemory(items: MemoryItemPayload[]): Promise<{ success: boolean; itemsCount: number; details?: any }> {
    if (!HINDSIGHT_API_KEY || !HINDSIGHT_BANK_ID) {
      throw new Error('Memory service unavailable. Please configure Hindsight API credentials.');
    }

    const url = `${HINDSIGHT_BASE_URL}/v1/default/banks/${encodeURIComponent(HINDSIGHT_BANK_ID)}/memories`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          items,
          async: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Hindsight Retain failed with HTTP ${response.status}:`, errorText);
        throw new Error('Memory service unavailable. Please try again.');
      }

      const data = await response.json();
      return {
        success: data.success ?? true,
        itemsCount: data.items_count ?? items.length,
        details: data,
      };
    } catch (err: any) {
      console.error('Hindsight Retain exception:', err.message);
      throw new Error('Memory service unavailable. Please try again.');
    }
  }

  static async recallMemories(query: string, options: RecallOptions = {}): Promise<RecallResult> {
    if (!HINDSIGHT_API_KEY || !HINDSIGHT_BANK_ID) {
      throw new Error('Memory service unavailable. Please configure Hindsight API credentials.');
    }

    const url = `${HINDSIGHT_BASE_URL}/v1/default/banks/${encodeURIComponent(HINDSIGHT_BANK_ID)}/memories/recall`;

    const body: Record<string, any> = {
      query,
      budget: options.budget || 'mid',
      max_tokens: options.max_tokens || 4096,
    };

    if (options.types && options.types.length > 0) {
      body.types = options.types;
    }
    if (options.tags && options.tags.length > 0) {
      body.tags = options.tags;
    }
    if (options.temporal_window) {
      body.temporal_window = options.temporal_window;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Hindsight Recall failed with HTTP ${response.status}:`, errorText);
        throw new Error('Memory service unavailable. Please try again.');
      }

      const data = await response.json();

      // Normalize returned facts/memories from Hindsight Cloud response
      const memories: RecallResult['memories'] = [];

      // Facts or memories list
      if (Array.isArray(data.facts)) {
        for (const fact of data.facts) {
          memories.push({
            id: fact.id || fact.fact_id,
            text: fact.fact || fact.text || fact.content || '',
            type: fact.fact_type || fact.type || 'fact',
            score: fact.score,
            timestamp: fact.occurred_start || fact.mentioned_at || fact.timestamp,
            document_id: fact.document_id,
            context: fact.context,
          });
        }
      } else if (Array.isArray(data.results)) {
        for (const r of data.results) {
          memories.push({
            id: r.id,
            text: r.text || r.content || r.fact || '',
            type: r.type,
            score: r.score,
            timestamp: r.timestamp,
            document_id: r.document_id,
          });
        }
      }

      // If entities are returned with observations, extract them
      const entities = data.entities || {};
      if (typeof entities === 'object' && entities !== null) {
        for (const [entityName, entityData] of Object.entries<any>(entities)) {
          if (Array.isArray(entityData?.observations)) {
            for (const obs of entityData.observations) {
              memories.push({
                id: obs.id || obs.observation_id,
                text: `${entityName}: ${obs.text || obs.content || obs.observation}`,
                type: 'observation',
                entities: [entityName],
              });
            }
          }
        }
      }

      return {
        memories,
        entities,
        raw: {
          total_facts: memories.length,
          bank_id: HINDSIGHT_BANK_ID,
        },
      };
    } catch (err: any) {
      console.error('Hindsight Recall exception:', err.message);
      throw new Error('Memory service unavailable. Please try again.');
    }
  }

  static async getBankInfo(): Promise<{ status: string; bankId: string; factCount?: number; totalDocuments?: number; totalObservations?: number; totalLinks?: number }> {
    try {
      const url = `${HINDSIGHT_BASE_URL}/v1/default/banks/${encodeURIComponent(HINDSIGHT_BANK_ID)}/stats`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          status: 'online',
          bankId: HINDSIGHT_BANK_ID,
          factCount: data.total_nodes ?? 0,
          totalDocuments: data.total_documents ?? 0,
          totalObservations: data.total_observations ?? 0,
          totalLinks: data.total_links ?? 0,
        };
      }
      return { status: 'offline', bankId: HINDSIGHT_BANK_ID };
    } catch {
      return { status: 'unreachable', bankId: HINDSIGHT_BANK_ID };
    }
  }
}
