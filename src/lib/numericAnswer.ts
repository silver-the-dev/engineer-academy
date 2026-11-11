import type { Numeric } from '../content/types';

export const NUMERIC_INPUT_LIMIT = 14;

/** Accept a decimal or fraction only after the whole answer has been entered. */
export function parseNumber(input: string): number | null {
  const text = input.replace(/\s/g, '').replaceAll('−', '-');
  const pieces = text.split('/');
  if (pieces.length > 2 || pieces.some(piece => !/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(piece))) return null;
  const numerator = Number(pieces[0].replace(',', '.'));
  const denominator = pieces[1] === undefined ? 1 : Number(pieces[1].replace(',', '.'));
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : null;
}

export function checkNumeric(ex: Pick<Numeric, 'answer' | 'tol'>, input: string): boolean {
  const value = parseNumber(input);
  const tolerance = ex.tol ?? Math.max(1e-6, Math.abs(ex.answer) * 1e-6);
  return value !== null && Math.abs(value - ex.answer) <= tolerance + 1e-12;
}
