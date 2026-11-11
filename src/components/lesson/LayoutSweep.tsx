import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, useWindowDimensions } from 'react-native';
import { allLessons, resolve } from '../../content';
import type { Exercise } from '../../content/types';
import { C } from '../../theme';
import { ExerciseHost } from './ExerciseHost';
import { LayoutProbe, type LayoutPart, type LayoutSample } from './LayoutProbe';

type Item = { id: string; ex: Exercise };
type Reading = { samples: Map<string, LayoutSample>; changedAt: number };
const BATCH = 12;

function expected(e: Exercise): Partial<Record<LayoutPart, number>> {
  switch (e.kind) {
    case 'mcq': case 'multi': return { choice: e.options.length };
    case 'match': return { choice: e.pairs.length * 2 };
    case 'tf': return { choice: 2 };
    case 'fill': return { token: e.bank.length, slot: e.answers.length };
    case 'order': return { order: e.items.length };
    case 'numeric': return { keypad: 14 };
    case 'interactive': return { widget: 1 };
  }
}

function AuditItem({ item, width, record }: { item: Item; width: number; record: (id: string, key: string, sample: LayoutSample) => void }) {
  const checkRef = useRef(null);
  const report = useCallback((key: string, sample: LayoutSample) => record(item.id, key, sample), [item.id, record]);
  return (
    <LayoutProbe.Provider value={report}>
      <ExerciseHost ex={item.ex} locked={false} onReady={() => {}} checkRef={checkRef} width={width} />
    </LayoutProbe.Provider>
  );
}

/** Internal diagnostics. Render every exercise in small batches through the
 * real native layout engine, and read settled dimensions from onLayout. */
export function LayoutSweep({ seed, only }: { seed: number; only?: string }) {
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, 700) - 32;
  const items = useMemo(() => allLessons().filter((l) => !only || l.lesson.id === only)
    .flatMap(({ lesson }) => lesson.exercises.map((src, i): Item => ({
      id: `${lesson.id}#${i}`, ex: resolve(src, seed + i * 7919),
    }))), [seed, only]);
  const [offset, setOffset] = useState(0);
  const issues = useRef<string[]>([]);
  const counts = useRef<Partial<Record<Exercise['kind'], number>>>({});
  const readings = useRef(new Map<string, Reading>());
  const record = useCallback((id: string, key: string, sample: LayoutSample) => {
    const reading = readings.current.get(id) ?? { samples: new Map(), changedAt: 0 };
    reading.samples.set(key, sample);
    reading.changedAt = Date.now();
    readings.current.set(id, reading);
  }, []);
  const batch = useMemo(() => items.slice(offset, offset + BATCH), [items, offset]);

  useEffect(() => {
    if (!batch.length) return;
    const started = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - started < 160 || (now - started < 1300 && batch.some(({ id }) => now - (readings.current.get(id)?.changedAt ?? 0) < 110))) return;
      clearInterval(timer);
      for (const item of batch) {
        const samples = [...(readings.current.get(item.id)?.samples.values() ?? [])];
        readings.current.delete(item.id);
        counts.current[item.ex.kind] = (counts.current[item.ex.kind] ?? 0) + 1;
        const problems: string[] = [];
        for (const [role, count] of Object.entries({ exercise: 1, ...expected(item.ex) })) {
          const controls = samples.filter((s) => s.part === role);
          if (controls.length !== count) problems.push(`${role}:${controls.length}/${count}`);
          if (controls.some((s) => s.width < 40 || s.height < 35 || s.width > contentW + 2)) {
            problems.push(`${role} dimensões ${controls.map((s) => `${s.width.toFixed(1)}x${s.height.toFixed(1)}`).join(',')}`);
          }
        }
        const tiny = samples.filter((s) => s.part === 'math' && (s.width <= 2 || s.height <= 2 || s.width > contentW + 2));
        if (tiny.length) problems.push(`TeX ${tiny.map((s) => `${s.width.toFixed(1)}x${s.height.toFixed(1)}`).join(',')}`);
        if (problems.length) {
          const problem = `${item.id} ${item.ex.kind}: ${problems.join('; ')}`;
          issues.current.push(problem);
          console.info(`EA_LAYOUT issue ${problem}`);
        }
      }
      const next = offset + batch.length;
      if (next === items.length || Math.floor(next / 480) > Math.floor(offset / 480)) {
        console.info(`EA_LAYOUT ${next === items.length ? 'done' : 'progress'} ${JSON.stringify({ seed, width, checked: next, total: items.length, kinds: counts.current, issues: issues.current.length })}`);
      }
      setOffset(next);
    }, 45);
    return () => clearInterval(timer);
  }, [batch, contentW, items.length, offset, seed, width]);

  return (
    <ScrollView removeClippedSubviews={false} style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, maxWidth: 732, alignSelf: 'center', width: '100%' }}>
      <Text style={{ color: C.text }}>Auditoria {offset}/{items.length} · alertas {issues.current.length}</Text>
      {batch.map((item) => <AuditItem key={item.id} item={item} record={record} width={contentW} />)}
      {!batch.length && issues.current.map((issue) => <Text key={issue} style={{ color: C.gold }}>{issue}</Text>)}
    </ScrollView>
  );
}
