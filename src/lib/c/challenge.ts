import { runC } from './run';

export type CCase = { args?: number[]; value?: number; output?: string };
export type CChallenge = { starter: string; entry?: string; cases: CCase[] };

export function checkC(source: string, challenge: Pick<CChallenge, 'entry' | 'cases'>) {
  const cases = challenge.cases.map((test) => {
    const result = runC(source, challenge.entry, test.args);
    const passed = result.ok && (test.value === undefined || result.value === test.value)
      && (test.output === undefined || result.output.trimEnd() === test.output.trimEnd());
    return { ...test, result, passed };
  });
  return { cases, passed: cases.length > 0 && cases.every((test) => test.passed) };
}

export type CCheck = ReturnType<typeof checkC>;
