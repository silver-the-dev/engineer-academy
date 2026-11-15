// Web preview only. Metro uses the SQLite implementation on mobile.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReviewRecord } from './review';

const KEY = 'engineer-academy.admin.reviews.web.v1';

export async function loadReviewRecords(): Promise<ReviewRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) as ReviewRecord[] : [];
}

export async function saveReviewRecord(record: ReviewRecord): Promise<void> {
  const records = await loadReviewRecords();
  await AsyncStorage.setItem(KEY, JSON.stringify([...records, record]));
}
