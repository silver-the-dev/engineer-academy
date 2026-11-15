const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const Module = require('node:module');
const path = require('node:path');
const ROOT = require('./support/load-content.cjs');

// Use the same TypeScript require hook as test-review-flow, with explicit native boundaries.
// Neither the private activation file nor the production activation hash is loaded here.
const code = 'codigo-ficticio-1234';
const activationHash = crypto.createHash('sha256').update(code.replace(/-/g, '')).digest('hex');
const authPath = path.join(ROOT, 'src/lib/adminAuth.ts');
const load = Module._load;
let raw = null, readError = false, writeError = false, writes = 0;
let now = 1_000_000;
const realNow = Date.now;
Date.now = () => now;
global.__DEV__ = false;
const platform = { OS: 'android' };
const listeners = new Set();
const appState = {
  currentState: 'active',
  addEventListener: (_event, listener) => { listeners.add(listener); return { remove: () => listeners.delete(listener) }; },
};
function changeAppState(state) {
  appState.currentState = state;
  for (const listener of listeners) listener(state);
}
const secureStore = {
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked-device-only',
  async getItemAsync() { if (readError) throw new Error('Falha de leitura simulada.'); return raw; },
  async setItemAsync(_key, value, options) {
    assert.equal(options.keychainAccessible, secureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY);
    if (writeError) throw new Error('Falha de gravação simulada.');
    raw = value;
    writes++;
  },
};
Module._load = function (request, parent, isMain) {
  if (request === './adminEnrollment' && parent?.filename === authPath) return { ADMIN_ACTIVATION_HASH: activationHash };
  if (request === 'react-native') return new Proxy(load.call(this, request, parent, isMain), {
    get: (target, key) => key === 'Platform' ? platform : Reflect.get(target, key),
  });
  if (request === 'expo-secure-store') return secureStore;
  if (request === 'expo-crypto') return { getRandomBytesAsync: async n => new Uint8Array(crypto.randomBytes(n)) };
  return load.call(this, request, parent, isMain);
};
const auth = require(authPath);
const reference = (password, salt, rounds = 20_000) => crypto.pbkdf2Sync(password, salt, rounds, 32, 'sha256').toString('hex');
const salt = '0123456789abcdef0123456789abcdef';
const password = 'Olá, engenharia! 🔐';
const legacy = { salt, hash: reference(password.normalize('NFD'), salt, 600_000) };
const setCredentials = (credentials, failures = 0, retryAfter = 0) => { raw = JSON.stringify({ credentials, failures, retryAfter }); };
const flush = () => new Promise(resolve => setImmediate(resolve));

// A small hook runner exercises the actual form and screen handlers without a renderer/native app.
let current;
const react = {
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  Fragment: 'Fragment',
  useState(initial) {
    const runner = current, i = runner.index++;
    if (!(i in runner.slots)) runner.slots[i] = typeof initial === 'function' ? initial() : initial;
    return [runner.slots[i], value => { runner.slots[i] = typeof value === 'function' ? value(runner.slots[i]) : value; }];
  },
  useRef(initial) { return react.useState(() => ({ current: initial }))[0]; },
  useMemo: fn => fn(),
  useCallback: fn => fn,
  useEffect(fn, deps) {
    const runner = current, i = runner.index++, old = runner.slots[i];
    if (!old || deps.some((value, j) => value !== old.deps[j])) {
      runner.effects.push(() => { old?.cleanup?.(); runner.slots[i] = { deps, cleanup: fn() }; });
    }
  },
};
function mount(component, props = {}) {
  const runner = {
    slots: [], effects: [], index: 0,
    render() {
      this.index = 0;
      current = this;
      const tree = component(props);
      current = undefined;
      this.effects.splice(0).forEach(effect => effect());
      return tree;
    },
    unmount() { this.slots.forEach(slot => slot?.cleanup?.()); },
  };
  runner.render();
  return runner;
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
const find = (tree, predicate) => nodes(tree).find(predicate);
const button = (tree, title) => find(tree, n => n.type === 'Button' && n.props.title === title);
const hasText = (tree, text) => nodes(tree).some(n => n.type === 'Text' && n.props.children.includes(text));
const input = (tree, label) => find(tree, n => n.type === 'TextInput' && n.props.accessibilityLabel === label);

async function main() {
  assert.equal(await auth.deriveAdminPassword(password, salt), reference(password.normalize('NFC'), salt));
  assert.equal(await auth.deriveAdminPassword(password.normalize('NFD'), salt), reference(password, salt));
  assert.notEqual(await auth.deriveAdminPassword(password, 'f'.repeat(32)), await auth.deriveAdminPassword(password, salt));
  assert.equal(await auth.deriveAdminPassword(password.normalize('NFD'), salt, 600_000, false), legacy.hash);
  for (const args of [[null, salt], ['', salt], ['x'.repeat(129), salt], [password, 'truncado'], [password, null], [password, salt, 0], [password, salt, 1e9]]) {
    await assert.rejects(auth.deriveAdminPassword(...args), /inválidos/);
  }
  assert(auth.equalAdminHash('a'.repeat(64), 'a'.repeat(64)));
  for (const index of [0, 31, 63]) {
    const chars = [...'a'.repeat(64)]; chars[index] = 'b';
    assert(!auth.equalAdminHash(chars.join(''), 'a'.repeat(64)));
  }
  assert(!auth.equalAdminHash('a', 'aa'));
  // All positions must be read, even if the first character is wrong. Avoid flaky timing thresholds.
  let comparisons = 0;
  const observed = { length: 64, charCodeAt: () => { comparisons++; return 98; } };
  assert(!auth.equalAdminHash(observed, 'a'.repeat(64)));
  assert.equal(comparisons, 64);

  const migrated = await auth.verifyAdminPassword(password.normalize('NFD'), legacy);
  assert.deepEqual(migrated, { salt, hash: reference(password, salt), iterations: 20_000, normalization: 'NFC' });
  assert.equal(legacy.iterations, undefined);
  assert.equal(await auth.verifyAdminPassword(password, migrated), migrated);
  assert.equal(await auth.verifyAdminPassword(password.normalize('NFD'), migrated), migrated);
  const currentOld = { salt, hash: reference(password.normalize('NFD'), salt), iterations: 20_000 };
  assert.deepEqual(await auth.verifyAdminPassword(password.normalize('NFD'), currentOld), migrated);
  assert.deepEqual(await auth.verifyAdminPassword(password.normalize('NFD'), { ...legacy, iterations: 600_000 }), migrated);
  for (const value of ['', 'errada', null, undefined, 'x'.repeat(129)]) {
    assert.equal(await auth.verifyAdminPassword(value, migrated), null);
  }
  for (const credentials of [null, {}, { ...migrated, hash: migrated.hash.slice(1) }, { ...migrated, salt: salt.slice(1) }, { ...migrated, iterations: 1e9 }]) {
    assert.equal(await auth.verifyAdminPassword(password, credentials), null);
  }

  assert.deepEqual(auth.parseAdminAuth(null), { failures: 0, retryAfter: 0 });
  for (const value of ['', '{', 'null', '{}', '[]', 'true', '42',
    JSON.stringify({ credentials: {}, failures: 0, retryAfter: 0 }),
    JSON.stringify({ credentials: { ...migrated, hash: 'abcd' }, failures: 0, retryAfter: 0 }),
    JSON.stringify({ credentials: { ...migrated, iterations: -1 }, failures: 0, retryAfter: 0 }),
    JSON.stringify({ credentials: { ...migrated, normalization: 'NFD' }, failures: 0, retryAfter: 0 }),
    JSON.stringify({ failures: -1, retryAfter: 0 }), JSON.stringify({ failures: '0', retryAfter: 0 }),
    JSON.stringify({ failures: 0, retryAfter: null })]) {
    assert.throws(() => auth.parseAdminAuth(value));
  }
  assert.equal(auth.parseAdminAuth(JSON.stringify({ failures: 5, retryAfter: now + 30_001 })).retryAfter, 0);
  assert.equal(auth.parseAdminAuth(JSON.stringify({ failures: 5, retryAfter: now + 30_000 })).retryAfter, now + 30_000);
  assert.equal(await auth.adminConfigured(), false);
  readError = true;
  await assert.rejects(auth.adminConfigured(), /leitura/);
  readError = false;
  raw = JSON.stringify({ credentials: {}, failures: 0, retryAfter: 0 });
  await assert.rejects(auth.adminConfigured(), /corrompido/);
  await assert.rejects(auth.signInAdmin(password), /corrompido/);
  const beforeInvalid = writes;
  for (const value of ['', 'errado', null]) await assert.rejects(auth.activateAdmin(value, password), /Código/);
  for (const value of ['', 'curta', ' '.repeat(12), 'x'.repeat(129), null]) await assert.rejects(auth.activateAdmin(code, value), /10 a 128/);
  await assert.rejects(auth.activateAdmin('review-preview-token', password), /Código/);
  assert.equal(writes, beforeInvalid);
  // Recovery must work without reading corrupt/unavailable credentials first.
  readError = true;
  await auth.activateAdmin('  CODIGO - FICTICIO - 1234  ', password.normalize('NFD'));
  readError = false;
  const activated = JSON.parse(raw).credentials;
  assert.equal(activated.iterations, 20_000);
  assert.equal(activated.salt.length, 32);
  assert.equal(activated.hash, reference(password, activated.salt));
  assert.equal(await auth.adminConfigured(), true);
  await auth.signInAdmin(password);
  await auth.activateAdmin(code, password);
  assert.notEqual(JSON.parse(raw).credentials.salt, activated.salt);
  const fresh = JSON.parse(raw).credentials;
  for (let i = 1; i <= 5; i++) {
    await assert.rejects(auth.signInAdmin(i === 1 ? '' : 'errada'), i === 5 ? /30 s/ : /incorreta/);
    assert.equal(JSON.parse(raw).failures, i);
  }
  await assert.rejects(auth.signInAdmin(password), /novamente em 30 s/);
  now += 29_001;
  await assert.rejects(auth.signInAdmin(password), /novamente em 1 s/);
  now += 999;
  await assert.rejects(auth.signInAdmin('errada'), /incorreta/);
  assert.equal(JSON.parse(raw).failures, 1);
  await auth.signInAdmin(password);
  assert.deepEqual(JSON.parse(raw), { credentials: fresh, failures: 0, retryAfter: 0 });
  setCredentials(legacy, 2);
  const oldRaw = raw;
  await assert.rejects(auth.signInAdmin('errada'), /incorreta/);
  assert.equal(JSON.parse(raw).credentials.iterations, undefined);
  setCredentials(legacy, 2);
  writeError = true;
  await assert.rejects(auth.signInAdmin(password.normalize('NFD')), /gravação/);
  assert.equal(raw, oldRaw);
  writeError = false;
  await auth.signInAdmin(password.normalize('NFD'));
  assert.deepEqual(JSON.parse(raw), { credentials: migrated, failures: 0, retryAfter: 0 });
  await auth.signInAdmin(password);
  await assert.rejects(auth.signInAdmin('x'.repeat(129)), /incorreta/);
  raw = null;
  await assert.rejects(auth.signInAdmin(password), /Ative/);
  writeError = true;
  await assert.rejects(auth.activateAdmin(code, password), /gravação/);
  assert.equal(raw, null);
  writeError = false;

  const gate = auth.createAdminSession();
  const attempt = gate.begin();
  assert(gate.canUnlock(attempt, 'active'));
  assert(!gate.canUnlock(attempt, 'background'));
  assert(!gate.canUnlock(attempt, null));
  assert(!gate.change('background', 0));
  assert(!gate.canUnlock(attempt, 'active'));
  gate.change('background', 60_000); // A repeated event must not restart the clock.
  assert(gate.change('active', 120_000));
  assert(!gate.change('active', 120_001));
  const next = gate.begin();
  assert(gate.canUnlock(next, 'active'));
  gate.invalidate();
  assert(!gate.canUnlock(next, 'active'));
  gate.change('background', 200_000);
  assert(!gate.change('active', 319_999));

  // Keep review calculations real; stub only native UI, persistence, and the other agent's component.
  const review = require(path.join(ROOT, 'src/lib/review'));
  const questions = Array.from({ length: 15 }, (_, index) => ({ key: 'q' + index, lessonId: 'lesson', lessonTitle: 'Lição', sectionTitle: 'Seção', index }));
  const record = (question, verdict) => ({ question, verdict });
  let records = questions.slice(0, 13).map(q => record(q, 'issue'));
  records.push(record(questions[12], 'approved'), record({ ...questions[14], key: 'old-revision' }, 'issue'));
  const loadUI = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === 'react') return react;
    if (request === 'react-native') return {
      Platform: platform, AppState: appState, StyleSheet: { create: x => x },
      Text: 'Text', TextInput: 'TextInput', View: 'View', Pressable: 'Pressable', ScrollView: 'ScrollView',
      Keyboard: { addListener: () => ({ remove() {} }) },
    };
    if (request === 'expo-router') return { router: {}, useFocusEffect: fn => react.useEffect(fn, []) };
    if (request === 'expo-constants') return { expoConfig: { version: '1.4.6' } };
    if (request === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ bottom: 0 }) };
    if (request.endsWith('/ui/Button')) return { Button: 'Button', Card: 'Card' };
    if (request.endsWith('/ReviewRun')) return { ReviewRun: 'ReviewRun' };
    if (request.endsWith('/reviewStorage')) return { loadReviewRecords: async () => records, saveReviewRecord: async item => { records = [...records, item]; } };
    if (request.endsWith('/review')) return { ...review, reviewCatalog: () => questions };
    return loadUI.call(this, request, parent, isMain);
  };
  const { AdminAccess } = require(path.join(ROOT, 'src/components/review/AdminAccess'));
  let began = 0, unlocked = 0;
  const begin = () => { began++; return () => { unlocked++; }; };
  for (const failure of ['read', 'corrupt']) {
    readError = failure === 'read';
    raw = failure === 'corrupt' ? JSON.stringify({ credentials: {}, failures: 0, retryAfter: 0 }) : null;
    const form = mount(AdminAccess, { onBeginSignIn: begin });
    await flush();
    assert(hasText(form.render(), 'Ativar administração'));
    assert(input(form.render(), 'Código de ativação'));
    assert(button(form.render(), 'Salvar senha e entrar').props.disabled);
    input(form.render(), 'Código de ativação').props.onChangeText(code);
    input(form.render(), 'Nova senha').props.onChangeText(password.normalize('NFD'));
    input(form.render(), 'Confirmar senha').props.onChangeText('diferente');
    await button(form.render(), 'Salvar senha e entrar').props.onPress();
    assert(hasText(form.render(), 'As senhas precisam ser iguais.'));
    input(form.render(), 'Confirmar senha').props.onChangeText(password);
    writeError = true;
    await button(form.render(), 'Salvar senha e entrar').props.onPress();
    assert(hasText(form.render(), 'Falha de gravação simulada.'));
    assert.equal(unlocked, failure === 'read' ? 0 : 1);
    writeError = false;
    await button(form.render(), 'Salvar senha e entrar').props.onPress();
    assert(hasText(form.render(), 'Entrar na administração'));
    assert.equal(input(form.render(), 'Senha administrativa').props.value, '');
    form.unmount();
    readError = false;
  }
  assert.equal(began, 4);
  assert.equal(unlocked, 2);
  const form = mount(AdminAccess, { onBeginSignIn: begin });
  await flush();
  button(form.render(), 'Esqueci a senha').props.onPress();
  assert(hasText(form.render(), 'Redefinir senha'));
  button(form.render(), 'Voltar ao login').props.onPress();
  input(form.render(), 'Senha administrativa').props.onChangeText(password);
  const submit = button(form.render(), 'Entrar').props.onPress;
  const first = submit();
  assert(button(form.render(), 'Aguarde…').props.disabled);
  await submit();
  await first;
  assert.equal(unlocked, 3); // Repeated tap does not start a second login.
  form.unmount();

  const AdminScreen = require(path.join(ROOT, 'src/app/admin')).default;
  const screen = mount(AdminScreen);
  let access = find(screen.render(), n => n.type === AdminAccess);
  let finish = access.props.onBeginSignIn();
  changeAppState('background');
  finish();
  assert(find(screen.render(), n => n.type === AdminAccess));
  now += 120_000;
  changeAppState('active');
  finish(); // Login finishes after the user returned: it must still be rejected.
  assert(find(screen.render(), n => n.type === AdminAccess));
  access = find(screen.render(), n => n.type === AdminAccess);
  finish = access.props.onBeginSignIn();
  changeAppState('background');
  now += 1;
  changeAppState('active');
  finish();
  assert(find(screen.render(), n => n.type === AdminAccess));
  find(screen.render(), n => n.type === AdminAccess).props.onBeginSignIn()();
  let deskNode = find(screen.render(), n => n.type?.name === 'ReviewDesk');
  assert(deskNode);
  changeAppState('background');
  now += 119_999;
  changeAppState('active');
  assert(!find(screen.render(), n => n.type === AdminAccess));
  changeAppState('background');
  now += 120_000;
  changeAppState('active');
  assert(find(screen.render(), n => n.type === AdminAccess));
  find(screen.render(), n => n.type === AdminAccess).props.onBeginSignIn()();
  button(screen.render(), 'Bloquear').props.onPress();
  assert(find(screen.render(), n => n.type === AdminAccess));
  finish = find(screen.render(), n => n.type === AdminAccess).props.onBeginSignIn();
  screen.unmount();
  finish();
  assert(find(screen.render(), n => n.type === AdminAccess));
  assert.equal(listeners.size, 0);

  const desk = mount(deskNode.type);
  await flush();
  const loaded = find(desk.render(), n => n.type?.name === 'LoadedDesk');
  assert(loaded);
  const dashboard = mount(loaded.type, loaded.props);
  assert(button(dashboard.render(), 'Rever questões com problema'));
  const reviewed = [];
  for (const expected of [10, 2]) {
    button(dashboard.render(), 'Rever questões com problema').props.onPress();
    const run = find(dashboard.render(), n => n.type === 'ReviewRun');
    assert.equal(run.props.session.questions.length, expected);
    assert.equal(new Set(run.props.session.questions.map(q => q.key)).size, expected);
    for (const question of run.props.session.questions) {
      assert(questions.slice(0, 12).some(q => q.key === question.key));
      assert(!reviewed.includes(question.key));
      reviewed.push(question.key);
      await run.props.onSave(record(question, 'approved'));
    }
    run.props.onFinish({ approved: expected, issues: 0 });
  }
  assert.equal(reviewed.length, 12);
  assert(!button(dashboard.render(), 'Rever questões com problema'));
  button(dashboard.render(), 'Iniciar revisão aleatória').props.onPress();
  const pendingRun = find(dashboard.render(), n => n.type === 'ReviewRun');
  assert.deepEqual(new Set(pendingRun.props.session.questions.map(q => q.key)), new Set(['q13', 'q14']));
  dashboard.unmount();
  desk.unmount();
  console.log('Acesso administrativo: derivação, Unicode, migração, entradas inválidas, bloqueio, recuperação e fila de problemas passaram.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  Date.now = realNow;
  Module._load = load;
});
