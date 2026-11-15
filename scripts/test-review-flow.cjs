const assert = require('node:assert/strict');
const ROOT = require('./support/load-content.cjs');
const path = require('node:path');
const { allLessons } = require(path.join(ROOT, 'src/content'));
const {
  revisionKeys, reviewCatalog, latestReviews, reviewBatch, materializeReview, exerciseSnapshot, reviewAnswer, reviewReport,
} = require(path.join(ROOT, 'src/lib/review'));

const catalog = reviewCatalog();
assert.equal(catalog.length, allLessons().reduce((sum, item) => sum + item.lesson.exercises.length, 0));
assert.equal(new Set(catalog.map(question => question.key)).size, catalog.length);
const originalKeys = revisionKeys('lesson', ['question-a', 'question-b', 'question-c']);
const updatedKeys = revisionKeys('lesson', ['question-added', 'question-c', 'question-a', 'question-b-modified']);
assert.deepEqual(updatedKeys.slice(1, 3), [originalKeys[2], originalKeys[0]]);
assert.equal(new Set(revisionKeys('lesson', ['same', 'same'])).size, 2);

const samples = originalKeys.map((key, index) => ({ ...catalog[0], key, index }));
const updated = updatedKeys.map((key, index) => ({ ...catalog[0], key, index }));
const timestamp = '2026-11-11T22:00:00.000Z';
const seed = 113;
const makeRecord = (question, verdict, note) => ({
  question, seed, appVersion: '1.4.6', sessionId: 'test-round', reviewedAt: timestamp, verdict, note,
  exercise: exerciseSnapshot(materializeReview(question, seed)), evaluation: { accepted: verdict === 'approved', submission: 'tentativa' },
});
const history = [makeRecord(samples[0], 'issue', 'Primeiro parecer.'), makeRecord(samples[0], 'approved', 'Verificado novamente.'), makeRecord(samples[1], 'issue', 'Reproduzível na versão anterior.')];
const latest = latestReviews(history);
assert.equal(latest.get(samples[0].key).verdict, 'approved');
const batch = reviewBatch(updated, latest, seed, 10);
assert.equal(batch.length, 3);
assert(!batch.some(question => question.key === samples[0].key));
assert.deepEqual(batch, reviewBatch(updated, latest, seed, 10));
assert.deepEqual(new Set(batch.map(question => question.key)), new Set([updatedKeys[0], updatedKeys[1], updatedKeys[3]]));

// Interrupted round: saving only the first question of a batch must persist it and exclude it from the next draw.
const interruptedHistory = [...history, makeRecord(batch[0], 'issue', 'Salvo antes de interromper a rodada.')];
const nextBatch = reviewBatch(updated, latestReviews(interruptedHistory), seed, 10);
assert.equal(nextBatch.length, 2);
assert(!nextBatch.some(question => question.key === batch[0].key));

// Empty history export and removed question handling.
const emptyReport = JSON.parse(JSON.stringify(reviewReport(updated, [], '1.4.7', timestamp)));
assert.deepEqual(emptyReport.summary, { totalQuestions: 4, pending: 4, approved: 0, issues: 0 });
assert.deepEqual(emptyReport.reviews, []);
assert.throws(() => materializeReview({ ...samples[0], index: 9999 }, seed), /Questão indisponível/);

const report = JSON.parse(JSON.stringify(reviewReport(updated, history, '1.4.7', timestamp)));
assert.deepEqual(report.summary, { totalQuestions: 4, pending: 3, approved: 1, issues: 0 });
assert.deepEqual(report.reviews.map(({ currentRevision, latestForRevision }) => [currentRevision, latestForRevision]), [[true, false], [true, true], [false, true]]);
assert.equal(report.reviews[2].note, 'Reproduzível na versão anterior.');
assert.equal(report.reviews[0].question.index, 0);
assert.deepEqual(report.reviews.map(review => review.currentLocation), [samples[0].lessonId + '#2', samples[0].lessonId + '#2', null]);
assert.equal(report.reviews[2].seed, seed);
assert.equal(report.reviews[2].appVersion, '1.4.6');

// Reordering within the same lesson updates currentLocation for every surviving question; duplicate record refs only mark the last as latest.
const dupRecord = makeRecord(samples[2], 'approved', 'Questão C antes da reordenação.');
const reorderedReport = JSON.parse(JSON.stringify(reviewReport(updated, [...history, dupRecord, dupRecord], '1.4.7', timestamp)));
assert.equal(reorderedReport.reviews[3].question.index, 2);
assert.equal(reorderedReport.reviews[3].currentLocation, samples[2].lessonId + '#1');
assert.deepEqual(reorderedReport.reviews.slice(3).map(r => r.latestForRevision), [false, true]);
assert.deepEqual(reorderedReport.summary, { totalQuestions: 4, pending: 2, approved: 2, issues: 0 });

// Numeric tolerance in exported snapshots: default relative tolerance when tol is omitted, explicit absolute tolerance when given.
assert.equal(JSON.parse(JSON.stringify(exerciseSnapshot({ kind: 'numeric', prompt: 'x', answer: 250 }))).tolerance, 250 * 1e-6);
assert.equal(JSON.parse(JSON.stringify(exerciseSnapshot({ kind: 'numeric', prompt: 'x', answer: 0 }))).tolerance, 1e-6);
assert.equal(JSON.parse(JSON.stringify(exerciseSnapshot({ kind: 'numeric', prompt: 'x', answer: -0.2 }))).tolerance, 1e-6);
assert.equal(JSON.parse(JSON.stringify(exerciseSnapshot({ kind: 'numeric', prompt: 'x', answer: 250, tol: 0.05 }))).tolerance, 0.05);
assert.equal(JSON.parse(JSON.stringify(exerciseSnapshot({ kind: 'numeric', prompt: 'x', answer: 250, tol: 0 }))).tolerance, 0);

// Every snapshot, and the attempt a circuit hands to the report, must survive the JSON export.
const { makeValue } = require(path.join(ROOT, 'src/lib/circuit'));
let circuits = 0;
let defaultTolCount = 0;
let explicitTolCount = 0;
for (const question of catalog) {
  const exercise = materializeReview(question, seed);
  assert(exerciseSnapshot(exercise).prompt.length);
  const exported = JSON.parse(JSON.stringify(exerciseSnapshot(exercise)));
  assert.equal(exported.kind, exercise.kind, 'Registro não exportável: ' + question.key);
  if (exercise.kind === 'numeric') {
    const expectedTol = exercise.tol ?? Math.max(1e-6, Math.abs(exercise.answer) * 1e-6);
    assert.equal(exported.tolerance, expectedTol, 'Tolerância numérica incorreta: ' + question.key);
    if (exercise.tol === undefined) defaultTolCount++;
    else explicitTolCount++;
  }
  if (exercise.kind === 'interactive' && exercise.widget === 'circuit') {
    const attempt = JSON.parse(JSON.stringify(makeValue(exercise.props.comps)));
    assert(Array.isArray(attempt.comps) && attempt.comps.length, 'Tentativa de circuito sem componentes: ' + question.key);
    circuits++;
  }
  const answer = reviewAnswer(exercise);
  assert(answer.text || answer.code || exercise.explain, 'Gabarito sem material para revisão: ' + question.key);
}
assert(circuits > 0);
assert(defaultTolCount > 0 && explicitTolCount > 0);

// Storage, export and ReviewRun UI flow checks (async).
(async () => {
  const Module = require('node:module');
  const React = require('react');
  const origReactHooks = {
    useState: React.useState,
    useRef: React.useRef,
    useMemo: React.useMemo,
    useCallback: React.useCallback,
    useEffect: React.useEffect,
  };

  const memoryStore = new Map();
  let sqliteCalls = 0;
  let failNextSqlWrite = false;
  const sqliteRows = [];
  let deletedFiles = 0;
  let sharedFiles = 0;
  let failNextFileWrite = false;

  const prevLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === '@react-native-async-storage/async-storage') {
      return {
        __esModule: true,
        default: {
          async getItem(key) {
            await Promise.resolve();
            return memoryStore.get(key) ?? null;
          },
          async setItem(key, val) {
            await Promise.resolve();
            memoryStore.set(key, val);
          },
        },
      };
    }
    if (request === 'expo-sqlite') {
      return {
        async openDatabaseAsync() {
          sqliteCalls++;
          return {
            async execAsync() {},
            async getAllAsync() { return [...sqliteRows]; },
            async runAsync(_sql, report) {
              if (failNextSqlWrite) {
                failNextSqlWrite = false;
                throw new Error('SQLITE_IOERR');
              }
              await Promise.resolve();
              sqliteRows.push({ report });
            },
          };
        },
      };
    }
    if (request === 'expo-file-system') {
      class MockFile {
        constructor(dir, name) { this.uri = dir + '/' + name; }
        create() {}
        async write() {
          if (failNextFileWrite) {
            failNextFileWrite = false;
            throw new Error('ENOSPC');
          }
        }
        delete() { deletedFiles++; }
      }
      return {
        Paths: { cache: '/tmp/cache' },
        File: MockFile,
        Directory: {
          async pickDirectoryAsync() {
            return { createFile: (name) => new MockFile('/tmp/dir', name) };
          },
        },
      };
    }
    if (request === 'expo-sharing') {
      return {
        async isAvailableAsync() { return true; },
        async shareAsync() { sharedFiles++; },
      };
    }
    if (request === 'react-native') {
      return {
        View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', TextInput: 'TextInput',
        StyleSheet: { create: s => s, absoluteFill: {} },
        BackHandler: { addEventListener: () => ({ remove() {} }) },
        useWindowDimensions: () => ({ width: 375, height: 800 }),
        Keyboard: { addListener: () => ({ remove() {} }) },
        Platform: { OS: 'android', select: o => o.default },
      };
    }
    if (request === 'react-native-safe-area-context') {
      return { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
    }
    return prevLoad.call(this, request, parent, isMain);
  };

  // 1. Web AsyncStorage serialization: concurrent saves must not lose records.
  const webStorage = require(path.join(ROOT, 'src/lib/reviewStorage.ts'));
  await Promise.all([webStorage.saveReviewRecord(history[0]), webStorage.saveReviewRecord(history[1])]);
  const webLoaded = await webStorage.loadReviewRecords();
  assert.equal(webLoaded.length, 2);
  assert.equal(webLoaded[0].note, 'Primeiro parecer.');
  assert.equal(webLoaded[1].note, 'Verificado novamente.');

  // 2. Native SQLite storage: failed write resets connection and retry succeeds without losing concurrent writes.
  const nativeStorage = require(path.join(ROOT, 'src/lib/reviewStorage.native.ts'));
  failNextSqlWrite = true;
  await assert.rejects(() => nativeStorage.saveReviewRecord(history[0]), /SQLITE_IOERR/);
  await Promise.all([nativeStorage.saveReviewRecord(history[0]), nativeStorage.saveReviewRecord(history[1])]);
  const nativeLoaded = await nativeStorage.loadReviewRecords();
  assert.equal(nativeLoaded.length, 2);
  assert(sqliteCalls >= 2, 'Conexão SQLite deveria reabrir após falha');

  // 3. Native file export: failed write midway cleans up partial file and does not share it.
  const { exportReviewFile } = require(path.join(ROOT, 'src/lib/reviewExport.native.ts'));
  failNextFileWrite = true;
  await assert.rejects(() => exportReviewFile('relatorio.json', '{}', true), /ENOSPC/);
  assert.equal(deletedFiles, 1);
  failNextFileWrite = true;
  await assert.rejects(() => exportReviewFile('relatorio.json', '{}', false), /ENOSPC/);
  assert.equal(deletedFiles, 2);
  assert.equal(sharedFiles, 0);
  await exportReviewFile('relatorio.json', '{}', false);
  assert.equal(sharedFiles, 1);

  // 4. ReviewRun UI flow: "Voltar à questão" preserves ExerciseHost instance/state; "Reportar sem responder", failed save retry and double-save protection work.
  const { ReviewRun } = require(path.join(ROOT, 'src/components/review/ReviewRun.tsx'));
  const { ExerciseHost } = require(path.join(ROOT, 'src/components/lesson/ExerciseHost.tsx'));
  const { Button } = require(path.join(ROOT, 'src/components/ui/Button.tsx'));

  const states = [];
  let cursor = 0;
  const hookDispatcher = {
    useState(init) {
      const i = cursor++;
      if (!(i in states)) states[i] = typeof init === 'function' ? init() : init;
      return [states[i], v => { states[i] = typeof v === 'function' ? v(states[i]) : v; }];
    },
    useRef(init) {
      const i = cursor++;
      if (!(i in states)) states[i] = { current: init };
      return states[i];
    },
    useMemo(fn, deps) {
      const i = cursor++;
      const prev = states[i];
      if (!prev || !deps || deps.some((d, k) => !Object.is(d, prev.deps[k]))) {
        states[i] = { value: fn(), deps };
      }
      return states[i].value;
    },
    useCallback(fn, deps) {
      return hookDispatcher.useMemo(() => fn, deps);
    },
    useEffect() {},
  };
  Object.assign(React, hookDispatcher);

  function findAll(node, predicate, out = []) {
    if (!node || typeof node !== 'object') return out;
    if (Array.isArray(node)) {
      for (const item of node) findAll(item, predicate, out);
      return out;
    }
    if (predicate(node)) out.push(node);
    if (node.props && node.props.children) findAll(node.props.children, predicate, out);
    return out;
  }

  const savedRecords = [];
  let finishedSummary = null;
  let leftRound = 0;
  let saveGate = null;
  let failNextSave = false;
  const session = { id: 'round-1', questions: [samples[0], samples[1]] };
  const renderRun = () => {
    cursor = 0;
    return ReviewRun({
      session,
      appVersion: '1.4.6',
      async onSave(record) {
        if (saveGate) await saveGate;
        if (failNextSave) {
          failNextSave = false;
          throw new Error('Disk full');
        }
        savedRecords.push(record);
      },
      onFinish(summary) { finishedSummary = summary; },
      onLeave() { leftRound++; },
    });
  };

  let tree = renderRun();
  let host = findAll(tree, el => el.type === ExerciseHost)[0];
  assert.equal(host.key, samples[0].key + ':0');
  assert.equal(host.props.locked, false);

  // Simulate user typing C code / building circuit and becoming ready.
  const checkFn = () => ({ correct: true, submission: { source: 'int main(void) { return 0; }' } });
  host.props.checkRef.current = checkFn;
  host.props.onReady(true);

  tree = renderRun();
  const verifyBtn = findAll(tree, el => el.type === Button && el.props.title === 'Verificar resposta')[0];
  assert.equal(verifyBtn.props.disabled, false);
  verifyBtn.props.onPress();

  // Feedback panel is open; ExerciseHost stays mounted with the same key and locked=true.
  tree = renderRun();
  host = findAll(tree, el => el.type === ExerciseHost)[0];
  assert.equal(host.key, samples[0].key + ':0');
  assert.equal(host.props.locked, true);
  const backToQuestionBtn = findAll(tree, el => el.type === Button && el.props.title === 'Voltar à questão')[0];
  assert(backToQuestionBtn, 'Botão "Voltar à questão" deve estar visível');
  backToQuestionBtn.props.onPress();

  // After "Voltar à questão": ExerciseHost was NOT remounted (same key), checkRef and ready are still intact.
  tree = renderRun();
  host = findAll(tree, el => el.type === ExerciseHost)[0];
  assert.equal(host.key, samples[0].key + ':0');
  assert.equal(host.props.locked, false);
  assert.equal(host.props.checkRef.current, checkFn);
  assert.equal(findAll(tree, el => el.type === Button && el.props.title === 'Verificar resposta')[0].props.disabled, false);

  // "Reportar sem responder" still works after returning to the question.
  const reportBtn = findAll(tree, el => el.type === Button && el.props.title === 'Reportar sem responder')[0];
  reportBtn.props.onPress();
  tree = renderRun();
  assert.equal(findAll(tree, el => el.type === Button && el.props.title === 'Aprovar questão').length, 0);
  const issueBtn = findAll(tree, el => el.type === Button && el.props.title === 'Registrar problema')[0];

  // Issue without note requires description.
  await issueBtn.props.onPress();
  assert.equal(savedRecords.length, 0);

  // Fill note and simulate a save failure midway: state and note must survive for retry.
  tree = renderRun();
  const noteInput = findAll(tree, el => el.type === 'TextInput')[0];
  noteInput.props.onChangeText('Circuito perde estado ao voltar');
  tree = renderRun();
  failNextSave = true;
  await findAll(tree, el => el.type === Button && el.props.title === 'Registrar problema')[0].props.onPress();
  assert.equal(savedRecords.length, 0);
  tree = renderRun();
  host = findAll(tree, el => el.type === ExerciseHost)[0];
  assert.equal(host.key, samples[0].key + ':0');
  assert.equal(findAll(tree, el => el.type === 'TextInput')[0].props.value, 'Circuito perde estado ao voltar');

  // Retry save while also double-tapping and pressing Leave during in-flight save.
  let releaseSave;
  saveGate = new Promise(resolve => { releaseSave = resolve; });
  const retryIssueBtn = findAll(tree, el => el.type === Button && el.props.title === 'Registrar problema')[0];
  const firstSave = retryIssueBtn.props.onPress();
  const duplicateSave = retryIssueBtn.props.onPress();
  const leaveBtn = findAll(tree, el => el.props && el.props.accessibilityLabel === 'Sair da rodada')[0];
  leaveBtn.props.onPress();
  assert.equal(leftRound, 0, 'Não deve sair da rodada enquanto grava o parecer');
  releaseSave();
  await Promise.all([firstSave, duplicateSave]);
  saveGate = null;
  assert.equal(savedRecords.length, 1);
  assert.equal(savedRecords[0].verdict, 'issue');
  assert.equal(savedRecords[0].note, 'Circuito perde estado ao voltar');

  // Moved to question 2 (index 1): ExerciseHost now mounts with the new key.
  tree = renderRun();
  host = findAll(tree, el => el.type === ExerciseHost)[0];
  assert.equal(host.key, samples[1].key + ':1');
  host.props.checkRef.current = checkFn;
  host.props.onReady(true);
  tree = renderRun();
  findAll(tree, el => el.type === Button && el.props.title === 'Verificar resposta')[0].props.onPress();
  tree = renderRun();
  const approveBtn = findAll(tree, el => el.type === Button && el.props.title === 'Aprovar questão')[0];
  await Promise.all([approveBtn.props.onPress(), approveBtn.props.onPress()]);
  assert.equal(savedRecords.length, 2);
  assert.deepEqual(finishedSummary, { approved: 1, issues: 1 });

  Object.assign(React, origReactHooks);
  Module._load = prevLoad;
  console.log('Revisão administrativa: catálogo, sorteio, reabertura, histórico JSON, fluxo de UI e ' + catalog.length + ' gabaritos passaram (' + circuits + ' circuitos exportáveis).');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
