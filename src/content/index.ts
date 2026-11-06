import type { Exercise, ExerciseSource, Lesson, Section, Unit } from './types';
import { isGenerator } from './types';
import { makeRng, shuffle } from '../lib/random';
import { SECTIONS } from './sections';

export { SECTIONS };

type Loc = { section: Section; unit: Unit; lesson: Lesson; unitIndex: number; lessonIndex: number };
const LESSON_MAP = new Map<string, Loc>();
const UNIT_MAP = new Map<string, { section: Section; unit: Unit; unitIndex: number }>();
for (const section of SECTIONS) {
  section.units.forEach((unit, unitIndex) => {
    UNIT_MAP.set(unit.id, { section, unit, unitIndex });
    unit.lessons.forEach((lesson, lessonIndex) => LESSON_MAP.set(lesson.id, { section, unit, lesson, unitIndex, lessonIndex }));
  });
}

export const findLesson = (id: string) => LESSON_MAP.get(id);
export const findUnit = (id: string) => UNIT_MAP.get(id);
export const findSection = (id: string) => SECTIONS.find((s) => s.id === id);
export const allLessons = () => Array.from(LESSON_MAP.values());

export type QueueItem = { ex: Exercise; lessonId: string; idx: number; retry?: boolean };

export function resolve(src: ExerciseSource, seed: number): Exercise {
  if (isGenerator(src)) return src.gen(makeRng(seed));
  return src;
}

/** Exercises of one sub-lesson, kept in authored order (easy -> hard). */
export function buildQueue(lesson: Lesson, part = 0, seed = Date.now()): QueueItem[] {
  const p = lesson.parts[Math.min(Math.max(0, part), lesson.parts.length - 1)];
  const out: QueueItem[] = [];
  for (let idx = p.start; idx < p.start + p.count; idx++) out.push({ ex: resolve(lesson.exercises[idx], seed + idx * 7919), lessonId: lesson.id, idx });
  return out;
}

/** How many sub-lessons of a lesson are finished (all of them once the lesson is done). */
export function partsDone(lesson: Lesson, done: Record<string, unknown>, parts: Record<string, number>): number {
  if (done[lesson.id]) return lesson.parts.length;
  return Math.min(lesson.parts.length, parts[lesson.id] ?? 0);
}

/** Checkpoint for a unit: samples exercises from every lesson. */
export function buildUnitReview(unit: Unit, seed = Date.now(), n = 12): QueueItem[] {
  const rng = makeRng(seed);
  const pool: QueueItem[] = [];
  unit.lessons.forEach((l) => l.exercises.forEach((src, idx) => pool.push({ ex: resolve(src, seed + idx * 31 + l.id.length * 997), lessonId: l.id, idx })));
  return shuffle(rng, pool).slice(0, n);
}

/** Review session from recorded mistakes + random items from completed lessons. */
export function buildPractice(mistakes: Record<string, { lessonId: string; idx: number; count: number }>, completed: string[], seed = Date.now(), n = 10): QueueItem[] {
  const rng = makeRng(seed);
  const items: QueueItem[] = [];
  const ms = shuffle(rng, Object.values(mistakes)).sort((a, b) => b.count - a.count);
  for (const m of ms) {
    const loc = LESSON_MAP.get(m.lessonId);
    const src = loc?.lesson.exercises[m.idx];
    if (!src) continue;
    items.push({ ex: resolve(src, seed + items.length * 101), lessonId: m.lessonId, idx: m.idx });
    if (items.length >= Math.ceil(n * 0.7)) break;
  }
  const pool = shuffle(rng, completed.length ? completed : Array.from(LESSON_MAP.keys()).slice(0, 3));
  let guard = 0;
  while (items.length < n && guard++ < 200) {
    const lid = pool[guard % pool.length];
    const loc = LESSON_MAP.get(lid);
    if (!loc || !loc.lesson.exercises.length) continue;
    const idx = Math.floor(rng() * loc.lesson.exercises.length);
    const key = lid + '#' + idx;
    if (items.some((it) => it.lessonId + '#' + it.idx === key)) continue;
    items.push({ ex: resolve(loc.lesson.exercises[idx], seed + guard * 13), lessonId: lid, idx });
  }
  return shuffle(rng, items);
}

/** Lesson availability following the path (each section progresses independently). */
export function isLessonUnlocked(lessonId: string, done: Record<string, unknown>, freeMode: boolean): boolean {
  if (freeMode) return true;
  const loc = LESSON_MAP.get(lessonId);
  if (!loc) return false;
  const { section, unitIndex, lessonIndex } = loc;
  if (unitIndex === 0 && lessonIndex === 0) return true;
  // previous lesson in path
  let prev: Lesson | undefined;
  if (lessonIndex > 0) prev = section.units[unitIndex].lessons[lessonIndex - 1];
  else {
    const pu = section.units[unitIndex - 1];
    prev = pu.lessons[pu.lessons.length - 1];
  }
  return !!prev && !!done[prev.id];
}

export function sectionProgress(section: Section, done: Record<string, unknown>) {
  let total = 0;
  let n = 0;
  for (const u of section.units) for (const l of u.lessons) {
    total++;
    if (done[l.id]) n++;
  }
  return { done: n, total };
}
