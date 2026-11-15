import { allLessons, findLesson, resolve } from '../content';
import revisions from '../content/review-catalog.json';
import type { Exercise } from '../content/types';
import { makeRng, shuffle } from './random';

export type ReviewQuestion = {
  key: string;
  revision: string;
  lessonId: string;
  lessonTitle: string;
  sectionId: string;
  sectionTitle: string;
  part: number;
  index: number;
  numberInPart: number;
};

export type ReviewVerdict = 'approved' | 'issue';
export type ReviewEvaluation = {
  accepted: boolean | null;
  submission?: unknown;
  error?: string;
};
export type ReviewRecord = {
  question: ReviewQuestion;
  seed: number;
  appVersion: string;
  sessionId: string;
  reviewedAt: string;
  verdict: ReviewVerdict;
  note: string;
  exercise: ReturnType<typeof exerciseSnapshot> | { kind: 'unavailable' };
  evaluation: ReviewEvaluation;
};

export function revisionKeys(lessonId: string, fingerprints: readonly string[]) {
  const counts = new Map<string, number>();
  return fingerprints.map(revision => {
    const count = (counts.get(revision) ?? 0) + 1;
    counts.set(revision, count);
    return lessonId + ':' + revision + ':' + count;
  });
}

let catalog: ReviewQuestion[] | undefined;
export function reviewCatalog(): ReviewQuestion[] {
  catalog ??= allLessons().flatMap(({ section, lesson }) => {
    const fingerprints = (revisions as Record<string, string[]>)[lesson.id];
    if (fingerprints?.length !== lesson.exercises.length) throw new Error('O catálogo de revisão precisa ser atualizado.');
    const keys = revisionKeys(lesson.id, fingerprints);
    return lesson.parts.flatMap(({ start, count }, part) => keys.slice(start, start + count).map((key, offset) => ({
      key,
      revision: fingerprints[start + offset],
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      sectionId: section.id,
      sectionTitle: section.title,
      part: part + 1,
      index: start + offset,
      numberInPart: offset + 1,
    })));
  });
  return catalog;
}

export function latestReviews(records: readonly ReviewRecord[]) {
  return new Map(records.map(record => [record.question.key, record]));
}

export function reviewBatch(questions: readonly ReviewQuestion[], latest: ReadonlyMap<string, ReviewRecord>, seed: number, limit = 10) {
  return shuffle(makeRng(seed), questions.filter(question => !latest.has(question.key))).slice(0, limit);
}

export function materializeReview(question: ReviewQuestion, seed: number): Exercise {
  const source = findLesson(question.lessonId)?.lesson.exercises[question.index];
  if (!source) throw new Error('Questão indisponível.');
  return resolve(source, seed);
}

export function exerciseSnapshot(ex: Exercise) {
  const base = { prompt: ex.prompt, kind: ex.kind, explanation: ex.explain, visual: ex.visual?.name };
  switch (ex.kind) {
    case 'mcq': return { ...base, options: ex.options, expected: ex.options[ex.answer] };
    case 'multi': return { ...base, options: ex.options, expected: ex.answers.map(i => ex.options[i]) };
    case 'tf': return { ...base, expected: ex.answer };
    case 'numeric': return { ...base, expected: ex.answer, unit: ex.unit, tolerance: ex.tol };
    case 'match': return { ...base, expected: ex.pairs };
    case 'order': return { ...base, expected: ex.items };
    case 'fill': return { ...base, template: ex.template, bank: ex.bank, expected: ex.answers };
    case 'interactive': return { ...base, widget: ex.widget, expected: ex.answerText, referenceSolution: ex.solution };
  }
}

export function reviewAnswer(ex: Exercise): { text?: string; code?: string } {
  switch (ex.kind) {
    case 'mcq': return { text: ex.options[ex.answer] };
    case 'multi': return { text: ex.answers.map(i => ex.options[i]).join('\n') };
    case 'tf': return { text: ex.answer ? 'Verdadeiro' : 'Falso' };
    case 'numeric': return {
      text: [String(ex.answer).replace('.', ','), ex.unit].filter(Boolean).join(' ')
        + '\n' + (ex.tol === undefined ? 'Tolerância: valor exato' : 'Tolerância: ± ' + String(ex.tol).replace('.', ',')),
    };
    case 'match': return { text: ex.pairs.map(([left, right]) => left + ' → ' + right).join('\n') };
    case 'order': return { text: ex.items.map((item, i) => (i + 1) + '. ' + item).join('\n') };
    case 'fill': return { text: ex.template.split('___').map((part, i) => part + (ex.answers[i] ?? '')).join('') };
    case 'interactive':
      if (ex.widget === 'c-lab' && typeof ex.solution === 'string') return { text: ex.answerText, code: ex.solution };
      if (ex.widget === 'code-puzzle' && Array.isArray(ex.solution)) return { text: ex.answerText, code: ex.solution.join('\n') };
      return { text: ex.answerText };
  }
}

export function reviewReport(questions: readonly ReviewQuestion[], records: readonly ReviewRecord[], appVersion: string, exportedAt: string) {
  const current = new Map(questions.map(question => [question.key, question]));
  const activeKeys = new Set(current.keys());
  const latest = latestReviews(records);
  const active = [...latest.values()].filter(record => activeKeys.has(record.question.key));
  return {
    format: 'engineer-academy-review',
    schemaVersion: 1,
    appVersion,
    exportedAt,
    summary: {
      totalQuestions: questions.length,
      pending: questions.length - active.length,
      approved: active.filter(record => record.verdict === 'approved').length,
      issues: active.filter(record => record.verdict === 'issue').length,
    },
    reviews: records.map(record => ({
      ...record,
      currentRevision: activeKeys.has(record.question.key),
      // Where this question is now: the position saved with the record goes stale when a lesson is edited.
      currentLocation: current.has(record.question.key) ? record.question.lessonId + '#' + current.get(record.question.key)!.index : null,
      latestForRevision: latest.get(record.question.key) === record,
    })),
  };
}
