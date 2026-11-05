import type { Exercise, Fill, Generator, Interactive, MCQ, Match, MultiSelect, Numeric, Order, Rng, TrueFalse, VisualSpec } from './types';
import { mcqOptions } from '../lib/random';

type Extra = { explain?: string; visual?: VisualSpec; hint?: string };

export const mcq = (prompt: string, options: string[], answer: number, explain?: string, extra: Omit<Extra, 'explain'> = {}): MCQ => ({ kind: 'mcq', prompt, options, answer, explain, ...extra });

/** MCQ whose first option is the correct one; options are shuffled at runtime. */
export const mcqS = (prompt: string, correct: string, wrong: string[], explain?: string, extra: Omit<Extra, 'explain'> = {}): Generator => ({
  gen: (rng) => {
    const { options, answer } = mcqOptions(rng, correct, wrong, Math.min(4, wrong.length + 1));
    return { kind: 'mcq', prompt, options, answer, explain, ...extra };
  },
});

export const multi = (prompt: string, options: string[], answers: number[], explain?: string, extra: Omit<Extra, 'explain'> = {}): MultiSelect => ({ kind: 'multi', prompt, options, answers, explain, ...extra });
export const tf = (prompt: string, answer: boolean, explain?: string, extra: Omit<Extra, 'explain'> = {}): TrueFalse => ({ kind: 'tf', prompt, answer, explain, ...extra });
export const num = (prompt: string, answer: number, explain?: string, extra: Omit<Extra, 'explain'> & { tol?: number; unit?: string } = {}): Numeric => ({ kind: 'numeric', prompt, answer, explain, ...extra });
export const match = (prompt: string, pairs: [string, string][], explain?: string): Match => ({ kind: 'match', prompt, pairs, explain });
export const order = (prompt: string, items: string[], explain?: string): Order => ({ kind: 'order', prompt, items, explain });
export const fill = (prompt: string, template: string, answers: string[], distractors: string[], explain?: string): Fill => ({ kind: 'fill', prompt, template, answers, bank: [...answers, ...distractors], explain });
export const inter = (prompt: string, widget: string, props: Record<string, any>, check: (v: any) => boolean, answerText?: string, explain?: string): Interactive => ({ kind: 'interactive', prompt, widget, props, check, answerText, explain });

export const gen = (fn: (rng: Rng) => Exercise): Generator => ({ gen: fn });

/** Random MCQ helper inside generators. */
export function rmcq(rng: Rng, prompt: string, correct: string, wrong: string[], explain?: string, extra: Omit<Extra, 'explain'> = {}): MCQ {
  const { options, answer } = mcqOptions(rng, correct, wrong, Math.min(4, wrong.length + 1));
  return { kind: 'mcq', prompt, options, answer, explain, ...extra };
}

export const plot = (props: Record<string, any>, height?: number): VisualSpec & { props: Record<string, any> } => ({ name: 'plot', props, height });
export const table = (head: string[] | undefined, rows: (string | number)[][], highlight?: number[]): VisualSpec => ({ name: 'table', props: { head, rows, highlight } });

export const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
