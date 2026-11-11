import { createContext, useContext, useId } from 'react';
import type { LayoutChangeEvent } from 'react-native';

export type LayoutPart = 'exercise' | 'choice' | 'token' | 'slot' | 'order' | 'keypad' | 'widget' | 'math';
export type LayoutSample = { width: number; height: number; part: LayoutPart };
export const LayoutProbe = createContext<((key: string, sample: LayoutSample) => void) | null>(null);

export function useLayoutProbe(part: LayoutPart) {
  const report = useContext(LayoutProbe);
  const key = useId();
  if (!report) return undefined;
  return (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    report(key, { width, height, part });
  };
}
