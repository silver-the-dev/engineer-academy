import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';
import { applyEdit, defaults, makeValue } from '../../lib/circuit';
import type { CircuitSpec, CircuitValue, Comp, Pt } from '../../lib/circuit';
import { C, F, R } from '../../theme';
import { useScrollLock } from '../ScrollLock';
import { CurrentLayer } from '../circuit/CurrentLayer';
import { Action, Meter, Palette, styles } from '../circuit/Controls';
import { Labels, labelsFor } from '../circuit/Labels';
import { allTypes, engineering, gridFor, hitPart, isAnchored, names, nearest, paletteItem, pixel, terminals } from '../circuit/model';
import { Scope } from '../circuit/Scope';
import { Symbol } from '../circuit/Symbols';
import { useSimulation } from '../circuit/useSimulation';

export type CircuitSimProps = CircuitSpec & { width: number; onChange?: (v: CircuitValue) => void; checked?: boolean | null };

export function CircuitSim(props: CircuitSimProps) {
  const { comps: initial, width, mode = 'adjust', palette = allTypes, onChange, checked, scope, caption, timeScale } = props;
  const [comps, setComps] = useState(() => applyEdit(initial, {}));
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<number | null>(null);
  const [history, setHistory] = useState<Comp[][]>([]);
  const [drag, setDrag] = useState<{ a: Pt; b: Pt } | null>(null);
  const [notice, setNotice] = useState('');
  const lock = useScrollLock();
  const count = useRef(0);
  const canvasWidth = Math.max(1, width - 2);
  // Keep the coordinate system fixed as the user builds or deletes parts.
  const grid = useMemo(() => gridFor({ comps: initial, cols: props.cols, rows: props.rows }, canvasWidth), [initial, props.cols, props.rows, canvasWidth]);
  const sim = useSimulation(comps, scope, timeScale);
  const { solution } = sim;
  const labelData = useMemo(() => labelsFor(comps, solution, grid), [comps, solution, grid]);
  const maxV = Math.max(1e-9, ...solution.nodeV.map(Math.abs));
  const part = comps.find(c => c.id === selected);
  const latest = useRef({ comps, tool, palette, mode, grid, history, onChange });
  latest.current = { comps, tool, palette, mode, grid, history, onChange };
  const gesture = useRef<{ origin: Pt; page: Pt; start: Pt; end: Pt; drawing: boolean } | null>(null);

  useEffect(() => {
    setComps(applyEdit(initial, {})); setSelected(null); setHistory([]); setTool(null); setNotice('');
  }, [initial]);
  useEffect(() => () => lock(false), [lock]);

  const commit = (next: Comp[], saveHistory = true) => {
    const current = latest.current;
    if (JSON.stringify(next) === JSON.stringify(current.comps)) return;
    if (saveHistory) setHistory(h => [...h.slice(-59), current.comps]);
    latest.current.comps = next;
    setComps(next); setNotice('');
    // Called only from completed user edits, never from simulation, selection or mount.
    current.onChange?.(makeValue(next));
  };
  const tap = (point: Pt) => {
    const current = latest.current, c = hitPart(current.comps, point, current.grid);
    setSelected(c?.id ?? null);
    if (c && !c.fixed && (c.type === 'switch' || c.type === 'input')) {
      commit(applyEdit(current.comps, { on: { [c.id]: !c.on } }));
    }
  };
  const place = (a: Pt, b: Pt) => {
    const current = latest.current;
    if (current.mode !== 'build' || current.tool === null) return;
    const raw = current.palette[current.tool];
    if (!raw) return;
    const item = paletteItem(raw), type = item.type;
    if (item.max !== undefined && current.comps.filter(c => c.type === type).length >= item.max) { setNotice('Limite desta ferramenta atingido.'); return; }
    if (!isAnchored(type) && a[0] === b[0] && a[1] === b[1]) { setNotice('Arraste de um ponto da grade até outro.'); return; }
    const pts = terminals(type, a, b);
    if (pts.some(([x, y]) => x < grid.x || y < grid.y || x > grid.x + grid.cols || y > grid.y + grid.rows)) { setNotice('A peça precisa caber inteira na grade.'); return; }
    if (type === 'wire' && current.comps.some(c => c.type === 'wire' && (JSON.stringify(c.pts) === JSON.stringify(pts) || JSON.stringify(c.pts) === JSON.stringify([...pts].reverse())))) {
      setNotice('Já existe um fio entre estes pontos.'); return;
    }
    let id: string;
    do { id = `${type}-${++count.current}`; } while (current.comps.some(c => c.id === id));
    const added: Comp = { ...defaults(type), id, type, pts, ...(item.value !== undefined && { value: item.value }),
      ...(item.color && { color: item.color }), ...(item.fixed !== undefined && { fixed: item.fixed }), ...(item.label && { label: item.label }) };
    commit(applyEdit(current.comps, { add: [added] }));
    setSelected(id);
  };
  const handlers = useRef({ tap, place }); handlers.current = { tap, place };
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: e => {
      const s = latest.current;
      return s.mode === 'build' && s.tool !== null || !!hitPart(s.comps, [e.nativeEvent.locationX, e.nativeEvent.locationY], s.grid);
    },
    onMoveShouldSetPanResponder: () => false,
    onPanResponderTerminationRequest: () => !gesture.current?.drawing,
    onPanResponderGrant: e => {
      const { locationX, locationY, pageX, pageY } = e.nativeEvent;
      const s = latest.current, point: Pt = [locationX, locationY], at = nearest(point, s.grid);
      const drawing = s.mode === 'build' && s.tool !== null;
      gesture.current = { origin: point, page: [pageX, pageY], start: at, end: at, drawing };
      if (drawing) { lock(true); setDrag({ a: at, b: at }); }
    },
    onPanResponderMove: e => {
      const g = gesture.current;
      if (!g?.drawing) return;
      const end = nearest([g.origin[0] + e.nativeEvent.pageX - g.page[0], g.origin[1] + e.nativeEvent.pageY - g.page[1]], latest.current.grid);
      g.end = end; setDrag({ a: g.start, b: end });
    },
    onPanResponderRelease: (e, state) => {
      const g = gesture.current;
      gesture.current = null; setDrag(null); lock(false);
      if (!g) return;
      if (g.drawing) handlers.current.place(g.start, g.end);
      else if (Math.hypot(state.dx, state.dy) < 8) handlers.current.tap(g.origin);
    },
    onPanResponderTerminate: () => { gesture.current = null; setDrag(null); lock(false); },
  }), [lock]);
  const burnt = comps.filter(c => solution.comp[c.id]?.burnt);
  const hasSource = comps.some(c => ['vsrc', 'acsrc', 'isrc', 'clock', 'input'].includes(c.type));
  const incomplete = hasSource && solution.ok && !comps.some(c => Math.abs(solution.comp[c.id]?.i ?? 0) > 1e-8);
  const errorText = solution.error === 'short' ? '⚡ Curto-circuito!' : solution.error === 'singular' ? 'Fontes incompatíveis ou circuito singular.'
    : solution.error === 'noconv' ? 'A simulação não convergiu. Revise as ligações.' : solution.error === 'empty' ? 'Escolha uma ferramenta para começar.' : incomplete ? 'Circuito incompleto · nenhuma corrente circula.' : '';
  const currentTool = tool === null ? null : palette[tool] && paletteItem(palette[tool]);
  const dragA = drag && pixel(drag.a, grid), dragB = drag && pixel(drag.b, grid);
  const height = grid.rows * grid.cell;
  const webGestureStyle: ViewStyle & { touchAction?: string } = Platform.OS === 'web' ? { touchAction: currentTool ? 'none' : 'pan-y' } : {};

  return <View style={{ width, backgroundColor: C.surface, borderRadius: R.md, overflow: 'hidden', borderWidth: 1, borderColor: checked == null ? C.border : checked ? C.success : C.danger }}>
    <View style={[styles.row, { padding: 10, justifyContent: 'space-between', flexWrap: 'wrap' }]}>
      <Text style={{ color: C.cyan, fontFamily: F.heavy, fontSize: 11, letterSpacing: 1 }}>CIRCUIT LAB · {mode === 'view' ? 'OBSERVAR' : mode === 'build' ? 'MONTAR' : 'AJUSTAR'}</Text>
      <Text style={styles.small}>● +V <Text style={{ color: C.success }}>verde</Text> · −V <Text style={{ color: C.danger }}>vermelho</Text></Text>
    </View>
    {mode === 'build' && <>
      <Palette items={palette} comps={comps} tool={tool} setTool={setTool} />
      <View style={[styles.row, { paddingHorizontal: 10, marginBottom: 8, flexWrap: 'wrap' }]}>
        <Action title="↶ Desfazer" disabled={!history.length} onPress={() => { const prev = history[history.length - 1]; if (prev) { commit(prev, false); setHistory(h => h.slice(0, -1)); setSelected(null); } }} />
        <Action title="Limpar" disabled={JSON.stringify(comps) === JSON.stringify(initial)} onPress={() => { commit(applyEdit(initial, {})); setSelected(null); sim.restart(); }} />
      </View>
      <Text style={[styles.small, { paddingHorizontal: 12, paddingBottom: 8 }]}>{currentTool ? `${names[currentTool.type]}: ${isAnchored(currentTool.type) ? 'toque no ponto âncora.' : 'arraste entre dois pontos.'}` : 'Toque numa peça para medir. Escolha uma ferramenta para montar.'}</Text>
    </>}
    <View style={[{ width: canvasWidth, height }, webGestureStyle]} {...pan.panHandlers} accessible={false}>
      <Svg pointerEvents="none" width={canvasWidth} height={height} viewBox={`0 0 ${canvasWidth} ${height}`}>
        <G fill={C.plotAxis} opacity={drag ? 0.65 : 0.3}>{Array.from({ length: grid.rows + 1 }, (_, y) => Array.from({ length: grid.cols + 1 }, (_, x) => <Circle key={`${x},${y}`} cx={x * grid.cell} cy={y * grid.cell} r={drag ? 2 : 1} />))}</G>
        {comps.map(c => <Symbol key={c.id} c={c} grid={grid} state={solution.comp[c.id]} solution={solution} max={maxV} selected={selected === c.id} />)}
        <CurrentLayer comps={comps} solution={solution} grid={grid} running={sim.active && !sim.paused} />
        <Labels labels={labelData.labels} />
        {dragA && dragB && <G stroke={C.cyan} fill={C.cyan}><Line x1={dragA[0]} y1={dragA[1]} x2={dragB[0]} y2={dragB[1]} strokeWidth={3} strokeDasharray="4 4" /><Circle cx={dragA[0]} cy={dragA[1]} r={5} /><Circle cx={dragB[0]} cy={dragB[1]} r={8} fillOpacity={0.25} strokeWidth={2} /></G>}
      </Svg>
    </View>
    {labelData.overflow.length > 0 && <View style={{ padding: 10, gap: 4 }}>{labelData.overflow.map(l => <Action key={l.id} title={l.text} onPress={() => setSelected(l.id)} />)}</View>}
    {/* Accessible component picker also disambiguates crossing wires and crowded nodes. */}
    <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}><Text style={styles.small}>Medir peça</Text>
      <PalettePicker comps={comps} selected={selected} select={setSelected} />
    </View>
    {(errorText || burnt.length > 0 || notice) && <View accessibilityLiveRegion="polite" style={{ backgroundColor: solution.error && solution.error !== 'empty' || burnt.length ? C.dangerBg : C.surface2, padding: 12, gap: 4 }}>
      {!!errorText && <Text style={{ color: solution.error && solution.error !== 'empty' ? C.danger : C.gold, fontFamily: F.bold, fontSize: 13 }}>{errorText}</Text>}
      {burnt.map(c => <Text key={c.id} style={{ color: C.danger, fontFamily: F.bold, fontSize: 13 }}>💥 LED {c.label ?? c.id} queimado · reduza a corrente.</Text>)}
      {!!notice && <Text style={{ color: C.gold, fontFamily: F.bold, fontSize: 13 }}>{notice}</Text>}
    </View>}
    {part && <Meter part={part} solution={solution} mode={mode} edit={value => { if (!part.fixed && mode !== 'view') commit(applyEdit(comps, { set: { [part.id]: value } })); }} remove={() => { if (!part.locked && mode === 'build') { commit(applyEdit(comps, { remove: [part.id] })); setSelected(null); } }} close={() => setSelected(null)} toggle={() => { if (!part.fixed) commit(applyEdit(comps, { on: { [part.id]: !part.on } })); }} />}
    {sim.dynamic && <View style={{ padding: 10, gap: 8 }}>
      <View style={[styles.row, { flexWrap: 'wrap' }]}><Action title={sim.paused ? '▶ Iniciar' : '⏸ Pausar'} onPress={() => sim.setPaused(p => !p)} /><Action title="↺ Reiniciar" onPress={sim.restart} />
        <Text style={styles.small}>t = {engineering(solution.t, 's')}</Text></View>
      <Text style={styles.small}>{engineering(sim.scale, 's')} simulados por segundo real{sim.limited ? ' · velocidade limitada pelo dispositivo' : ''}</Text>
    </View>}
    {scope && <Scope width={canvasWidth} spec={scope} samples={sim.samples} window={sim.window} t={solution.t} />}
    {!!caption && <Text style={{ color: C.textMuted, fontFamily: F.regular, fontSize: 12, padding: 12 }}>{caption}</Text>}
    {checked != null && <Text accessibilityLiveRegion="polite" style={{ color: checked ? C.success : C.danger, fontFamily: F.bold, padding: 10 }}>{checked ? '✓ Circuito correto' : 'Revise o circuito'}</Text>}
  </View>;
}

function PalettePicker({ comps, selected, select }: { comps: Comp[]; selected: string | null; select: (id: string) => void }) {
  // A wrapping list avoids hidden controls for assistive technology and needs no hover.
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>{comps.filter(c => c.type !== 'wire' || c.label).map(c => <Action key={c.id} title={c.label ?? c.id} label={`Medir ${names[c.type]} ${c.label ?? c.id}`} active={selected === c.id} onPress={() => select(c.id)} />)}</View>;
}
