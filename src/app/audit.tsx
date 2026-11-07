import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { allLessons, findLesson, resolve } from '../content';
import { CardView } from '../components/lesson/CardView';
import { ExerciseHost } from '../components/lesson/ExerciseHost';
import { CheckResult } from '../components/exercises/common';
import { C, F } from '../theme';

/**
 * Internal layout audit (web preview): `/audit?id=<lessonId>` renders every card and
 * exercise of a lesson one below the other, at the same width as the lesson screen,
 * so a script can measure overflowing formulas and clipped/overlapping plot labels.
 * Each block is wrapped in a View with nativeID `a|<lessonId>|<c|e><index>`.
 * `/audit` alone lists the lesson ids (element `audit-ids`).
 */
export default function Audit() {
  const params = useLocalSearchParams<{ id?: string; seed?: string }>();
  const [id, setId] = useState(params.id);
  const seed = params.seed;
  useEffect(() => {
    // lets the audit script switch lessons without reloading the bundle
    (globalThis as any).__auditGo = (next: string) => setId(next);
  }, []);
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, 700) - 32;
  const checkRef = useRef<(() => CheckResult) | null>(null);
  const loc = id ? findLesson(id) : undefined;
  const items = useMemo(() => {
    if (!loc) return [];
    const s = Number(seed ?? 1);
    return loc.lesson.exercises.map((src, i) => resolve(src, s + i * 7919));
  }, [loc, seed]);

  if (!id) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
        <Text nativeID="audit-ids" style={{ color: C.text, fontFamily: F.semibold, fontSize: 11 }}>
          {allLessons()
            .map((l) => l.lesson.id)
            .join(' ')}
        </Text>
      </ScrollView>
    );
  }
  if (!loc) return <Text style={{ color: C.danger }}>Lição não encontrada: {id}</Text>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, maxWidth: 732, alignSelf: 'center', width: '100%' }}>
      <Text style={{ color: C.text, fontFamily: F.black, fontSize: 18, marginBottom: 12 }}>{loc.lesson.title}</Text>
      {loc.lesson.cards.map((card, i) => (
        <View key={'c' + i} nativeID={`a|${id}|c${i}`} style={{ marginBottom: 28, paddingBottom: 12, borderBottomWidth: 1, borderColor: C.surface2 }}>
          <CardView card={card} width={contentW} color={loc.section.color} />
        </View>
      ))}
      {items.map((ex, i) => (
        <View key={'e' + i} nativeID={`a|${id}|e${i}`} style={{ marginBottom: 28, paddingBottom: 12, borderBottomWidth: 1, borderColor: C.surface2 }}>
          <ExerciseHost ex={ex} locked={false} onReady={() => {}} checkRef={checkRef} width={contentW} />
        </View>
      ))}
      <Text key={id} nativeID={`audit-done|${id}`} style={{ color: C.textDim }}>
        fim
      </Text>
    </ScrollView>
  );
}
