export type Rng = () => number;

/** Interactive visual shown in a theory card or attached to an exercise. */
export type VisualSpec = { name: string; props?: Record<string, any>; height?: number };

export type Card = {
  title?: string;
  body: string; // RichText markup
  formula?: string; // key formula, rendered big (TeX)
  visual?: VisualSpec;
  tip?: string; // "Dica" box (RichText)
  example?: string; // worked example (RichText)
};

type Base = {
  prompt: string; // RichText
  explain?: string; // RichText shown in feedback
  visual?: VisualSpec;
  hint?: string;
};

export type MCQ = Base & { kind: 'mcq'; options: string[]; answer: number };
export type MultiSelect = Base & { kind: 'multi'; options: string[]; answers: number[] };
export type Numeric = Base & {
  kind: 'numeric';
  answer: number;
  tol?: number; // absolute tolerance
  unit?: string;
  placeholder?: string;
};
export type TrueFalse = Base & { kind: 'tf'; answer: boolean };
export type Match = Base & { kind: 'match'; pairs: [string, string][] };
export type Order = Base & { kind: 'order'; items: string[] }; // items in correct order
/** template contains "___" slots, filled in order from the bank */
export type Fill = Base & { kind: 'fill'; template: string; answers: string[]; bank: string[] };
export type Interactive = Base & {
  kind: 'interactive';
  widget: string;
  props: Record<string, any>;
  check: (value: any) => boolean;
  answerText?: string; // shown when wrong
};

export type Exercise = MCQ | MultiSelect | Numeric | TrueFalse | Match | Order | Fill | Interactive;
export type Generator = { gen: (rng: Rng) => Exercise };
export type ExerciseSource = Exercise | Generator;

/** Sub-lesson (one segment of the ring around a path node): theory, then exercises from easy to hard. */
export type Part = { card: Card | Card[]; exercises: ExerciseSource[] };

/** Authoring shape: `parts` (sub-lessons) or the older single block of cards + exercises. */
export type LessonDef = { id: string; title: string; parts?: Part[]; cards?: Card[]; exercises?: ExerciseSource[] };

/** Runtime index of a sub-lesson inside the lesson's flat exercise list. */
export type LessonPart = { title: string; cards: Card[]; start: number; count: number };

/** Runtime lesson: flat cards/exercises (exercise idx = position here) plus the sub-lesson index. */
export type Lesson = {
  id: string;
  title: string;
  cards: Card[];
  exercises: ExerciseSource[];
  parts: LessonPart[];
};

export type Unit = {
  id: string;
  title: string;
  subtitle: string;
  icon: string; // emoji
  source?: string; // which university material it covers
  extra?: boolean; // topic added beyond the official material
  guide?: string; // RichText summary ("Guia da unidade")
  lessons: Lesson[];
};

export type UnitDef = Omit<Unit, 'lessons'> & { lessons: LessonDef[] };

export type Section = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  emoji: string;
  units: Unit[];
};

export function isGenerator(e: ExerciseSource): e is Generator {
  return typeof (e as Generator).gen === 'function';
}

export type SectionDef = Omit<Section, 'units'> & { units: UnitDef[] };

export function normalizeLesson(def: LessonDef): Lesson {
  if (!def.parts) {
    const cards = def.cards ?? [];
    const exercises = def.exercises ?? [];
    return { id: def.id, title: def.title, cards, exercises, parts: [{ title: def.title, cards, start: 0, count: exercises.length }] };
  }
  const cards: Card[] = [];
  const exercises: ExerciseSource[] = [];
  const parts: LessonPart[] = def.parts.map((p) => {
    const pc = Array.isArray(p.card) ? p.card : [p.card];
    const part = { title: pc[0]?.title ?? def.title, cards: pc, start: exercises.length, count: p.exercises.length };
    cards.push(...pc);
    exercises.push(...p.exercises);
    return part;
  });
  return { id: def.id, title: def.title, cards, exercises, parts };
}

export function normalizeSection(def: SectionDef): Section {
  return { ...def, units: def.units.map((u) => ({ ...u, lessons: u.lessons.map(normalizeLesson) })) };
}
