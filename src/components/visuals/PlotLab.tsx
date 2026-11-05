import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { C, F } from '../../theme';
import { Plot, View2D } from '../plot/Plot';
import { Slider } from '../ui/Slider';
import { RichText } from '../math/RichText';

export type ParamSpec = { key: string; label?: string; min: number; max: number; step?: number; value: number; color?: string; format?: (v: number) => string };
export type DragSpec = { id: string; x: number; y: number; color?: string; label?: string; r?: number };
export type LabState = { p: Record<string, number>; pts: Record<string, { x: number; y: number }> };

export type PlotLabProps = {
  width: number;
  height?: number;
  view: View2D;
  equalAspect?: boolean;
  grid?: boolean;
  tickLabels?: boolean;
  params?: ParamSpec[];
  points?: DragSpec[];
  snap?: number; // snap dragged points to multiples of this
  constrain?: (id: string, x: number, y: number, s: LabState) => { x: number; y: number };
  render?: (s: LabState) => React.ReactNode;
  info?: (s: LabState) => string;
  caption?: string;
  onChange?: (s: LabState) => void;
  checked?: boolean | null;
  hidePoints?: (s: LabState) => string[];
};

/** Generic interactive plot: sliders + draggable points + custom render. */
export function PlotLab(props: PlotLabProps) {
  const { width, view, params = [], points = [], render, info, onChange, snap, constrain, caption } = props;
  const height = props.height ?? Math.round(width * 0.72);
  const [p, setP] = useState<Record<string, number>>(() => Object.fromEntries(params.map((q) => [q.key, q.value])));
  const [pts, setPts] = useState<Record<string, { x: number; y: number }>>(() => Object.fromEntries(points.map((q) => [q.id, { x: q.x, y: q.y }])));
  const stateRef = useRef<LabState>({ p, pts });
  stateRef.current = { p, pts };

  const emit = useCallback((s: LabState) => onChange?.(s), [onChange]);

  const onDrag = useCallback(
    (id: string, x: number, y: number) => {
      let nx = x;
      let ny = y;
      if (snap) {
        nx = Math.round(nx / snap) * snap;
        ny = Math.round(ny / snap) * snap;
      }
      if (constrain) {
        const c = constrain(id, nx, ny, stateRef.current);
        nx = c.x;
        ny = c.y;
      }
      const cur = stateRef.current.pts[id];
      if (cur && Math.abs(cur.x - nx) < 1e-9 && Math.abs(cur.y - ny) < 1e-9) return;
      const next = { ...stateRef.current.pts, [id]: { x: nx, y: ny } };
      setPts(next);
      emit({ p: stateRef.current.p, pts: next });
    },
    [snap, constrain, emit],
  );

  const s: LabState = { p, pts };
  const hidden = props.hidePoints ? props.hidePoints(s) : [];
  const draggables = points.map((d) => ({ ...d, x: pts[d.id].x, y: pts[d.id].y, hidden: hidden.includes(d.id) }));
  const infoText = info ? info(s) : '';
  return (
    <View style={{ alignItems: 'center' }}>
      <Plot
        width={width}
        height={height}
        {...view}
        equalAspect={props.equalAspect}
        grid={props.grid ?? true}
        tickLabels={props.tickLabels ?? true}
        draggables={draggables.length ? draggables : undefined}
        onDrag={draggables.length ? onDrag : undefined}
      >
        {render ? render(s) : null}
      </Plot>
      {caption ? <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 12, marginTop: 6 }}>{caption}</Text> : null}
      {points.length > 0 ? <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 12, marginTop: 4 }}>☝️ Arraste os pontos coloridos</Text> : null}
      {params.length > 0 && (
        <View style={{ alignSelf: 'stretch', marginTop: 6 }}>
          {params.map((q) => (
            <Slider
              key={q.key}
              label={q.label ?? q.key}
              min={q.min}
              max={q.max}
              step={q.step ?? 0.1}
              value={p[q.key]}
              color={q.color ?? C.primary}
              format={q.format}
              onChange={(v) => {
                const next = { ...stateRef.current.p, [q.key]: v };
                setP(next);
                emit({ p: next, pts: stateRef.current.pts });
              }}
            />
          ))}
        </View>
      )}
      {infoText ? (
        <View style={{ alignSelf: 'stretch', marginTop: 8, padding: 12, borderRadius: 14, backgroundColor: C.surface2 }}>
          <RichText size={15} align="center">
            {infoText}
          </RichText>
        </View>
      ) : null}
    </View>
  );
}
