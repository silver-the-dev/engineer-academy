import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { C, F, alpha } from '../../theme';
import { RichText } from '../math/RichText';
import { Button } from '../ui/Button';
import { useScrollLock } from '../ScrollLock';
import { tapFeedback, tick } from '../../lib/feedback';
import { Plot, View2D } from '../plot/Plot';

/* ---------------- Stepper: iterate through algorithm steps ---------------- */
export function Stepper({
  width,
  steps,
  render,
  info,
  view,
  height,
  onChange,
  labels,
}: {
  width: number;
  steps: number;
  render: (k: number, width: number) => React.ReactNode;
  info?: (k: number) => string;
  view?: View2D;
  height?: number;
  onChange?: (k: number) => void;
  labels?: string[];
}) {
  const [k, setK] = useState(0);
  const go = (n: number) => {
    const v = Math.max(0, Math.min(steps - 1, n));
    setK(v);
    onChange?.(v);
  };
  return (
    <View style={{ alignItems: 'center' }}>
      {view ? (
        <Plot width={width} height={height ?? Math.round(width * 0.72)} {...view}>
          {render(k, width)}
        </Plot>
      ) : (
        <View style={{ width }}>{render(k, width)}</View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10, alignSelf: 'stretch' }}>
        <Button small title="◀" onPress={() => go(k - 1)} disabled={k === 0} color={C.surface3} style={{ flex: 1 }} />
        <View style={{ flex: 2, alignItems: 'center' }}>
          <Text style={{ color: C.cyan, fontFamily: F.black, fontSize: 16 }}>{labels?.[k] ?? `Passo ${k + 1} de ${steps}`}</Text>
        </View>
        <Button small title="▶" onPress={() => go(k + 1)} disabled={k === steps - 1} color={C.primary} style={{ flex: 1 }} />
      </View>
      {info ? (
        <View style={{ alignSelf: 'stretch', marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: C.surface2 }}>
          <RichText size={15} align="center">
            {info(k)}
          </RichText>
        </View>
      ) : null}
    </View>
  );
}

/* ---------------- Table ---------------- */
export function TableView({ head, rows, width, highlight }: { head?: string[]; rows: (string | number)[][]; width: number; highlight?: number[] }) {
  const cols = Math.max(head?.length ?? 0, ...rows.map((r) => r.length));
  const cw = width / cols;
  return (
    <View style={{ width, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
      {head ? (
        <View style={{ flexDirection: 'row', backgroundColor: C.surface3 }}>
          {head.map((h, i) => (
            <View key={i} style={{ width: cw, padding: 8, alignItems: 'center' }}>
              <RichText size={14} align="center" maxWidth={cw - 8}>
                {`**${h}**`}
              </RichText>
            </View>
          ))}
        </View>
      ) : null}
      {rows.map((r, ri) => (
        <View key={ri} style={{ flexDirection: 'row', backgroundColor: highlight?.includes(ri) ? alpha(C.gold, 0.16) : ri % 2 ? C.surface : C.surface2 }}>
          {r.map((c, ci) => (
            <View key={ci} style={{ width: cw, padding: 7, alignItems: 'center' }}>
              <RichText size={14} align="center" maxWidth={cw - 8}>
                {String(c)}
              </RichText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/* ---------------- Random experiment simulator (law of large numbers) ---------------- */
export function Simulator({ width, kind = 'die', onChange }: { width: number; kind?: 'coin' | 'die' | 'twoDice'; onChange?: (n: number) => void }) {
  const outcomes = kind === 'coin' ? ['Cara', 'Coroa'] : kind === 'die' ? ['1', '2', '3', '4', '5', '6'] : Array.from({ length: 11 }, (_, i) => String(i + 2));
  const probs = kind === 'coin' ? [0.5, 0.5] : kind === 'die' ? Array(6).fill(1 / 6) : Array.from({ length: 11 }, (_, i) => (6 - Math.abs(i + 2 - 7)) / 36);
  const [counts, setCounts] = useState<number[]>(() => outcomes.map(() => 0));
  const [last, setLast] = useState<string>('—');
  const total = counts.reduce((a, b) => a + b, 0);
  const roll = (n: number) => {
    const c = [...counts];
    let l = '';
    for (let i = 0; i < n; i++) {
      let idx: number;
      if (kind === 'coin') idx = Math.random() < 0.5 ? 0 : 1;
      else if (kind === 'die') idx = Math.floor(Math.random() * 6);
      else idx = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6);
      c[idx]++;
      l = outcomes[idx];
    }
    setCounts(c);
    setLast(n === 1 ? l : `${n} lançamentos`);
    tapFeedback();
    onChange?.(total + n);
  };
  const H = 170;
  const bw = (width - 20) / outcomes.length;
  const maxP = Math.max(...probs) * 1.6;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={H + 24}>
        {outcomes.map((o, i) => {
          const freq = total ? counts[i] / total : 0;
          const h = Math.min(H, (freq / maxP) * H);
          const th = (probs[i] / maxP) * H;
          return (
            <G key={o}>
              <Rect x={10 + i * bw + 3} y={H - h} width={bw - 6} height={h} rx={4} fill={C.primary} />
              <Line x1={10 + i * bw} x2={10 + (i + 1) * bw} y1={H - th} y2={H - th} stroke={C.gold} strokeWidth={2.5} strokeDasharray="5 3" />
              <SvgText x={10 + i * bw + bw / 2} y={H + 16} fill={C.textMuted} fontSize={kind === 'coin' ? 12 : 11} textAnchor="middle" fontFamily={F.bold}>
                {o}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 12 }}>
        Barras = frequência relativa · tracejado = probabilidade teórica
      </Text>
      <Text style={{ color: C.text, fontFamily: F.black, fontSize: 18, marginVertical: 6 }}>
        {total} lançamentos · último: {last}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
        <Button small title="1x" onPress={() => roll(1)} style={{ flex: 1 }} silent />
        <Button small title="10x" onPress={() => roll(10)} style={{ flex: 1 }} color={C.cyan} silent />
        <Button small title="100x" onPress={() => roll(100)} style={{ flex: 1 }} color={C.success} silent />
        <Button small title="1000x" onPress={() => roll(1000)} style={{ flex: 1 }} color={C.fire} silent />
      </View>
    </View>
  );
}

/* ---------------- Venn diagram (tap regions) ---------------- */
type Region = 'A' | 'AB' | 'B' | 'U';
export function Venn({ width, onChange, initial = [], labels = ['A', 'B'], readOnly, highlight }: { width: number; onChange?: (sel: Region[]) => void; initial?: Region[]; labels?: [string, string] | string[]; readOnly?: boolean; highlight?: Region[] }) {
  const [sel, setSel] = useState<Region[]>(highlight ?? initial);
  const H = Math.round(width * 0.62);
  const r = H * 0.36;
  const cx1 = width / 2 - r * 0.55;
  const cx2 = width / 2 + r * 0.55;
  const cy = H / 2;
  const toggle = (g: Region) => {
    if (readOnly) return;
    tapFeedback();
    const n = sel.includes(g) ? sel.filter((x) => x !== g) : [...sel, g];
    setSel(n);
    onChange?.(n);
  };
  const onTap = (x: number, y: number) => {
    const in1 = Math.hypot(x - cx1, y - cy) <= r;
    const in2 = Math.hypot(x - cx2, y - cy) <= r;
    toggle(in1 && in2 ? 'AB' : in1 ? 'A' : in2 ? 'B' : 'U');
  };
  const fillFor = (g: Region) => (sel.includes(g) ? alpha(C.cyan, 0.55) : 'transparent');
  // Paths for lens / crescents using circle arcs
  const d = cx2 - cx1;
  const hY = Math.sqrt(r * r - (d / 2) * (d / 2));
  const top = { x: width / 2, y: cy - hY };
  const bot = { x: width / 2, y: cy + hY };
  const lens = `M${top.x} ${top.y} A${r} ${r} 0 0 1 ${bot.x} ${bot.y} A${r} ${r} 0 0 1 ${top.x} ${top.y}Z`;
  const onlyA = `M${top.x} ${top.y} A${r} ${r} 0 1 0 ${bot.x} ${bot.y} A${r} ${r} 0 0 1 ${top.x} ${top.y}Z`;
  const onlyB = `M${top.x} ${top.y} A${r} ${r} 0 1 1 ${bot.x} ${bot.y} A${r} ${r} 0 0 0 ${top.x} ${top.y}Z`;
  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable onPress={(e) => onTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}>
        <Svg width={width} height={H}>
          <Rect x={2} y={2} width={width - 4} height={H - 4} rx={14} fill={fillFor('U')} stroke={C.border} strokeWidth={2} />
          <Path d={onlyA} fill={fillFor('A')} />
          <Path d={onlyB} fill={fillFor('B')} />
          <Path d={lens} fill={fillFor('AB')} />
          <Circle cx={cx1} cy={cy} r={r} fill="none" stroke={C.p3} strokeWidth={3} />
          <Circle cx={cx2} cy={cy} r={r} fill="none" stroke={C.p5} strokeWidth={3} />
          <SvgText x={cx1 - r * 0.6} y={cy - r * 0.75} fill={C.p3} fontSize={18} fontFamily={F.black}>
            {labels[0]}
          </SvgText>
          <SvgText x={cx2 + r * 0.45} y={cy - r * 0.75} fill={C.p5} fontSize={18} fontFamily={F.black}>
            {labels[1]}
          </SvgText>
          <SvgText x={14} y={24} fill={C.textMuted} fontSize={14} fontFamily={F.black}>
            U
          </SvgText>
        </Svg>
      </Pressable>
      {!readOnly && <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 12, marginTop: 4 }}>☝️ Toque nas regiões para pintá-las</Text>}
    </View>
  );
}

/* ---------------- Number line with draggable marker / intervals ---------------- */
export function NumberLine({
  width,
  min = -5,
  max = 5,
  step = 0.5,
  value,
  intervals = [],
  onChange,
  marker = true,
}: {
  width: number;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  intervals?: { a: number; b: number; openA?: boolean; openB?: boolean; color?: string }[];
  onChange?: (v: number) => void;
  marker?: boolean;
}) {
  const [v, setV] = useState(value ?? (min + max) / 2);
  const lock = useScrollLock();
  const H = 90;
  const pad = 20;
  const sx = (x: number) => pad + ((x - min) / (max - min)) * (width - 2 * pad);
  const ix = (px: number) => min + ((px - pad) / (width - 2 * pad)) * (max - min);
  const origin = useRef(0);
  const latest = useRef(v);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => marker,
        onMoveShouldSetPanResponder: () => marker,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          lock(true);
          origin.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
          const nv = Math.round(Math.max(min, Math.min(max, ix(e.nativeEvent.locationX))) / step) * step;
          latest.current = nv;
          setV(nv);
          onChange?.(nv);
        },
        onPanResponderMove: (e) => {
          const nv = Math.round(Math.max(min, Math.min(max, ix(e.nativeEvent.pageX - origin.current))) / step) * step;
          if (nv !== latest.current) {
            latest.current = nv;
            tick();
            setV(nv);
            onChange?.(nv);
          }
        },
        onPanResponderRelease: () => lock(false),
        onPanResponderTerminate: () => lock(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step, width, marker],
  );
  const ticks: React.ReactNode[] = [];
  for (let x = Math.ceil(min); x <= max; x++) {
    ticks.push(
      <G key={x}>
        <Line x1={sx(x)} x2={sx(x)} y1={H / 2 - 7} y2={H / 2 + 7} stroke={C.plotAxis} strokeWidth={2} />
        <SvgText x={sx(x)} y={H / 2 + 26} fill={C.textMuted} fontSize={12} textAnchor="middle" fontFamily={F.bold}>
          {x}
        </SvgText>
      </G>,
    );
  }
  return (
    <View style={{ alignItems: 'center' }} {...pan.panHandlers}>
      <Svg width={width} height={H}>
        <Line x1={pad - 10} x2={width - pad + 10} y1={H / 2} y2={H / 2} stroke={C.plotAxis} strokeWidth={2.5} />
        {intervals.map((it, i) => (
          <G key={'i' + i}>
            <Line x1={sx(it.a)} x2={sx(it.b)} y1={H / 2} y2={H / 2} stroke={it.color ?? C.success} strokeWidth={7} strokeLinecap="butt" />
            <Circle cx={sx(it.a)} cy={H / 2} r={7} fill={it.openA ? C.bgDeep : it.color ?? C.success} stroke={it.color ?? C.success} strokeWidth={3} />
            <Circle cx={sx(it.b)} cy={H / 2} r={7} fill={it.openB ? C.bgDeep : it.color ?? C.success} stroke={it.color ?? C.success} strokeWidth={3} />
          </G>
        ))}
        {ticks}
        {marker && (
          <G>
            <Path d={`M${sx(v)} ${H / 2 - 6} l-10 -18 h20 z`} fill={C.gold} />
            <SvgText x={Math.max(16, Math.min(width - 16, sx(v)))} y={14} fill={C.gold} fontSize={14} textAnchor="middle" fontFamily={F.black}>
              {String(Math.round(v * 100) / 100).replace('.', ',')}
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
}

/* ---------------- Bars (draggable heights) ---------------- */
export function Bars({
  width,
  labels,
  values,
  max = 10,
  editable = true,
  onChange,
  color = C.primary,
  showMean,
  step = 1,
}: {
  width: number;
  labels: string[];
  values: number[];
  max?: number;
  editable?: boolean;
  onChange?: (v: number[]) => void;
  color?: string;
  showMean?: boolean;
  step?: number;
}) {
  const [vals, setVals] = useState(values);
  const lock = useScrollLock();
  const H = 190;
  const top = 16;
  const bw = (width - 24) / labels.length;
  const toY = (v: number) => top + (1 - v / max) * (H - top);
  const active = useRef(-1);
  const origin = useRef({ x: 0, y: 0 });
  const ref = useRef(vals);
  ref.current = vals;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => editable,
        onMoveShouldSetPanResponder: () => editable,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          lock(true);
          const { locationX, locationY, pageX, pageY } = e.nativeEvent;
          origin.current = { x: pageX - locationX, y: pageY - locationY };
          active.current = Math.max(0, Math.min(labels.length - 1, Math.floor((locationX - 12) / bw)));
          upd(locationY);
        },
        onPanResponderMove: (e) => upd(e.nativeEvent.pageY - origin.current.y),
        onPanResponderRelease: () => lock(false),
        onPanResponderTerminate: () => lock(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editable, labels.length, bw],
  );
  function upd(py: number) {
    const i = active.current;
    if (i < 0) return;
    let v = ((H - py) / (H - top)) * max;
    v = Math.max(0, Math.min(max, Math.round(v / step) * step));
    if (v !== ref.current[i]) {
      const n = [...ref.current];
      n[i] = v;
      tick();
      setVals(n);
      onChange?.(n);
    }
  }
  const total = vals.reduce((a, b) => a + b, 0);
  const mean = total / vals.length;
  return (
    <View style={{ alignItems: 'center' }} {...pan.panHandlers}>
      <Svg width={width} height={H + 26}>
        {Array.from({ length: max + 1 }, (_, i) => i).filter((i) => max <= 12 || i % Math.ceil(max / 10) === 0).map((i) => (
          <Line key={i} x1={12} x2={width - 12} y1={toY(i)} y2={toY(i)} stroke={C.plotGrid} strokeWidth={1} />
        ))}
        {vals.map((v, i) => (
          <G key={i}>
            <Rect x={12 + i * bw + 4} y={toY(v)} width={bw - 8} height={H - toY(v)} rx={5} fill={color} />
            <SvgText x={12 + i * bw + bw / 2} y={toY(v) - 4} fill={C.text} fontSize={12} textAnchor="middle" fontFamily={F.black}>
              {String(v).replace('.', ',')}
            </SvgText>
            <SvgText x={12 + i * bw + bw / 2} y={H + 18} fill={C.textMuted} fontSize={11} textAnchor="middle" fontFamily={F.bold}>
              {labels[i]}
            </SvgText>
          </G>
        ))}
        {showMean && <Line x1={12} x2={width - 12} y1={toY(mean)} y2={toY(mean)} stroke={C.gold} strokeWidth={2.5} strokeDasharray="6 4" />}
      </Svg>
      {editable && <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 12 }}>☝️ Arraste as barras para cima/baixo</Text>}
    </View>
  );
}
