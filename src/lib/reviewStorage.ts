// Web preview only. Metro uses the SQLite implementation on mobile.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReviewRecord } from './review';

const KEY = 'engineer-academy.admin.reviews.web.v1';
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.then(() => undefined, () => undefined);
  return next;
}

async function readRecords(): Promise<ReviewRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) as ReviewRecord[] : [];
}

export function loadReviewRecords(): Promise<ReviewRecord[]> {
  return serialize(readRecords);
}

export function saveReviewRecord(record: ReviewRecord): Promise<void> {
  const serialized = JSON.parse(JSON.stringify(record)) as ReviewRecord;
  return serialize(async () => {
    const records = await readRecords();
    await AsyncStorage.setItem(KEY, JSON.stringify([...records, serialized]));
  });
}
