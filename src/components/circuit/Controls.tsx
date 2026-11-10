import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F, R } from '../../theme';
import type { Comp, CompType, PaletteItem, Solution } from '../../lib/circuit';
import { defaults } from '../../lib/circuit';
import { Slider } from '../ui/Slider';
import { engineering, limits, names, paletteItem, partValue, sliderMap, stepValue, units } from './model';

export function Action({ title, onPress, disabled = false, active = false, danger = false, label }: {
  title: string; onPress: () => void; disabled?: boolean; active?: boolean; danger?: boolean; label?: string;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label ?? title} accessibilityState={{ disabled, selected: active }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: active ? C.primaryDark : C.surface2, opacity: disabled ? 0.35 : pressed ? 0.7 : 1, borderColor: active ? C.primary : C.border }]}>
    <Text style={[styles.buttonText, { color: danger ? C.danger : C.text }]}>{title}</Text>
  </Pressable>;
}
export const icons: Record<CompType, string> = {
  wire: '─', resistor: '⌁', lamp: '☼', switch: '⏣', vsrc: '⊣', acsrc: '∿', isrc: '↑', clock: '▁▔',
  capacitor: '╫', inductor: '∿∿', diode: '▷│', led: '↗', zener: '▷┤', npn: '↘', pnp: '↖', nmos: '⊢',
  opamp: '▷', ground: '⏚', input: '▣', output: '◉', and: '∧', or: '∨', not: '¬', nand: '⊼', nor: '⊽', xor: '⊕', xnor: '⊙', dff: 'D', voltmeter: 'Ⓥ', ammeter: 'Ⓐ',
};
export function Palette({ items, comps, tool, setTool }: { items: (PaletteItem | CompType)[]; comps: Comp[]; tool: number | null; setTool: (i: number | null) => void }) {
  return <View style={{ paddingVertical: 8 }}>
    <Text style={styles.eyebrow}>FERRAMENTAS · deslize a paleta</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 6, paddingHorizontal: 10, paddingBottom: 6 }}>
      <Action title="☝ Medir" active={tool === null} onPress={() => setTool(null)} />
      {items.map((p, k) => {
        const item = paletteItem(p), remaining = item.max === undefined ? undefined : Math.max(0, item.max - comps.filter(c => c.type === item.type).length);
        return <Action key={k} active={tool === k} disabled={remaining === 0} title={`${icons[item.type]} ${item.label ?? names[item.type]}${remaining === undefined ? '' : ` · ${remaining}`}`} onPress={() => setTool(k)} />;
      })}
    </ScrollView>
  </View>;
}
export function Meter({ part, solution, mode, edit, remove, close, toggle }: {
  part: Comp; solution: Solution; mode: string; edit: (value: number) => void; remove: () => void; close: () => void; toggle: () => void;
}) {
  const state = solution.comp[part.id];
  const canEdit = mode !== 'view' && !part.fixed && !!units[part.type];
  const map = sliderMap(part), [min, max] = limits(part);
  const value = part.value ?? defaults(part.type).value ?? 0;
  return <View style={styles.meter}>
    <View style={styles.row}>
      <View style={{ flex: 1 }}><Text style={styles.name}>{part.label ?? part.id} · {names[part.type]}</Text>
        <Text style={styles.value}>{partValue(part)}{part.fixed ? ' · valor fixo' : ''}{part.locked ? ' · posição protegida' : ''}</Text></View>
      <Action title="×" label="Fechar multímetro" onPress={close} />
    </View>
    <View style={[styles.row, { marginVertical: 12 }]}>
      {(['v', 'i', 'p'] as const).map(k => <View key={k} style={styles.readout}>
        <Text style={styles.small}>{({ v: 'Tensão', i: 'Corrente', p: 'Potência' })[k]}</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.reading}>{engineering(state?.[k] ?? 0, { v: 'V', i: 'A', p: 'W' }[k])}</Text>
      </View>)}
    </View>
    {(part.type === 'acsrc' || part.type === 'clock') && <Text style={styles.small}>{engineering(part.freq ?? 60, 'Hz')}{part.type === 'acsrc' ? ' · amplitude de pico' : ''}</Text>}
    {canEdit && <>
      <View style={styles.row}><Action title="−" label={`Diminuir ${part.id}`} disabled={stepValue(part, -1) >= value} onPress={() => edit(stepValue(part, -1))} />
        <Text style={[styles.value, { flex: 1, textAlign: 'center' }]}>{part.values ? 'Valores disponíveis' : 'Série E12'}</Text>
        <Action title="+" label={`Aumentar ${part.id}`} disabled={stepValue(part, 1) <= value} onPress={() => edit(stepValue(part, 1))} /></View>
      <Slider value={map.position(value)} min={0} max={1} step={0.001} disabled={min >= max} onChange={n => edit(map.value(n))} format={() => part.hidden ? '?' : engineering(value, units[part.type])} />
      <Text style={styles.small}>Escala logarítmica · {engineering(min, units[part.type])} a {engineering(max, units[part.type])}</Text>
    </>}
    {(part.type === 'switch' || part.type === 'input') && <Action title={part.fixed ? 'Estado fixo' : part.on ? 'Desligar' : 'Ligar'} disabled={part.fixed} onPress={toggle} />}
    {mode === 'build' && <View style={{ marginTop: 10 }}><Action title={part.locked ? 'Peça protegida' : 'Apagar peça'} danger disabled={part.locked} onPress={remove} /></View>}
    {part.pts.length > 2 && <Text style={[styles.small, { marginTop: 10 }]}>Pinos: {part.pts.map((p, k) => `${k + 1}: ${engineering(solution.nodeV[solution.nodeAt(p)] ?? 0, 'V')}`).join(' · ')}</Text>}
  </View>;
}
export const styles = StyleSheet.create({
  button: { minWidth: 44, minHeight: 44, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 10, borderRadius: R.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: F.bold, fontSize: 13, flexShrink: 1, textAlign: 'center' },
  eyebrow: { fontFamily: F.heavy, fontSize: 10, color: C.textDim, letterSpacing: 1, paddingHorizontal: 12, marginBottom: 8 },
  meter: { backgroundColor: C.bgDeep, borderTopWidth: 1, borderColor: C.border, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: C.text, fontFamily: F.heavy, fontSize: 15 },
  value: { color: C.cyan, fontFamily: F.bold, fontSize: 13, marginVertical: 4 },
  small: { color: C.textMuted, fontFamily: F.regular, fontSize: 11 },
  readout: { flex: 1, backgroundColor: C.surface, padding: 8, borderRadius: R.sm, minHeight: 54 },
  reading: { color: C.success, fontFamily: F.heavy, fontSize: 15, marginTop: 5 },
});
