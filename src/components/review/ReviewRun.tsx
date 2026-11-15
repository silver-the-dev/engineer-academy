import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../../theme';
import { exerciseSnapshot, materializeReview, reviewAnswer, type ReviewEvaluation, type ReviewQuestion, type ReviewRecord, type ReviewVerdict } from '../../lib/review';
import { useKeyboardInset } from '../../lib/useKeyboardInset';
import { ScrollLockProvider, useScrollLockState } from '../ScrollLock';
import type { CheckResult } from '../exercises/common';
import { ExerciseHost } from '../lesson/ExerciseHost';
import { RichText } from '../math/RichText';
import { Button, ProgressBar } from '../ui/Button';
import { CodeBlock } from '../visuals/Code';

export type ReviewSession = { id: string; questions: ReviewQuestion[] };
export type SessionSummary = { approved: number; issues: number };

export function ReviewRun({ session, appVersion, onSave, onFinish, onLeave }: {
  session: ReviewSession;
  appVersion: string;
  onSave: (record: ReviewRecord) => Promise<void>;
  onFinish: (summary: SessionSummary) => void;
  onLeave: () => void;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width, 700) - 32;
  const [locked, setLocked] = useScrollLockState();
  const [index, setIndex] = useState(0);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState<ReviewEvaluation | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const summary = useRef<SessionSummary>({ approved: 0, issues: 0 });
  const checkRef = useRef<(() => CheckResult) | null>(null);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const sheetRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const keyboard = useKeyboardInset();
  const question = session.questions[index];
  const materialized = useMemo(() => {
    try { return { exercise: materializeReview(question, seed) }; }
    catch (err) { return { error: err instanceof Error ? err.message : String(err) }; }
  }, [question, seed]);
  const { exercise } = materialized;
  const answer = exercise && reviewAnswer(exercise);
  const onReady = useCallback((value: boolean) => setReady(value), []);
  const tone = feedback?.accepted == null ? C.gold : feedback.accepted ? C.success : C.danger;

  function check() {
    if (!ready || !checkRef.current) return;
    try {
      const result = checkRef.current();
      setFeedback({ accepted: result.evaluationError ? null : result.correct, submission: result.submission, error: result.evaluationError });
    } catch (err) {
      setFeedback({ accepted: null, error: err instanceof Error ? err.message : String(err) });
    }
  }

  function retry() {
    if (inFlight.current) return;
    setFeedback(null);
    setReady(false);
    setError('');
    checkRef.current = null;
    setAttempt(n => n + 1);
  }

  async function save(verdict: ReviewVerdict) {
    if (!feedback || inFlight.current) return;
    if (verdict === 'issue' && !note.trim()) {
      setError('Descreva o problema para que possa ser reproduzido.');
      setTimeout(() => sheetRef.current?.scrollToEnd({ animated: true }), 50);
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setError('');
    try {
      await onSave({
        question, seed, appVersion, sessionId: session.id, reviewedAt: new Date().toISOString(), verdict, note: note.trim(),
        exercise: exercise ? exerciseSnapshot(exercise) : { kind: 'unavailable' },
        evaluation: feedback,
      });
      if (verdict === 'approved') summary.current.approved++;
      else summary.current.issues++;
      if (index + 1 >= session.questions.length) onFinish({ ...summary.current });
      else {
        retryAfterSave();
        setIndex(n => n + 1);
        setSeed(Math.floor(Math.random() * 2 ** 31));
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    } catch {
      setError('Não foi possível salvar o parecer. Tente novamente.');
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  function retryAfterSave() {
    setFeedback(null);
    setNote('');
    setReady(false);
    checkRef.current = null;
  }

  // The system back button closes the pop-up first and then the round, instead of leaving the admin area.
  const back = useRef(() => {});
  back.current = feedback ? retry : onLeave;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { back.current(); return true; });
    return () => sub.remove();
  }, []);

  // The note is the last item of the pop-up: keep it in view once the keyboard has taken its space.
  useEffect(() => {
    if (keyboard && feedback) sheetRef.current?.scrollToEnd({ animated: true });
  }, [keyboard, feedback]);

  return <ScrollLockProvider setLocked={setLocked}>
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Pressable onPress={onLeave} accessibilityRole="button" accessibilityLabel="Sair da rodada" hitSlop={10}>
          <Text style={{ color: C.textMuted, fontFamily: F.black, fontSize: 24 }}>✕</Text>
        </Pressable>
        <View style={{ flex: 1 }}><ProgressBar value={index / session.questions.length} color={C.cyan} height={10} /></View>
        <Text style={styles.meta}>{index + 1}/{session.questions.length}</Text>
      </View>
      <ScrollView ref={scrollRef} scrollEnabled={!locked} keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, { paddingBottom: 130 }]}>
        <Text style={styles.meta}>{question.sectionTitle} · {question.lessonTitle}</Text>
        <Text style={styles.locator}>Parte {question.part} · Questão {question.numberInPart} · {question.lessonId}#{question.index}</Text>
        {exercise ? <ExerciseHost key={question.key + ':' + attempt} ex={exercise} locked={feedback !== null}
          onReady={onReady} checkRef={checkRef} width={contentWidth} captureAttempt /> : <Text style={styles.error}>Não foi possível abrir a questão.</Text>}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Button silent title="Verificar resposta" onPress={check} disabled={!ready || !!feedback} color={C.success} />
        <Button silent small variant="ghost" title="Reportar sem responder"
          onPress={() => setFeedback({ accepted: null, error: materialized.error })} />
      </View>
      {feedback ? <View style={styles.backdrop} accessibilityViewIsModal>
          <View style={[styles.sheet, { paddingBottom: (keyboard ? 0 : insets.bottom) + 12 }]}>
            <ScrollView ref={sheetRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 10 }}>
              <Text style={[styles.heading, { color: tone }]}>{feedback.accepted == null ? 'Sem resposta validada' : feedback.accepted ? 'O gabarito aceitou a resposta' : 'O gabarito marcou a resposta como incorreta'}</Text>
              {feedback.error ? <Text style={styles.error}>{feedback.error}</Text> : null}
              {answer?.text ? <View style={{ gap: 4 }}>
                <Text style={styles.label}>Gabarito</Text>
                <RichText size={16}>{answer.text}</RichText>
              </View> : null}
              {answer?.code ? <CodeBlock title="Solução de referência" code={answer.code} width={Math.min(width, 700) - 36} /> : null}
              {exercise?.explain ? <View style={{ gap: 4 }}>
                <Text style={styles.label}>Explicação da questão</Text>
                <RichText size={15}>{exercise.explain}</RichText>
              </View> : null}
              <Text style={styles.label}>Parecer do administrador</Text>
              <TextInput multiline value={note} onChangeText={value => { setNote(value); setError(''); }} editable={!saving}
                onFocus={() => setTimeout(() => sheetRef.current?.scrollToEnd({ animated: true }), 250)}
                accessibilityLabel="Parecer do administrador" placeholder="Descreva o que conferiu ou como reproduzir o problema"
                placeholderTextColor={C.textDim} maxLength={4000} style={styles.note} />
              {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
            </ScrollView>
            <View style={{ gap: 6, marginTop: 10 }}>
              {feedback.accepted !== null ? <Button silent small title="Aprovar questão" disabled={saving} color={C.success} onPress={() => save('approved')} /> : null}
              <Button silent small title={saving ? 'Salvando…' : 'Registrar problema'} color={C.danger} disabled={saving} onPress={() => save('issue')} />
              {keyboard ? null : <Button silent small variant="ghost" title="Voltar à questão" disabled={saving} onPress={retry} />}
            </View>
          </View>
      </View> : null}
    </View>
  </ScrollLockProvider>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 8 },
  meta: { color: C.textMuted, fontFamily: F.heavy, fontSize: 14 },
  locator: { color: C.textDim, fontFamily: F.bold, fontSize: 12, marginBottom: 16, marginTop: 4 },
  body: { padding: 16, width: '100%', maxWidth: 700, alignSelf: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  backdrop: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: { width: '100%', maxWidth: 700, maxHeight: '92%', alignSelf: 'center', backgroundColor: C.surface, padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  heading: { fontFamily: F.black, fontSize: 21 },
  label: { color: C.textMuted, fontFamily: F.heavy, fontSize: 14 },
  note: { color: C.text, fontFamily: F.semibold, fontSize: 16, minHeight: 84, padding: 10, textAlignVertical: 'top', backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12 },
  error: { color: C.danger, fontFamily: F.bold, fontSize: 14 },
});
