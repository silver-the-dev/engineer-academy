import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { C, F, alpha, shade } from '../../theme';
import { SECTIONS, isLessonUnlocked, sectionProgress } from '../../content';
import { useApp } from '../../state/store';
import { TopBar } from '../../components/ui/TopBar';
import { Button, ProgressBar } from '../../components/ui/Button';
import { tapFeedback } from '../../lib/feedback';
import type { Lesson, Unit } from '../../content/types';

const OFFSETS = [0, 0.55, 0.85, 0.55, 0, -0.55, -0.85, -0.55];

function Node({ state, color, icon, onPress, bounce }: { state: 'locked' | 'open' | 'done' | 'current'; color: string; icon: string; onPress: () => void; bounce?: boolean }) {
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
      {state === 'current' ? (
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
              <Text style={{ fontSize: 30, opacity: state === 'locked' ? 0.5 : 1 }}>{state === 'locked' ? '🔒' : state === 'done' ? '✔️' : icon}</Text>
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
  const updateSettings = useApp((s) => s.updateSettings);
  const section = SECTIONS.find((s) => s.id === settings.section) ?? SECTIONS[0];
  const [picker, setPicker] = useState(false);
  const [popup, setPopup] = useState<null | { lesson?: Lesson; unit: Unit; review?: boolean; locked: boolean }>(null);
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
        onLeftPress={() => setPicker(true)}
        left={
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: alpha(section.color, 0.15), paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 2, borderColor: alpha(section.color, 0.5) }}>
            <Text style={{ fontSize: 18 }}>{section.emoji}</Text>
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
                  <Text style={{ fontSize: 20 }}>📖</Text>
                </Pressable>
              </View>
              <View style={{ alignItems: 'center', paddingTop: 26 }}>
                {unit.lessons.map((l, li) => {
                  const done = !!lessons[l.id];
                  const unlocked = isLessonUnlocked(l.id, lessons, settings.freeMode);
                  const isCurrent = l.id === currentId;
                  const st = done ? 'done' : isCurrent ? 'current' : unlocked ? 'open' : 'locked';
                  const off = OFFSETS[(li + ui * 3) % OFFSETS.length] * amp;
                  return (
                    <View
                      key={l.id}
                      style={{ marginBottom: 22, transform: [{ translateX: off }], alignItems: 'center' }}
                      onLayout={isCurrent ? (e) => (currentY.current = e.nativeEvent.layout.y + 400 + ui * 0) : undefined}
                    >
                      {isCurrent ? (
                        <View style={{ backgroundColor: C.surface, borderWidth: 2, borderColor: section.color, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 10 }}>
                          <Text style={{ color: section.color, fontFamily: F.black, fontSize: 13 }}>COMEÇAR</Text>
                        </View>
                      ) : null}
                      <Node
                        state={st}
                        color={section.color}
                        icon={li === 0 ? '⭐' : ['📘', '🧠', '✏️', '🧩', '⚡', '🎯'][li % 6]}
                        bounce={isCurrent}
                        onPress={() => {
                          tapFeedback();
                          setPopup({ lesson: l, unit, locked: !unlocked });
                        }}
                      />
                      <Text style={{ color: st === 'locked' ? C.textDim : C.textMuted, fontFamily: F.bold, fontSize: 12, marginTop: 6, maxWidth: 150, textAlign: 'center' }} numberOfLines={2}>
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
          <View style={{ backgroundColor: C.surface, borderRadius: 24, padding: 16 }}>
            <Text style={{ color: C.text, fontFamily: F.black, fontSize: 20, marginBottom: 12 }}>Escolha a matéria</Text>
            {SECTIONS.map((s) => {
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
                  <Text style={{ fontSize: 30, marginRight: 12 }}>{s.emoji}</Text>
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
          </View>
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
                  <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 14, marginBottom: 16 }}>
                    {popup.lesson.cards.length} cards de teoria · {popup.lesson.exercises.length} exercícios
                    {lessons[popup.lesson.id] ? ` · melhor: ${Math.round(lessons[popup.lesson.id].best * 100)}%` : ''}
                  </Text>
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
                    title={popup.review ? 'Começar revisão' : lessons[popup.lesson!.id] ? 'Refazer (+XP)' : 'Começar (+XP)'}
                    color={popup.review ? C.gold : section.color}
                    textColor={popup.review ? C.bg : C.white}
                    onPress={() => {
                      const p = popup;
                      setPopup(null);
                      if (p.review) router.push({ pathname: '/lesson/[id]', params: { id: p.unit.id, mode: 'review' } });
                      else router.push({ pathname: '/lesson/[id]', params: { id: p.lesson!.id } });
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
