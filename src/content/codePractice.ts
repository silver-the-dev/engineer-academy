import type { CCase, CChallenge, CCheck } from '../lib/c/challenge';
import type { Interactive, UnitDef } from './types';

export const cLab = (prompt: string, props: CChallenge, solution: string, explain: string): Interactive => ({
  kind: 'interactive', widget: 'c-lab', prompt, props, solution, explain,
  check: (value: CCheck | null) => value?.passed === true,
});

export const program = (prompt: string, starter: string, solution: string, output: string, explain: string) => {
  const wrap = (body: string) => '#include <stdio.h>\n\nint main(void) {\n' + body.split('\n').map((line) => '  ' + line).join('\n') + '\n}';
  return cLab(prompt, { starter: wrap(starter), cases: [{ output, value: 0 }] }, wrap(solution), explain);
};

export const functionLab = (prompt: string, signature: string, starter: string, solution: string, cases: [number[], number][], explain: string) => {
  const entry = signature.split('(')[0];
  const wrap = (body: string) => 'int ' + signature + ' {\n' + body.split('\n').map((line) => '  ' + line).join('\n') + '\n}';
  return cLab(prompt, { starter: wrap(starter), entry, cases: cases.map(([args, value]): CCase => ({ args, value })) }, wrap(solution), explain);
};

export const codePuzzle = (prompt: string, lines: string[], distractors: string[], explain: string): Interactive => ({
  kind: 'interactive', widget: 'code-puzzle', prompt, props: { pieces: [...lines, ...distractors], slots: lines.length }, solution: lines, explain,
  check: (value: string[] | null) => Array.isArray(value) && value.length === lines.length && value.every((s, i) => s.trim() === lines[i].trim()),
});

export type PracticeByLesson = Record<string, [Interactive, Interactive?]>;

/** Replace one quiz per part. Indices and counts stay fixed for saved progress. */
export function withPractice(unit: UnitDef, practice: PracticeByLesson): UnitDef {
  return {
    ...unit,
    lessons: unit.lessons.map((lesson) => {
      const tasks = practice[lesson.id];
      if (!tasks || !lesson.parts) return lesson;
      return {
        ...lesson,
        parts: lesson.parts.map((part, i) => {
          const task = tasks[i];
          if (!task) return part;
          const exercises = part.exercises.slice();
          // Keep existing labs and put the new challenge in the last quiz slot.
          let index = -1;
          for (let j = exercises.length - 1; j >= 0; j--) {
            const ex = exercises[j];
            if ('kind' in ex && (ex.kind === 'mcq' || ex.kind === 'tf')) { index = j; break; }
          }
          if (index < 0) {
            for (let j = exercises.length - 1; j >= 0; j--) {
              const ex = exercises[j];
              if ('kind' in ex && ex.kind !== 'interactive') { index = j; break; }
            }
          }
          if (index >= 0) exercises[index] = task;
          return { ...part, exercises };
        }),
      };
    }),
  };
}
