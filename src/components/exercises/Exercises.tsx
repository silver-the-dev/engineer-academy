import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { C, F, alpha } from '../../theme';
import type { Fill, Interactive, MCQ, Match, MultiSelect, Numeric, Order, TrueFalse } from '../../content/types';
import { RichText } from '../math/RichText';
import { Choice, ChoiceState, ExProps, Token, parseNumber } from './common';
import { fmt, makeRng, shuffle } from '../../lib/random';
import { tapFeedback, wrongFeedback, correctFeedback } from '../../lib/feedback';
import { renderWidget } from '../visuals/registry';

/* ---------------- Multiple choice ---------------- */
export function MCQView({ ex, locked, onReady, registerCheck }: ExProps<MCQ>) {
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => onReady(sel !== null), [sel, onReady]);
  registerCheck(() => {
    setChecked(true);
    return { correct: sel === ex.answer, answer: ex.options[ex.answer] };
  });
  const many = ex.options.length > 4 || ex.options.every((o) => o.length < 14);
  const seed = useRef(Math.floor(Math.random() * 1e9)).current;
  const orderIdx = useMemo(() => shuffle(makeRng(seed), ex.options.map((_, i) => i)), [ex, seed]);
  return (
    <View style={{ flexDirection: many ? 'row' : 'column', flexWrap: 'wrap', marginHorizontal: many ? -5 : 0 }}>
      {orderIdx.map((i) => {
        const o = ex.options[i];
        let st: ChoiceState = sel === i ? 'selected' : 'idle';
        if (checked) st = i === ex.answer ? 'correct' : sel === i ? 'wrong' : 'dim';
        return (
          <Choice
            key={i}
            text={o}
            state={st}
            center={many}
            onPress={locked ? undefined : () => setSel(i)}
            style={many ? { width: '46%', margin: '2%' } : { marginBottom: 10 }}
          />
        );
      })}
    </View>
  );
}

/* ---------------- Multi select ---------------- */
export function MultiView({ ex, locked, onReady, registerCheck }: ExProps<MultiSelect>) {
  const [sel, setSel] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  useEffect(() => onReady(sel.length > 0), [sel, onReady]);
  const seed = useRef(Math.floor(Math.random() * 1e9)).current;
  const orderIdx = useMemo(() => shuffle(makeRng(seed), ex.options.map((_, i) => i)), [ex, seed]);
  registerCheck(() => {
    setChecked(true);
    const a = [...ex.answers].sort().join(',');
    const b = [...sel].sort().join(',');
    return { correct: a === b, answer: ex.answers.map((i) => ex.options[i]).join(' · ') };
  });
  return (
    <View>
      <Text style={{ color: C.textMuted, fontFamily: F.bold, marginBottom: 8 }}>Selecione todas as corretas</Text>
      {orderIdx.map((i) => {
        const o = ex.options[i];
        const on = sel.includes(i);
        let st: ChoiceState = on ? 'selected' : 'idle';
        if (checked) st = ex.answers.includes(i) ? 'correct' : on ? 'wrong' : 'dim';
        return <Choice key={i} text={(on ? '☑ ' : '☐ ') + o} state={st} onPress={locked ? undefined : () => setSel(on ? sel.filter((x) => x !== i) : [...sel, i])} style={{ marginBottom: 10 }} />;
      })}
    </View>
  );
}

/* ---------------- True / False ---------------- */
export function TFView({ ex, locked, onReady, registerCheck }: ExProps<TrueFalse>) {
  const [sel, setSel] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => onReady(sel !== null), [sel, onReady]);
  registerCheck(() => {
    setChecked(true);
    return { correct: sel === ex.answer, answer: ex.answer ? 'Verdadeiro' : 'Falso' };
  });
  const opt = (v: boolean) => {
    let st: ChoiceState = sel === v ? 'selected' : 'idle';
    if (checked) st = v === ex.answer ? 'correct' : sel === v ? 'wrong' : 'dim';
    return st;
  };
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Choice text={'✅  **Verdadeiro**'} center state={opt(true)} onPress={locked ? undefined : () => setSel(true)} style={{ flex: 1, minHeight: 80 }} />
      <Choice text={'❌  **Falso**'} center state={opt(false)} onPress={locked ? undefined : () => setSel(false)} style={{ flex: 1, minHeight: 80 }} />
    </View>
  );
}

/* ---------------- Numeric (custom keypad) ---------------- */
const KEY_ROWS = [
  ['7', '8', '9', '⌫'],
  ['4', '5', '6', '/'],
  ['1', '2', '3', '−'],
  ['0', ','],
];
export function NumericView({ ex, locked, onReady, registerCheck }: ExProps<Numeric>) {
  const [s, setS] = useState('');
  const [checked, setChecked] = useState<null | boolean>(null);
  useEffect(() => onReady(parseNumber(s) !== null), [s, onReady]);
  registerCheck(() => {
    const v = parseNumber(s);
    const tol = ex.tol ?? Math.max(1e-6, Math.abs(ex.answer) * 1e-6);
    const ok = v !== null && Math.abs(v - ex.answer) <= tol + 1e-12;
    setChecked(ok);
    return { correct: ok, answer: `$${fmt(ex.answer)}$${ex.unit ? ' ' + ex.unit : ''}` };
  });
  const press = (k: string) => {
    if (locked) return;
    tapFeedback();
    if (k === '⌫') setS(s.slice(0, -1));
    else if (k === '−') setS(s.startsWith('−') ? s.slice(1) : '−' + s);
    else if (s.length < 14) setS(s + k);
  };
  const color = checked === null ? C.cyan : checked ? C.success : C.danger;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <View style={{ minWidth: 170, borderBottomWidth: 3, borderColor: color, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' }}>
          <Text style={{ color: s ? C.text : C.textDim, fontFamily: F.black, fontSize: 32 }}>{s || ex.placeholder || '?'}</Text>
        </View>
        {ex.unit ? <Text style={{ color: C.textMuted, fontFamily: F.heavy, fontSize: 20, marginLeft: 10 }}>{ex.unit}</Text> : null}
      </View>
      {KEY_ROWS.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {row.map((k) => (
            <Pressable
              key={k}
              onPress={() => press(k)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: pressed ? C.surface3 : k === '⌫' ? alpha(C.danger, 0.15) : /[0-9]/.test(k) ? C.surface2 : alpha(C.cyan, 0.12),
                borderBottomWidth: 4,
                borderColor: C.bgDeep,
                alignItems: 'center',
              })}
            >
              <Text style={{ color: k === '⌫' ? C.danger : /[0-9]/.test(k) ? C.text : C.cyan, fontFamily: F.black, fontSize: 22 }}>{k}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 12, textAlign: 'center', marginTop: 4 }}>Use vírgula para decimais e “/” para frações (ex.: 3/4)</Text>
    </View>
  );
}

/* ---------------- Match pairs ---------------- */
export function MatchView({ ex, locked, onReady, registerCheck }: ExProps<Match>) {
  const seed = useRef(Math.floor(Math.random() * 1e9)).current;
  const left = useMemo(() => shuffle(makeRng(seed), ex.pairs.map((p, i) => ({ t: p[0], i }))), [ex, seed]);
  const right = useMemo(() => shuffle(makeRng(seed + 7), ex.pairs.map((p, i) => ({ t: p[1], i }))), [ex, seed]);
  const [selL, setSelL] = useState<number | null>(null);
  const [selR, setSelR] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [bad, setBad] = useState<[number, number] | null>(null);
  const misses = useRef(0);
  useEffect(() => onReady(done.length === ex.pairs.length), [done, ex.pairs.length, onReady]);
  registerCheck(() => ({ correct: misses.current <= 1, answer: 'Revise os pares destacados' }));
  useEffect(() => {
    if (selL === null || selR === null) return;
    if (selL === selR) {
      setDone((d) => [...d, selL]);
      correctFeedback();
    } else {
      misses.current++;
      setBad([selL, selR]);
      wrongFeedback();
      setTimeout(() => setBad(null), 500);
    }
    setSelL(null);
    setSelR(null);
  }, [selL, selR]);
  const col = (items: { t: string; i: number }[], side: 'L' | 'R') =>
    items.map(({ t, i }) => {
      const isDone = done.includes(i);
      const isSel = side === 'L' ? selL === i : selR === i;
      const isBad = bad && (side === 'L' ? bad[0] === i : bad[1] === i);
      const st: ChoiceState = isDone ? 'dim' : isBad ? 'wrong' : isSel ? 'selected' : 'idle';
      return (
        <Choice
          key={side + i}
          text={t}
          center
          size={16}
          state={st}
          onPress={locked || isDone ? undefined : () => (side === 'L' ? setSelL(i) : setSelR(i))}
          style={{ marginBottom: 10, minHeight: 60, borderColor: isDone ? C.successDark : undefined }}
        />
      );
    });
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1 }}>{col(left, 'L')}</View>
      <View style={{ flex: 1 }}>{col(right, 'R')}</View>
    </View>
  );
}

/* ---------------- Order steps ---------------- */
export function OrderView({ ex, locked, onReady, registerCheck }: ExProps<Order>) {
  const seed = useRef(Math.floor(Math.random() * 1e9)).current;
  const bank = useMemo(() => {
    let s = shuffle(makeRng(seed), ex.items.map((t, i) => ({ t, i })));
    if (s.every((x, k) => x.i === k) && s.length > 1) s = [...s.slice(1), s[0]];
    return s;
  }, [ex, seed]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  useEffect(() => onReady(chosen.length === ex.items.length), [chosen, ex.items.length, onReady]);
  registerCheck(() => {
    const ok = chosen.every((v, k) => ex.items[v] === ex.items[k]);
    setChecked(ok);
    return { correct: ok, answer: ex.items.map((t, i) => `${i + 1}. ${t}`).join('\n') };
  });
  return (
    <View>
      <View style={{ minHeight: 70, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: checked === null ? C.border : checked ? C.success : C.danger, padding: 8, marginBottom: 16 }}>
        {chosen.length === 0 ? <Text style={{ color: C.textDim, fontFamily: F.semibold, textAlign: 'center', marginTop: 16 }}>Toque nos itens na ordem correta</Text> : null}
        {chosen.map((v, k) => (
          <Pressable key={k} onPress={locked ? undefined : () => setChosen(chosen.filter((_, j) => j !== k))} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface2, borderRadius: 12, padding: 10, marginVertical: 3 }}>
            <Text style={{ color: C.cyan, fontFamily: F.black, marginRight: 10, fontSize: 16 }}>{k + 1}</Text>
            <View style={{ flex: 1 }}>
              <RichText size={15}>{ex.items[v]}</RichText>
            </View>
          </Pressable>
        ))}
      </View>
      {bank.map(({ t, i }) => {
        const used = chosen.includes(i);
        return (
          <Pressable
            key={i}
            onPress={locked || used ? undefined : () => {
              tapFeedback();
              setChosen([...chosen, i]);
            }}
            style={{ borderWidth: 2, borderBottomWidth: 4, borderColor: used ? C.surface3 : C.border, borderRadius: 14, padding: 11, marginBottom: 8, backgroundColor: used ? C.surface3 : C.surface }}
          >
            <View style={{ opacity: used ? 0.15 : 1 }}>
              <RichText size={15}>{t}</RichText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------- Fill the blanks (word bank) ---------------- */
export function FillView({ ex, locked, onReady, registerCheck }: ExProps<Fill>) {
  const seed = useRef(Math.floor(Math.random() * 1e9)).current;
  const bank = useMemo(() => shuffle(makeRng(seed), ex.bank.map((t, i) => ({ t, i }))), [ex, seed]);
  const parts = useMemo(() => ex.template.split('___'), [ex]);
  const slots = parts.length - 1;
  const [filled, setFilled] = useState<(number | null)[]>(() => Array(slots).fill(null));
  const [checked, setChecked] = useState<boolean | null>(null);
  useEffect(() => onReady(filled.every((f) => f !== null)), [filled, onReady]);
  registerCheck(() => {
    const ok = filled.every((f, k) => f !== null && ex.bank[f] === ex.answers[k]);
    setChecked(ok);
    let full = '';
    parts.forEach((p, k) => (full += p + (k < slots ? `**${ex.answers[k]}**` : '')));
    return { correct: ok, answer: full };
  });
  const place = (bi: number) => {
    const k = filled.findIndex((f) => f === null);
    if (k < 0) return;
    const n = [...filled];
    n[k] = bi;
    setFilled(n);
  };
  const slotColor = checked === null ? C.cyan : checked ? C.success : C.danger;
  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 18, padding: 12, borderRadius: 16, backgroundColor: C.surface }}>
        {parts.map((p, k) => (
          <React.Fragment key={k}>
            {p ? <RichText size={18}>{p}</RichText> : null}
            {k < slots ? (
              <Pressable
                onPress={locked ? undefined : () => {
                  const n = [...filled];
                  n[k] = null;
                  setFilled(n);
                }}
                style={{ minWidth: 60, minHeight: 40, marginHorizontal: 4, marginVertical: 4, paddingHorizontal: 8, borderBottomWidth: 3, borderColor: slotColor, justifyContent: 'center', alignItems: 'center', backgroundColor: filled[k] !== null ? alpha(slotColor, 0.12) : 'transparent', borderRadius: 8 }}
              >
                {filled[k] !== null ? <RichText size={17}>{ex.bank[filled[k]!]}</RichText> : <Text style={{ color: C.textDim }}> </Text>}
              </Pressable>
            ) : null}
          </React.Fragment>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {bank.map(({ t, i }) => (
          <Token key={i} text={t} used={filled.includes(i)} onPress={locked ? undefined : () => place(i)} />
        ))}
      </View>
    </View>
  );
}

/* ---------------- Interactive (widget-driven) ---------------- */
export function InteractiveView({ ex, locked, onReady, registerCheck, width }: ExProps<Interactive>) {
  const value = useRef<any>(null);
  const [touched, setTouched] = useState(false);
  const [checked, setChecked] = useState<null | boolean>(null);
  useEffect(() => onReady(touched), [touched, onReady]);
  registerCheck(() => {
    let ok = false;
    try {
      ok = !!ex.check(value.current);
    } catch {}
    setChecked(ok);
    return { correct: ok, answer: ex.answerText };
  });
  return (
    <View pointerEvents={locked ? 'none' : 'auto'}>
      {renderWidget(ex.widget, {
        ...ex.props,
        width,
        checked,
        onChange: (v: any) => {
          value.current = v;
          if (!touched) setTouched(true);
        },
      })}
    </View>
  );
}
