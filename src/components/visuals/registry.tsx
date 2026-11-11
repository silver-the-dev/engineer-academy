import React from 'react';
import { Text } from 'react-native';
import { C } from '../../theme';
import { PlotLab } from './PlotLab';
import { CodeBlock } from './Code';
import { CLab, CodePuzzle } from './CPractice';
import { CircuitSim } from './CircuitSim';
import { Space3D } from './Space3D';
import { Bars, NumberLine, Simulator, Stepper, TableView, Venn } from './Misc';
import type { VisualSpec } from '../../content/types';

const REGISTRY: Record<string, React.ComponentType<any>> = {
  circuit: CircuitSim,
  plot: PlotLab,
  code: CodeBlock,
  'c-lab': CLab,
  'code-puzzle': CodePuzzle,
  space3d: Space3D,
  stepper: Stepper,
  table: TableView,
  simulator: Simulator,
  venn: Venn,
  numberline: NumberLine,
  bars: Bars,
};

export function renderWidget(name: string, props: Record<string, any>): React.ReactNode {
  if (name === 'custom' && props.component) {
    const Comp = props.component as React.ComponentType<any>;
    return <Comp {...props} />;
  }
  const Comp = REGISTRY[name];
  if (!Comp) return <Text style={{ color: C.danger }}>Widget desconhecido: {name}</Text>;
  return <Comp {...props} />;
}

export function Visual({ spec, width }: { spec: VisualSpec; width: number }) {
  return <>{renderWidget(spec.name, { ...(spec.props ?? {}), width, height: spec.height ?? spec.props?.height })}</>;
}
