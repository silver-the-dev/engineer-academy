import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { AdminAccess } from '../components/review/AdminAccess';
import { ReviewRun, type ReviewSession, type SessionSummary } from '../components/review/ReviewRun';
import { Button, Card } from '../components/ui/Button';
import { latestReviews, reviewBatch, reviewCatalog, reviewReport, type ReviewQuestion, type ReviewRecord } from '../lib/review';
import { loadReviewRecords, saveReviewRecord } from '../lib/reviewStorage';
import { makeRng, shuffle } from '../lib/random';
import { exportReviewFile } from '../lib/reviewExport';
import { useKeyboardInset } from '../lib/useKeyboardInset';
import { createAdminSession } from '../lib/adminAuth';

const APP_VERSION = Constants.expoConfig?.version ?? 'desconhecida';

export default function AdminScreen() {
  const [unlocked, setUnlocked] = useState(false);
  const access = useRef(createAdminSession()).current;
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardInset();
  const leave = () => router.canGoBack() ? router.back() : router.replace('/profile');
  useFocusEffect(useCallback(() => () => { access.invalidate(); setUnlocked(false); }, [access]));

  // Listening from the start covers a sign-in that finishes after the app went to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (access.change(state)) setUnlocked(false);
    });
    return () => sub.remove();
  }, [access]);
  const beginSignIn = () => {
    const attempt = access.begin();
    return () => { if (access.canUnlock(attempt, AppState.currentState)) setUnlocked(true); };
  };

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <View style={styles.top}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao perfil" hitSlop={10} onPress={leave}>
        <Text style={styles.back}>‹</Text>
      </Pressable>
      <Text style={styles.title}>Administração</Text>
      {unlocked ? <Button silent small title="Bloquear" variant="ghost" color={C.textMuted} onPress={() => setUnlocked(false)} /> : null}
    </View>
    <View style={{ flex: 1, paddingBottom: keyboard ? keyboard + insets.bottom : 0 }}>
      {unlocked ? <ReviewDesk /> : <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <AdminAccess onBeginSignIn={beginSignIn} />
      </ScrollView>}
    </View>
  </SafeAreaView>;
}

function ReviewDesk() {
  const [loaded, setLoaded] = useState<{ questions: ReviewQuestion[]; records: ReviewRecord[] }>();
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    loadReviewRecords().then(records => {
      if (active) setLoaded({ questions: reviewCatalog(), records });
    }).catch(() => {
      if (active) setLoadError('Não foi possível abrir o catálogo e o histórico de revisão.');
    });
    return () => { active = false; };
  }, [retry]);

  if (!loaded) return <View style={styles.content}>
    <Text style={styles.body}>{loadError || 'Abrindo catálogo…'}</Text>
    {loadError ? <Button silent title="Tentar novamente" onPress={() => { setLoadError(''); setRetry(n => n + 1); }} /> : null}
  </View>;

  return <LoadedDesk questions={loaded.questions} initial={loaded.records} />;
}

function LoadedDesk({ questions, initial }: { questions: ReviewQuestion[]; initial: ReviewRecord[] }) {
  const [records, setRecords] = useState(initial);
  const [session, setSession] = useState<ReviewSession>();
  const [summary, setSummary] = useState<SessionSummary>();
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const exportingRef = useRef(false);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const searchY = useRef(0);
  const keyboard = useKeyboardInset();
  const latest = useMemo(() => latestReviews(records), [records]);
  const counts = useMemo(() => {
    let pending = 0, approved = 0, issues = 0;
    for (const question of questions) {
      const verdict = latest.get(question.key)?.verdict;
      if (verdict === 'approved') approved++;
      else if (verdict === 'issue') issues++;
      else pending++;
    }
    return { pending, approved, issues };
  }, [questions, latest]);

  function start(items: ReviewQuestion[]) {
    if (!items.length) return;
    setSummary(undefined);
    setSession({ id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8), questions: items });
  }

  async function save(record: ReviewRecord) {
    await saveReviewRecord(record);
    setRecords(previous => [...previous, record]);
  }

  async function exportReport(saveToFolder: boolean) {
    if (exportingRef.current) return;
    exportingRef.current = true;
    setExporting(true);
    setExportMessage('');
    try {
      const date = new Date().toISOString();
      const report = reviewReport(questions, records, APP_VERSION, date);
      const name = 'engineer-academy-revisao-' + date.slice(0, 19).replace(/:/g, '-') + '.json';
      await exportReviewFile(name, JSON.stringify(report, null, 2) + '\n', saveToFolder);
      if (saveToFolder) setExportMessage('Relatório salvo na pasta escolhida.');
    } catch (err) {
      if (!(err instanceof Error && /cancel|dismiss/i.test(err.message))) setExportMessage('Não foi possível exportar o relatório. Tente novamente.');
    } finally {
      exportingRef.current = false;
      setExporting(false);
    }
  }

  if (session) return <ReviewRun key={session.id} session={session} appVersion={APP_VERSION} onSave={save}
    onFinish={result => { setSession(undefined); setSummary(result); }}
    onLeave={() => setSession(undefined)} />;

  // The search results sit below the field, so the card goes to the top while the keyboard is open.
  const showSearch = () => setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, searchY.current - 8), animated: true }), 250);

  return <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, keyboard ? { paddingBottom: 360 } : null]}>
    {summary ? <Card style={{ gap: 8 }} color={C.successDark}>
      <Text style={styles.heading}>Rodada concluída</Text>
      <Text style={styles.body}>{summary.approved} {summary.approved === 1 ? 'aprovada' : 'aprovadas'} · {summary.issues} com problema</Text>
      <Button silent small title="Voltar ao painel" variant="ghost" onPress={() => setSummary(undefined)} />
    </Card> : null}
    <Card style={{ gap: 14 }}>
      <Text style={styles.heading}>Revisão de questões</Text>
      <View style={styles.stats}>
        <Stat label="Pendentes" value={counts.pending} color={C.cyan} />
        <Stat label="Aprovadas" value={counts.approved} color={C.success} />
        <Stat label="Com problema" value={counts.issues} color={C.gold} />
      </View>
      <Button silent title="Iniciar revisão aleatória" color={C.primary} disabled={!counts.pending}
        onPress={() => start(reviewBatch(questions, latest, Math.floor(Math.random() * 2 ** 31)))} />
      <Text style={styles.body}>{counts.pending ? 'Até 10 questões pendentes por rodada, entre todas as seções.' : 'Todas as questões desta versão têm um parecer.'}</Text>
      {counts.issues ? <Button silent small variant="outline" title="Rever questões com problema"
        onPress={() => start(shuffle(makeRng(Math.floor(Math.random() * 2 ** 31)), questions.filter(question => latest.get(question.key)?.verdict === 'issue')).slice(0, 10))} /> : null}
    </Card>
    <Card style={{ gap: 10 }}>
      <Text style={styles.heading}>Relatório</Text>
      <Text style={styles.body}>{records.length} {records.length === 1 ? 'parecer salvo' : 'pareceres salvos'}. O JSON inclui o histórico das versões revisadas.</Text>
      <Button silent small title={Platform.OS === 'web' ? 'Baixar JSON' : 'Compartilhar JSON'} color={C.surface3}
        disabled={!records.length || exporting} onPress={() => exportReport(false)} />
      {Platform.OS !== 'web' ? <Button silent small title="Salvar JSON em uma pasta" variant="outline"
        disabled={!records.length || exporting} onPress={() => exportReport(true)} /> : null}
      {exportMessage ? <Text style={styles.body} accessibilityLiveRegion="polite">{exportMessage}</Text> : null}
    </Card>
    <View onLayout={event => { searchY.current = event.nativeEvent.layout.y; }}>
      <QuestionSearch questions={questions} latest={latest} onOpen={question => start([question])} onFocus={showSearch} />
    </View>
  </ScrollView>;
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return <View style={styles.stat}>
    <Text style={[styles.statValue, { color }]}>{value.toLocaleString('pt-BR')}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>;
}

const normalized = (text: string) => text.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function QuestionSearch({ questions, latest, onOpen, onFocus }: {
  questions: ReviewQuestion[];
  latest: ReadonlyMap<string, ReviewRecord>;
  onOpen: (question: ReviewQuestion) => void;
  onFocus: () => void;
}) {
  const [query, setQuery] = useState('');
  const [lesson, setLesson] = useState<string>();
  const lessons = useMemo(() => {
    const result = new Map<string, ReviewQuestion[]>();
    for (const question of questions) {
      const list = result.get(question.lessonId);
      if (list) list.push(question);
      else result.set(question.lessonId, [question]);
    }
    return result;
  }, [questions]);
  const q = normalized(query);
  const reference = /^(.*)#(\d+)$/.exec(q);
  const exact = reference && lessons.get(reference[1])?.find(question => question.index === Number(reference[2]));
  const matches = q && !reference ? [...lessons.values()].filter(([first]) =>
    normalized(first.lessonId + ' ' + first.lessonTitle + ' ' + first.sectionTitle).includes(q)) : [];
  const selected = lesson ? lessons.get(lesson) : undefined;
  const renderQuestion = (question: ReviewQuestion) => {
    const verdict = latest.get(question.key)?.verdict;
    const label = verdict === 'approved' ? 'Aprovada' : verdict === 'issue' ? 'Com problema' : 'Pendente';
    return <Pressable accessibilityRole="button" key={question.key} onPress={() => onOpen(question)} style={styles.searchRow}>
      <Text style={styles.rowTitle}>Parte {question.part} · Questão {question.numberInPart}</Text>
      <Text style={styles.body}>{label} · {question.lessonId}#{question.index}</Text>
    </Pressable>;
  };
  return <Card style={{ gap: 10 }}>
    <Text style={styles.heading}>Buscar questão</Text>
    <TextInput accessibilityLabel="Buscar questão" value={query} onChangeText={text => { setQuery(text); setLesson(undefined); }}
      placeholder="Nome da lição ou ID, ex. f-arit-racio#6" placeholderTextColor={C.textDim} autoCorrect={false}
      autoCapitalize="none" onFocus={onFocus} style={styles.search} />
    {exact ? renderQuestion(exact) : null}
    {selected ? <>
      <Text style={styles.rowTitle}>{selected[0].lessonTitle}</Text>
      {selected.map(renderQuestion)}
    </> : matches.slice(0, 8).map(([first]) =>
      <Pressable accessibilityRole="button" key={first.lessonId} onPress={() => setLesson(first.lessonId)} style={styles.searchRow}>
        <Text style={styles.rowTitle}>{first.lessonTitle}</Text>
        <Text style={styles.body}>{first.sectionTitle} · {first.lessonId}</Text>
      </Pressable>)}
    {q && !exact && !matches.length ? <Text style={styles.body}>Nenhuma questão encontrada.</Text> : null}
    {!selected && matches.length > 8 ? <Text style={styles.body}>Refine a busca para ver as outras lições.</Text> : null}
  </Card>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: C.surface2 },
  back: { fontFamily: F.black, fontSize: 32, color: C.textMuted, paddingHorizontal: 5 },
  title: { flex: 1, color: C.text, fontFamily: F.black, fontSize: 21 },
  heading: { color: C.text, fontFamily: F.black, fontSize: 21 },
  content: { width: '100%', maxWidth: 700, alignSelf: 'center', padding: 16, paddingBottom: 36, gap: 16 },
  body: { color: C.textMuted, fontFamily: F.semibold, fontSize: 14, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 7, borderRadius: 12, backgroundColor: C.bgDeep },
  statValue: { fontFamily: F.black, fontSize: 21, textAlign: 'center' },
  statLabel: { fontFamily: F.bold, fontSize: 12, color: C.textMuted, textAlign: 'center' },
  search: { minHeight: 46, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 10, color: C.text, fontFamily: F.semibold },
  searchRow: { borderTopWidth: 1, borderColor: C.border, paddingVertical: 8, minHeight: 44 },
  rowTitle: { fontFamily: F.heavy, color: C.text, fontSize: 15 },
});
