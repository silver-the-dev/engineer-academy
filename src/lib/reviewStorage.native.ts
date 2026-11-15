import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { ReviewRecord } from './review';

let opening: Promise<SQLiteDatabase> | undefined;
function database() {
  opening ??= (async () => {
    const db = await openDatabaseAsync('engineer-academy-admin-review.db');
    await db.execAsync('CREATE TABLE IF NOT EXISTS review_log (id INTEGER PRIMARY KEY AUTOINCREMENT, report TEXT NOT NULL)');
    return db;
  })().catch(error => { opening = undefined; throw error; });
  return opening;
}

export async function loadReviewRecords(): Promise<ReviewRecord[]> {
  const db = await database();
  const rows = await db.getAllAsync<{ report: string }>('SELECT report FROM review_log ORDER BY id');
  return rows.map(({ report }) => JSON.parse(report) as ReviewRecord);
}

export async function saveReviewRecord(record: ReviewRecord): Promise<void> {
  const db = await database();
  await db.runAsync('INSERT INTO review_log (report) VALUES (?)', JSON.stringify(record));
}
