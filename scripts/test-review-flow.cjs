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

const samples = originalKeys.map((key, index) => ({ ...catalog[index], key }));
const updated = updatedKeys.map((key, index) => ({ ...catalog[index], key }));
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

const report = JSON.parse(JSON.stringify(reviewReport(updated, history, '1.4.7', timestamp)));
assert.deepEqual(report.summary, { totalQuestions: 4, pending: 3, approved: 1, issues: 0 });
assert.deepEqual(report.reviews.map(({ currentRevision, latestForRevision }) => [currentRevision, latestForRevision]), [[true, false], [true, true], [false, true]]);
assert.equal(report.reviews[2].note, 'Reproduzível na versão anterior.');
assert.deepEqual(report.reviews.map(review => review.currentLocation), [samples[0].lessonId + '#2', samples[0].lessonId + '#2', null]);
assert.equal(report.reviews[2].seed, seed);
assert.equal(report.reviews[2].appVersion, '1.4.6');

// Every snapshot, and the attempt a circuit hands to the report, must survive the JSON export.
const { makeValue } = require(path.join(ROOT, 'src/lib/circuit'));
let circuits = 0;
for (const question of catalog) {
  const exercise = materializeReview(question, seed);
  assert(exerciseSnapshot(exercise).prompt.length);
  const exported = JSON.parse(JSON.stringify(exerciseSnapshot(exercise)));
  assert.equal(exported.kind, exercise.kind, 'Registro não exportável: ' + question.key);
  if (exercise.kind === 'interactive' && exercise.widget === 'circuit') {
    const attempt = JSON.parse(JSON.stringify(makeValue(exercise.props.comps)));
    assert(Array.isArray(attempt.comps) && attempt.comps.length, 'Tentativa de circuito sem componentes: ' + question.key);
    circuits++;
  }
  const answer = reviewAnswer(exercise);
  assert(answer.text || answer.code || exercise.explain, 'Gabarito sem material para revisão: ' + question.key);
}
assert(circuits > 0);
console.log('Revisão administrativa: catálogo, sorteio, reabertura, histórico JSON e ' + catalog.length + ' gabaritos passaram (' + circuits + ' circuitos exportáveis).');
