import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { C, F, alpha, shade } from '../../theme';
import { SECTIONS, isLessonUnlocked, partsDone, sectionProgress } from '../../content';
import { availableCourses, courseOf, sectionsOf } from '../../content/courses';
import { useApp } from '../../state/store';
import { TopBar } from '../../components/ui/TopBar';
import { Button, ProgressBar } from '../../components/ui/Button';
import { tapFeedback } from '../../lib/feedback';
import type { Lesson, Unit } from '../../content/types';

const OFFSETS = [0, 0.55, 0.85, 0.55, 0, -0.55, -0.85, -0.55];

const RING = 112;

const courses = availableCourses();

/** Ring split in one arc per sub-lesson (gap at the top), finished arcs in the section colour. */
function PartRing({ total, done, color }: { total: number; done: number; color: string }) {
  const c = RING / 2;
  const r = c - 6;
  const sw = 9;
  if (total <= 1) {
    return (
      <Svg width={RING} height={RING}>
        <Circle cx={c} cy={c} r={r} stroke={done >= 1 ? color : C.surface3} strokeWidth={sw} fill="none" />
      </Svg>
    );
  }
  const gap = Math.min(26, 120 / total); // degrees, includes the round caps
  const span = 360 / total;
  const pt = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(c + r * Math.sin(a)).toFixed(2)} ${(c - r * Math.cos(a)).toFixed(2)}`;
  };
  return (
    <Svg width={RING} height={RING}>
      {Array.from({ length: total }, (_, i) => {
        const a0 = i * span + gap / 2;
        const a1 = (i + 1) * span - gap / 2;
        const d = `M ${pt(a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(a1)}`;
        return <Path key={i} d={d} stroke={i < done ? color : C.surface3} strokeWidth={sw} strokeLinecap="round" fill="none" />;
      })}
    </Svg>
  );
}

function Node({ state, color, icon, onPress, bounce, ring }: { state: 'locked' | 'open' | 'done' | 'current'; color: string; icon: string; onPress: () => void; bounce?: boolean; ring?: { total: number; done: number } }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!bounce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce, a]);
  const bg = state === 'locked' ? C.surface3 : state === 'done' ? C.gold : color;
  const edge = shade(bg, -0.35);
  return (
    <Animated.View style={{ transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }}>
      {ring ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 38 - RING / 2, top: 35 - RING / 2 }}>
          <PartRing total={ring.total} done={ring.done} color={color} />
        </View>
      ) : state === 'current' ? (
        <View style={{ position: 'absolute', top: -14, left: -14, right: -14, bottom: -14, borderRadius: 60, borderWidth: 6, borderColor: alpha(color, 0.35) }} />
      ) : null}
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View style={{ width: 76, height: 70, borderRadius: 38, backgroundColor: edge, alignItems: 'center' }}>
            <View
              style={{
                width: 76,
                height: 64,
                borderRadius: 38,
                backgroundColor: bg,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ translateY: pressed ? 5 : 0 }],
              }}
            >
              <Text style={{ color: C.text, fontSize: 30, opacity: state === 'locked' ? 0.5 : 1 }}>{state === 'locked' ? '🔒' : state === 'done' ? '✔️' : icon}</Text>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function PathScreen() {
  const { width } = useWindowDimensions();
  const settings = useApp((s) => s.settings);
  const lessons = useApp((s) => s.lessons);
  const parts = useApp((s) => s.parts);
  const updateSettings = useApp((s) => s.updateSettings);
  const section = SECTIONS.find((s) => s.id === settings.section) ?? SECTIONS[0];
  const [picker, setPicker] = useState(false);
  const [courseTab, setCourseTab] = useState(courseOf(section));
  const [popup, setPopup] = useState<null | { lesson?: Lesson; unit: Unit; review?: boolean; locked: boolean }>(null);
  const [pick, setPick] = useState(0);
  const scrollRef = useRef<any>(null);
  const currentY = useRef<number | null>(null);
  const prog = sectionProgress(section, lessons);

  // first unlocked & not done lesson
  const currentId = useMemo(() => {
    for (const u of section.units) for (const l of u.lessons) if (!lessons[l.id] && isLessonUnlocked(l.id, lessons, settings.freeMode)) return l.id;
    return null;
  }, [section, lessons, settings.freeMode]);

  useEffect(() => {
    currentY.current = null;
    const t = setTimeout(() => {
      if (currentY.current !== null) scrollRef.current?.scrollTo({ y: Math.max(0, currentY.current - 220), animated: true });
    }, 350);
    return () => clearTimeout(t);
  }, [section.id]);

  const amp = Math.min(width * 0.28, 120);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar
        onLeftPress={() => {
          setCourseTab(courseOf(section));
          setPicker(true);
        }}
        left={
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: alpha(section.color, 0.15), paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 2, borderColor: alpha(section.color, 0.5) }}>
            <Text style={{ fontSize: 18, color: section.color, fontFamily: F.black }}>{section.emoji}</Text>
            <Text style={{ color: section.color, fontFamily: F.black, fontSize: 14, marginLeft: 6 }} numberOfLines={1}>
              {section.title.length > 14 ? section.title.slice(0, 13) + '…' : section.title} ▾
            </Text>
          </View>
        }
      />
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ margin: 16, padding: 16, borderRadius: 20, backgroundColor: section.color }}>
          <Text style={{ color: C.bg, fontFamily: F.black, fontSize: 12, letterSpacing: 1.2, opacity: 0.75 }}>SEÇÃO · {prog.done}/{prog.total} LIÇÕES</Text>
          <Text style={{ color: C.bg, fontFamily: F.black, fontSize: 24 }}>
            {section.emoji} {section.title}
          </Text>
          <Text style={{ color: C.bg, fontFamily: F.bold, fontSize: 14, opacity: 0.85, marginBottom: 10 }}>{section.subtitle}</Text>
          <ProgressBar value={prog.total ? prog.done / prog.total : 0} color={C.bg} track={shade(section.color, -0.25)} height={12} />
        </View>

        {section.units.map((unit, ui) => {
          const unitDone = unit.lessons.every((l) => lessons[l.id]);
          const reviewUnlocked = unitDone || settings.freeMode;
          return (
            <View key={unit.id} style={{ marginBottom: 20 }}>
              <View style={{ marginHorizontal: 16, padding: 14, borderRadius: 18, backgroundColor: C.surface, borderWidth: 2, borderColor: alpha(section.color, 0.5), flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: section.color, fontFamily: F.black, fontSize: 12, letterSpacing: 1.1 }}>
                    UNIDADE {ui + 1}
                    {unit.extra ? ' · ✨ EXTRA' : ''}
                  </Text>
                  <Text style={{ color: C.text, fontFamily: F.black, fontSize: 19 }}>
                    {unit.icon} {unit.title}
                  </Text>
                  <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 13 }}>{unit.subtitle}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    tapFeedback();
                    router.push({ pathname: '/unit/[id]', params: { id: unit.id } });
                  }}
                  style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: alpha(section.color, 0.18), borderWidth: 2, borderColor: alpha(section.color, 0.6) }}
                >
                  <Text style={{ fontSize: 20, color: C.text }}>📖</Text>
                </Pressable>
              </View>
              <View style={{ alignItems: 'center', paddingTop: 26 }}>
                {unit.lessons.map((l, li) => {
                  const done = !!lessons[l.id];
                  const unlocked = isLessonUnlocked(l.id, lessons, settings.freeMode);
                  const isCurrent = l.id === currentId;
                  const st = done ? 'done' : isCurrent ? 'current' : unlocked ? 'open' : 'locked';
                  const pd = partsDone(l, lessons, parts);
                  const ring = !done && unlocked && (isCurrent || pd > 0) ? { total: l.parts.length, done: pd } : undefined;
                  const off = OFFSETS[(li + ui * 3) % OFFSETS.length] * amp;
                  return (
                    <View
                      key={l.id}
                      style={{ marginBottom: ring ? 34 : 22, marginTop: ring && !isCurrent ? 12 : 0, transform: [{ translateX: off }], alignItems: 'center' }}
                      onLayout={isCurrent ? (e) => (currentY.current = e.nativeEvent.layout.y + 400 + ui * 0) : undefined}
                    >
                      {isCurrent ? (
                        <View style={{ backgroundColor: C.surface, borderWidth: 2, borderColor: section.color, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 26 }}>
                          <Text style={{ color: section.color, fontFamily: F.black, fontSize: 13 }}>{pd > 0 ? `PARTE ${pd + 1}/${l.parts.length}` : 'COMEÇAR'}</Text>
                        </View>
                      ) : null}
                      <Node
                        state={st}
                        color={section.color}
                        icon={li === 0 ? '⭐' : ['📘', '🧠', '✏️', '🧩', '⚡', '🎯'][li % 6]}
                        bounce={isCurrent}
                        ring={ring}
                        onPress={() => {
                          tapFeedback();
                          setPick(pd < l.parts.length ? pd : 0);
                          setPopup({ lesson: l, unit, locked: !unlocked });
                        }}
                      />
                      <Text style={{ color: st === 'locked' ? C.textDim : C.textMuted, fontFamily: F.bold, fontSize: 12, marginTop: ring ? 18 : 6, maxWidth: 150, textAlign: 'center' }} numberOfLines={2}>
                        {l.title}
                      </Text>
                    </View>
                  );
                })}
                <View style={{ alignItems: 'center', marginTop: 4 }}>
                  <Node state={reviewUnlocked ? 'open' : 'locked'} color={C.gold} icon="🏆" onPress={() => setPopup({ unit, review: true, locked: !reviewUnlocked })} />
                  <Text style={{ color: C.textMuted, fontFamily: F.bold, fontSize: 12, marginTop: 6 }}>Revisão da unidade</Text>
                </View>
              </View>
            </View>
          );
        })}
        <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 13, textAlign: 'center', marginTop: 10, marginHorizontal: 30 }}>
          Toque no seletor de seção (canto superior esquerdo) para estudar outra matéria.
        </Text>
      </ScrollView>

      {/* Section picker */}
      <Modal visible={picker} transparent animationType="fade" onRequestClose={() => setPicker(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 }} onPress={() => setPicker(false)}>
          <Pressable style={{ backgroundColor: C.surface, borderRadius: 24, padding: 16, maxHeight: '88%' }}>
            {courses.length > 1 ? (
              <View style={{ flexDirection: 'row', marginBottom: 14, backgroundColor: C.surface2, borderRadius: 16, padding: 4 }}>
                {courses.map((c) => {
                  const active = c.id === courseTab;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        tapFeedback();
                        setCourseTab(c.id);
                      }}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: active ? alpha(c.color, 0.18) : 'transparent', borderWidth: 2, borderColor: active ? c.color : 'transparent' }}
                    >
                      <Text style={{ fontSize: 18, marginRight: 6 }}>{c.emoji}</Text>
                      <Text style={{ color: active ? c.color : C.textMuted, fontFamily: F.black, fontSize: 14 }} numberOfLines={1}>
                        {c.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <Text style={{ color: C.text, fontFamily: F.black, fontSize: 20, marginBottom: 12 }}>{courses.find((c) => c.id === courseTab)?.title ?? 'Escolha a matéria'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
            {sectionsOf(courseTab).map((s) => {
              const p = sectionProgress(s, lessons);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    tapFeedback();
                    updateSettings({ section: s.id });
                    setPicker(false);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 8, borderWidth: 2, borderColor: s.id === section.id ? s.color : C.border, backgroundColor: s.id === section.id ? alpha(s.color, 0.12) : C.surface2 }}
                >
                  <Text style={{ fontSize: 30, marginRight: 12, width: 44, textAlign: 'center', color: s.color, fontFamily: F.black }}>{s.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: s.color, fontFamily: F.black, fontSize: 16 }}>{s.title}</Text>
                    <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 12, marginBottom: 6 }}>
                      {s.units.length} unidades · {p.done}/{p.total} lições
                    </Text>
                    <ProgressBar value={p.total ? p.done / p.total : 0} color={s.color} height={8} />
                  </View>
                </Pressable>
              );
            })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Lesson popup */}
      <Modal visible={!!popup} transparent animationType="fade" onRequestClose={() => setPopup(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} onPress={() => setPopup(null)}>
          <Pressable style={{ backgroundColor: C.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 40 }}>
            {popup ? (
              <>
                <Text style={{ color: section.color, fontFamily: F.black, fontSize: 12, letterSpacing: 1.2 }}>{popup.unit.title.toUpperCase()}</Text>
                <Text style={{ color: C.text, fontFamily: F.black, fontSize: 22, marginVertical: 6 }}>{popup.review ? '🏆 Revisão da unidade' : popup.lesson?.title}</Text>
                {popup.lesson ? (
                  <LessonParts lesson={popup.lesson} done={partsDone(popup.lesson, lessons, parts)} pick={pick} setPick={setPick} color={section.color} free={settings.freeMode} best={lessons[popup.lesson.id]?.best} />
                ) : (
                  <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 14, marginBottom: 16 }}>12 exercícios misturados de toda a unidade. Ótimo antes de prova!</Text>
                )}
                {popup.locked ? (
                  <>
                    <Text style={{ color: C.textDim, fontFamily: F.bold, marginBottom: 12 }}>🔒 Complete as lições anteriores para desbloquear (ou ative o “Modo livre” no Perfil).</Text>
                    <Button title="Ok" color={C.surface3} onPress={() => setPopup(null)} />
                  </>
                ) : (
                  <Button
                    title={
                      popup.review
                        ? 'Começar revisão'
                        : (() => {
                            const l = popup.lesson!;
                            const d = partsDone(l, lessons, parts);
                            const many = l.parts.length > 1;
                            if (pick < d) return many ? `Refazer parte ${pick + 1} (+XP)` : 'Refazer (+XP)';
                            return many ? (d > 0 ? `Continuar: parte ${pick + 1} (+XP)` : `Começar parte ${pick + 1} (+XP)`) : 'Começar (+XP)';
                          })()
                    }
                    color={popup.review ? C.gold : section.color}
                    textColor={popup.review ? C.bg : C.white}
                    onPress={() => {
                      const p = popup;
                      setPopup(null);
                      if (p.review) router.push({ pathname: '/lesson/[id]', params: { id: p.unit.id, mode: 'review' } });
                      else router.push({ pathname: '/lesson/[id]', params: { id: p.lesson!.id, part: String(pick) } });
                    }}
                  />
                )}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Sub-lesson list inside the lesson popup; finished parts can be picked again to replay. */
function LessonParts({ lesson, done, pick, setPick, color, free, best }: { lesson: Lesson; done: number; pick: number; setPick: (i: number) => void; color: string; free: boolean; best?: number }) {
  const n = lesson.parts.length;
  const exTotal = lesson.exercises.length;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 14, marginBottom: n > 1 ? 10 : 0 }}>
        {n > 1 ? `${n} partes · ${exTotal} exercícios` : `${lesson.cards.length} ${lesson.cards.length === 1 ? 'card' : 'cards'} de teoria · ${exTotal} ${exTotal === 1 ? 'exercício' : 'exercícios'}`}
        {best != null ? ` · melhor: ${Math.round(best * 100)}%` : ''}
      </Text>
      {n > 1
        ? lesson.parts.map((p, i) => {
            const finished = i < done;
            const available = finished || i === done || free;
            const selected = i === pick;
            return (
              <Pressable
                key={i}
                disabled={!available}
                onPress={() => {
                  tapFeedback();
                  setPick(i);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 10, borderRadius: 14, marginBottom: 6, borderWidth: 2, borderColor: selected ? color : C.border, backgroundColor: selected ? alpha(color, 0.12) : C.surface2, opacity: available ? 1 : 0.55 }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: finished ? color : C.surface3, marginRight: 10 }}>
                  <Text style={{ color: finished ? C.bg : C.text, fontFamily: F.black, fontSize: 13 }}>{finished ? '✓' : available ? i + 1 : '🔒'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontFamily: F.black, fontSize: 15 }} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 12 }}>
                    Parte {i + 1} · {p.count} {p.count === 1 ? 'exercício' : 'exercícios'}
                  </Text>
                </View>
              </Pressable>
            );
          })
        : null}
    </View>
  );
}
