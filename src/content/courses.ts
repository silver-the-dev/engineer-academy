import type { CourseId, Section } from './types';
import { SECTIONS } from './sections';

export type Course = { id: CourseId; title: string; short: string; emoji: string; color: string };

/** Courses work like languages in Duolingo: each one has its own list of sections. */
export const COURSES: Course[] = [
  { id: 'mat', title: 'Matemática', short: 'Matemática', emoji: '📐', color: '#7C5CFF' },
  { id: 'fis', title: 'Física e Eletricidade', short: 'Física', emoji: '⚡', color: '#FFE14D' },
  { id: 'emb', title: 'Sistemas Embarcados', short: 'Embarcados', emoji: '🤖', color: '#F4A261' },
];

export const courseOf = (s: Section): CourseId => s.course ?? 'mat';
export const sectionsOf = (course: CourseId): Section[] => SECTIONS.filter((s) => courseOf(s) === course);
/** Only courses that already have content. */
export const availableCourses = (): Course[] => COURSES.filter((c) => sectionsOf(c.id).length > 0);
