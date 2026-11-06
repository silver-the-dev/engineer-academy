import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, alpha } from '../../theme';
import { buildPractice, buildQueue, buildUnitReview, findLesson, findUnit, partsDone, QueueItem } from '../../content';
import { useApp, MAX_HEARTS, REFILL_PRICE, type CompleteSummary } from '../../state/store';
import { Button, ProgressBar } from '../../components/ui/Button';
import { CardView } from '../../components/lesson/CardView';
import { ExerciseHost } from '../../components/lesson/ExerciseHost';
import { LessonComplete } from '../../components/lesson/LessonComplete';
import { RichText } from '../../components/math/RichText';
import { CheckResult } from '../../components/exercises/common';
import { ScrollLockProvider } from '../../components/ScrollLock';
import { completeFeedback, correctFeedback, wrongFeedback } from '../../lib/feedback';
import { syncWidget } from '../../lib/widget';
import { rescheduleReminders } from '../../lib/notifications';
import type { Card } from '../../content/types';

const PRAISE = ['Muito bem!', 'Correto!', 'Isso aí!', 'Perfeito!', 'Mandou bem!', 'Exato!', 'Brilhante!', 'Na mosca! 🎯'];

export default function LessonScreen() {
  const { id, mode, part } = useLocalSearchParams<{ id: string; mode?: string; part?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, 700) - 32;

  const app = useApp();
  const heartsOn = app.settings.hearts && mode !== 'practice';

  // Resolve session
  const session = useMemo(() => {
    const seed = Date.now();
    if (mode === 'practice') {
      const st = useApp.getState();
      const completed = [...Object.keys(st.lessons), ...Object.keys(st.parts)];
      return { title: 'Treino inteligente', color: C.cyan, cards: [] as Card[], queue: buildPractice(useApp.getState().mistakes, completed, seed, 10), lessonId: null as string | null, practice: true };
    }
    if (mode === 'review') {
      const u = findUnit(id!);
      return { title: `Revisão · ${u?.unit.title ?? ''}`, color: u?.section.color ?? C.primary, cards: [] as Card[], queue: u ? buildUnitReview(u.unit, seed) : [], lessonId: null, practice: true };
    }
    const loc = findLesson(id!);
    if (!loc) return null;
    const st = useApp.getState();
    const total = loc.lesson.parts.length;
    const doneParts = partsDone(loc.lesson, st.lessons, st.parts);
    const asked = part != null ? Number(part) : NaN;
    const partIdx = Number.isFinite(asked) ? Math.min(Math.max(0, asked), total - 1) : doneParts < total ? doneParts : 0;
    const replay = partIdx < doneParts;
    const p = loc.lesson.parts[partIdx];
    return { title: loc.lesson.title, color: loc.section.color, cards: p.cards, queue: buildQueue(loc.lesson, partIdx, seed), lessonId: loc.lesson.id, practice: false, replay, partIdx, partsTotal: total };
  }, [id, mode, part]);

  const [phase, setPhase] = useState<'cards' | 'ex' | 'done'>(session && session.cards.length ? 'cards' : 'ex');
  const [cardIdx, setCardIdx] = useState(0);
  const [queue, setQueue] = useState<QueueItem[]>(session?.queue ?? []);
  const [pos, setPos] = useState(0);
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState<null | (CheckResult & { explain?: string; praise: string })>(null);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(0);
  const [quitOpen, setQuitOpen] = useState(false);
  const [noHearts, setNoHearts] = useState(false);
  const [summary, setSummary] = useState<CompleteSummary | null>(null);
  const [locked, setLocked] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const stats = useRef({ first: 0, firstCorrect: 0, best: 0, start: Date.now(), seen: new Set<number>() });
  const checkRef = useRef<(() => CheckResult) | null>(null);
  const scrollRef = useRef<any>(null);
  const sheet = useRef(new Animated.Value(0)).current;
  const hearts = useApp((s) => s.currentHearts());

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'done') return false;
      setQuitOpen(true);
      return true;
    });
    return () => sub.remove();
  }, [phase]);

  const onReady = useCallback((r: boolean) => setReady(r), []);

  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.text }}>Lição não encontrada.</Text>
        <Button title="Voltar" onPress={() => router.back()} style={{ margin: 20 }} />
      </View>
    );
  }

  const item = queue[pos];
  const progress = phase === 'cards' ? 0 : queue.length ? pos / queue.length : 1;

  const finish = () => {
    const st = stats.current;
    const s = useApp.getState().completeLesson({
      lessonId: session.lessonId,
      correct: st.firstCorrect,
      total: st.first,
      bestCombo: st.best,
      durationMs: Date.now() - st.start,
      practice: session.practice,
      part: (session as any).partIdx,
      partsTotal: (session as any).partsTotal,
    });
    if (mode === 'practice' && st.firstCorrect >= 6) useApp.getState().gainHeart();
    setSummary(s);
    setPhase('done');
    completeFeedback();
    syncWidget();
    rescheduleReminders();
  };

  const check = () => {
    if (!checkRef.current || !item) return;
    const res = checkRef.current();
    setLocked(true);
    const st = stats.current;
    const firstTime = !item.retry && !st.seen.has(pos);
    st.seen.add(pos);
    if (!item.retry) {
      st.first++;
      if (res.correct) st.firstCorrect++;
    }
    useApp.getState().recordAnswer(item.lessonId, item.idx, res.correct);
    if (res.correct) {
      const c = combo + 1;
      setCombo(c);
      st.best = Math.max(st.best, c);
      correctFeedback(c);
      if (c >= 3 && c % 3 === 0) {
        setShowCombo(c);
        setTimeout(() => setShowCombo(0), 1400);
      }
    } else {
      setCombo(0);
      wrongFeedback();
      if (heartsOn) useApp.getState().loseHeart();
      if (!item.retry && firstTime) setQueue((q) => [...q, { ...item, retry: true }]);
    }
    setShowWhy(false);
    setFeedback({ ...res, explain: item.ex.explain, praise: PRAISE[Math.floor(Math.random() * PRAISE.length)] });
    Animated.spring(sheet, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  const next = () => {
    Animated.timing(sheet, { toValue: 0, duration: 120, useNativeDriver: true }).start();
    const wasWrong = feedback && !feedback.correct;
    setFeedback(null);
    setLocked(false);
    setReady(false);
    checkRef.current = null;
    if (heartsOn && wasWrong && useApp.getState().currentHearts() <= 0) {
      setNoHearts(true);
      return;
    }
    if (pos + 1 >= queue.length) finish();
    else {
      setPos(pos + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  if (phase === 'done' && summary) {
    const pi: number | undefined = (session as any).partIdx;
    const pt: number | undefined = (session as any).partsTotal;
    const hasNext = pi != null && pt != null && pi + 1 < pt && !(session as any).replay;
    return (
      <LessonComplete
        summary={summary}
        durationMs={Date.now() - stats.current.start}
        color={session.color}
        onContinue={() => router.back()}
        onNext={hasNext ? () => router.replace({ pathname: '/lesson/[id]', params: { id: id!, part: String(pi! + 1) } }) : undefined}
        title={mode === 'practice' ? 'Treino concluído! 💪' : undefined}
      />
    );
  }

  const fbColor = feedback?.correct ? C.success : C.danger;
  const sheetY = sheet.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  return (
    <ScrollLockProviderWrapper>
      {(scrollLocked) => (
        <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 }}>
            <Pressable onPress={() => setQuitOpen(true)} hitSlop={12}>
              <Text style={{ color: C.textMuted, fontSize: 26, fontFamily: F.black }}>✕</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <ProgressBar value={phase === 'cards' ? (cardIdx + 1) / Math.max(1, session.cards.length) : progress} color={phase === 'cards' ? session.color : C.success} />
            </View>
            {heartsOn ? (
              <Text style={{ color: C.heart, fontFamily: F.black, fontSize: 18 }}>❤️ {hearts}</Text>
            ) : (
              <Text style={{ color: C.cyan, fontFamily: F.black, fontSize: 16 }}>∞</Text>
            )}
          </View>
          {combo >= 2 && phase === 'ex' ? (
            <Text style={{ color: C.fire, fontFamily: F.black, fontSize: 13, textAlign: 'center', marginTop: -4 }}>🔥 {combo} seguidas</Text>
          ) : null}

          <ScrollView ref={scrollRef} scrollEnabled={!scrollLocked} contentContainerStyle={{ padding: 16, paddingBottom: 260, maxWidth: 732, alignSelf: 'center', width: '100%' }} keyboardShouldPersistTaps="handled">
            {phase === 'cards' ? (
              <>
                <Text style={{ color: C.textMuted, fontFamily: F.black, fontSize: 12, letterSpacing: 1.2, marginBottom: 6 }}>
                  {session.title.toUpperCase()}
                  {(session as any).partsTotal > 1 ? ` · PARTE ${(session as any).partIdx + 1}/${(session as any).partsTotal}` : ''}
                  {session.cards.length > 1 ? ` · TEORIA ${cardIdx + 1}/${session.cards.length}` : ' · TEORIA'}
                </Text>
                <CardView key={cardIdx} card={session.cards[cardIdx]} width={contentW} color={session.color} />
              </>
            ) : item ? (
              <ExerciseHost key={pos} ex={item.ex} locked={locked} onReady={onReady} checkRef={checkRef} width={contentW} retry={item.retry} />
            ) : (
              <Text style={{ color: C.textMuted, fontFamily: F.bold, textAlign: 'center', marginTop: 40 }}>Nenhum exercício disponível ainda. Complete algumas lições primeiro!</Text>
            )}
          </ScrollView>

          {/* Bottom bar */}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: insets.bottom + 16, paddingTop: 12, backgroundColor: C.bg, borderTopWidth: 1, borderColor: C.surface2 }}>
            {phase === 'cards' ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {cardIdx > 0 ? <Button title="◀" onPress={() => setCardIdx(cardIdx - 1)} color={C.surface3} style={{ width: 70 }} /> : null}
                <Button
                  title={cardIdx + 1 < session.cards.length ? 'Continuar' : 'Praticar!'}
                  color={session.color}
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (cardIdx + 1 < session.cards.length) {
                      setCardIdx(cardIdx + 1);
                      scrollRef.current?.scrollTo({ y: 0, animated: false });
                    } else {
                      setPhase('ex');
                      stats.current.start = Date.now();
                      scrollRef.current?.scrollTo({ y: 0, animated: false });
                      if (!queue.length) finish();
                    }
                  }}
                />
              </View>
            ) : item ? (
              <Button title="Verificar" onPress={check} disabled={!ready || locked} color={C.success} />
            ) : (
              <Button title="Voltar" onPress={() => router.back()} />
            )}
            {phase === 'cards' && (session as any).replay ? (
              <Pressable onPress={() => { setPhase('ex'); stats.current.start = Date.now(); }} style={{ alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: C.textMuted, fontFamily: F.black, fontSize: 13 }}>PULAR TEORIA →</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Feedback sheet */}
          {feedback ? (
            <Animated.View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, transform: [{ translateY: sheetY }], backgroundColor: feedback.correct ? C.successBg : C.dangerBg, paddingHorizontal: 18, paddingTop: 18, paddingBottom: insets.bottom + 18, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '62%' }}>
              <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ paddingBottom: 8 }}>
                <Text style={{ color: fbColor, fontFamily: F.black, fontSize: 22 }}>{feedback.correct ? `✅ ${feedback.praise}` : '❌ Não foi dessa vez'}</Text>
                {!feedback.correct && feedback.answer ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: fbColor, fontFamily: F.black, fontSize: 14, marginBottom: 4 }}>Resposta correta:</Text>
                    <RichText size={16} color={C.text}>{feedback.answer}</RichText>
                  </View>
                ) : null}
                {feedback.explain && (!feedback.correct || showWhy) ? (
                  <View style={{ marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: alpha('#000000', 0.25) }}>
                    <RichText size={15} color={C.text}>{feedback.explain}</RichText>
                  </View>
                ) : null}
                {feedback.correct && feedback.explain && !showWhy ? (
                  <Pressable onPress={() => setShowWhy(true)} style={{ marginTop: 6 }}>
                    <Text style={{ color: C.success, fontFamily: F.black, fontSize: 13 }}>VER EXPLICAÇÃO ›</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
              <Button title="Continuar" onPress={next} color={fbColor} style={{ marginTop: 12 }} />
            </Animated.View>
          ) : null}

          {showCombo ? (
            <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 70, alignSelf: 'center', backgroundColor: alpha(C.fire, 0.95), paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30 }}>
              <Text style={{ color: C.bg, fontFamily: F.black, fontSize: 18 }}>🔥 {showCombo} acertos seguidos!</Text>
            </View>
          ) : null}

          {/* Quit modal */}
          <Modal visible={quitOpen} transparent animationType="fade" onRequestClose={() => setQuitOpen(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: C.surface, padding: 22, paddingBottom: insets.bottom + 22, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                <Text style={{ color: C.text, fontSize: 46, textAlign: 'center' }}>🥺</Text>
                <Text style={{ color: C.text, fontFamily: F.black, fontSize: 20, textAlign: 'center', marginVertical: 8 }}>Quer mesmo sair?</Text>
                <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 15, textAlign: 'center', marginBottom: 18 }}>Você vai perder o progresso desta lição.</Text>
                <Button title="Continuar estudando" onPress={() => setQuitOpen(false)} color={C.primary} />
                <Button title="Sair" variant="ghost" color={C.danger} onPress={() => { setQuitOpen(false); router.back(); }} style={{ marginTop: 10 }} />
              </View>
            </View>
          </Modal>

          {/* No hearts modal */}
          <Modal visible={noHearts} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: C.surface, padding: 22, paddingBottom: insets.bottom + 22, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                <Text style={{ color: C.text, fontSize: 50, textAlign: 'center' }}>💔</Text>
                <Text style={{ color: C.text, fontFamily: F.black, fontSize: 21, textAlign: 'center', marginVertical: 8 }}>Suas vidas acabaram</Text>
                <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 15, textAlign: 'center', marginBottom: 18 }}>
                  Elas recarregam com o tempo (1 a cada 20 min). Você pode recarregar com gemas ou ganhar vidas no Treino.
                </Text>
                <Button title={`Recarregar (${REFILL_PRICE} 💎)`} color={C.gem} disabled={useApp.getState().gems < REFILL_PRICE} onPress={() => { if (useApp.getState().refillHearts(true)) { setNoHearts(false); if (pos + 1 >= queue.length) finish(); else setPos(pos + 1); } }} />
                <Button title="Treinar para ganhar vidas" color={C.cyan} style={{ marginTop: 10 }} onPress={() => { setNoHearts(false); router.replace({ pathname: '/lesson/[id]', params: { id: 'practice', mode: 'practice' } }); }} />
                <Button title="Sair" variant="ghost" color={C.textMuted} onPress={() => { setNoHearts(false); router.back(); }} style={{ marginTop: 10 }} />
                <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 12, textAlign: 'center', marginTop: 8 }}>Dica: dá para desativar as vidas no Perfil → Configurações (máx. {MAX_HEARTS}).</Text>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </ScrollLockProviderWrapper>
  );
}

function ScrollLockProviderWrapper({ children }: { children: (locked: boolean) => React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const set = useCallback((l: boolean) => setLocked(l), []);
  return <ScrollLockProvider setLocked={set}>{children(locked)}</ScrollLockProvider>;
}
