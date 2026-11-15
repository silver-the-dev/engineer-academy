import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { ReviewRecord } from './review';

let opening: Promise<SQLiteDatabase> | undefined;
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.then(() => undefined, () => undefined);
  return next;
}

function database() {
  opening ??= (async () => {
    const db = await openDatabaseAsync('engineer-academy-admin-review.db');
    await db.execAsync('CREATE TABLE IF NOT EXISTS review_log (id INTEGER PRIMARY KEY AUTOINCREMENT, report TEXT NOT NULL)');
    return db;
  })().catch(error => { opening = undefined; throw error; });
  return opening;
}

export function loadReviewRecords(): Promise<ReviewRecord[]> {
  return serialize(async () => {
    try {
      const db = await database();
      const rows = await db.getAllAsync<{ report: string }>('SELECT report FROM review_log ORDER BY id');
      return rows.map(({ report }) => JSON.parse(report) as ReviewRecord);
    } catch (error) {
      opening = undefined;
      throw error;
    }
  });
}

export function saveReviewRecord(record: ReviewRecord): Promise<void> {
  const report = JSON.stringify(record);
  return serialize(async () => {
    try {
      const db = await database();
      await db.runAsync('INSERT INTO review_log (report) VALUES (?)', report);
    } catch (error) {
      opening = undefined;
      throw error;
    }
  });
}
