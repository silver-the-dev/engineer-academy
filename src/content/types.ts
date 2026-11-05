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

export type Lesson = {
  id: string;
  title: string;
  cards: Card[];
  exercises: ExerciseSource[];
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
