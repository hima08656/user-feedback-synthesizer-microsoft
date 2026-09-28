import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'feedbackmind.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Create tables if they do not exist
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source TEXT NOT NULL,
      date TEXT NOT NULL,
      text TEXT NOT NULL,
      sentiment TEXT NOT NULL,
      theme TEXT NOT NULL,
      feature TEXT NOT NULL,
      severity TEXT NOT NULL,
      user_intent TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      hindsight_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_changes (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      feature TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      reason TEXT,
      related_theme TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_feedback_date ON feedback(date);
    CREATE INDEX IF NOT EXISTS idx_feedback_feature ON feedback(feature);
    CREATE INDEX IF NOT EXISTS idx_feedback_theme ON feedback(theme);
    CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
    CREATE INDEX IF NOT EXISTS idx_product_changes_date ON product_changes(date);
  `);

  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

export function queryAll<T = Record<string, any>>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = Record<string, any>>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function execute(sql: string, params: any[] = []): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  saveDb();
}
