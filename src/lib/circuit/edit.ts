import type { Comp, CompType, Edit } from './types';

/** Clone nested authoring data too, so an editor can safely modify the result. */
export function applyEdit(comps: Comp[], edit: Edit): Comp[] {
  return [...comps.filter((c) => !edit.remove?.includes(c.id)), ...(edit.add ?? [])].map((c) => ({
    ...c,
    pts: c.pts.map(([x, y]) => [x, y]),
    ...(c.rails && { rails: [...c.rails] }),
    ...(c.values && { values: [...c.values] }),
    ...(c.show && { show: [...c.show] }),
    ...(edit.set && Object.hasOwn(edit.set, c.id) && { value: edit.set[c.id] }),
    ...(edit.on && Object.hasOwn(edit.on, c.id) && { on: edit.on[c.id] }),
  }));
}

export function defaults(type: CompType): Partial<Comp> {
  switch (type) {
    case 'resistor': return { value: 1000 };
    case 'lamp': return { value: 60, rated: 0.6 };
    case 'vsrc': return { value: 5 };
    case 'acsrc': return { value: 10, freq: 60, phase: 0, offset: 0 };
    case 'isrc': return { value: 0.01 };
    case 'clock': return { value: 5, freq: 1 };
    case 'capacitor': return { value: 1e-6, ic: 0 };
    case 'inductor': return { value: 0.01, ic: 0 };
    case 'diode': return { vf: 0.7 };
    case 'led': return { color: 'red', imax: 0.03 };
    case 'zener': return { value: 5.1, vf: 0.7 };
    case 'npn': case 'pnp': return { beta: 100, vf: 0.7 };
    case 'nmos': return { vth: 2, k: 0.5 };
    case 'opamp': return { rails: [-15, 15] };
    case 'switch': case 'input': return { on: false };
    default: return {};
  }
}
