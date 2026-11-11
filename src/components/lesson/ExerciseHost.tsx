import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { C, F } from '../../theme';
import type { Exercise } from '../../content/types';
import { RichText } from '../math/RichText';
import { Visual } from '../visuals/registry';
import { CheckResult } from '../exercises/common';
import { FillView, InteractiveView, MCQView, MatchView, MultiView, NumericView, OrderView, TFView } from '../exercises/Exercises';
import { useLayoutProbe } from './LayoutProbe';

const KIND_LABEL: Record<Exercise['kind'], string> = {
  mcq: 'ESCOLHA A RESPOSTA',
  multi: 'MÚLTIPLA SELEÇÃO',
  numeric: 'CALCULE',
  tf: 'VERDADEIRO OU FALSO?',
  match: 'LIGUE OS PARES',
  order: 'ORDENE OS PASSOS',
  fill: 'COMPLETE',
  interactive: 'INTERAJA',
};

export function ExerciseHost({
  ex,
  locked,
  onReady,
  checkRef,
  width,
  retry,
}: {
  ex: Exercise;
  locked: boolean;
  onReady: (r: boolean) => void;
  checkRef: React.MutableRefObject<(() => CheckResult) | null>;
  width: number;
  retry?: boolean;
}) {
  const onLayout = useLayoutProbe('exercise');
  const registerCheck = useCallback((fn: () => CheckResult) => {
    checkRef.current = fn;
  }, [checkRef]);
  const common = { locked, onReady, registerCheck, width };
  let body: React.ReactNode = null;
  switch (ex.kind) {
    case 'mcq':
      body = <MCQView ex={ex} {...common} />;
      break;
    case 'multi':
      body = <MultiView ex={ex} {...common} />;
      break;
    case 'numeric':
      body = <NumericView ex={ex} {...common} />;
      break;
    case 'tf':
      body = <TFView ex={ex} {...common} />;
      break;
    case 'match':
      body = <MatchView ex={ex} {...common} />;
      break;
    case 'order':
      body = <OrderView ex={ex} {...common} />;
      break;
    case 'fill':
      body = <FillView ex={ex} {...common} />;
      break;
    case 'interactive':
      body = <InteractiveView ex={ex} {...common} />;
      break;
  }
  return (
    <View onLayout={onLayout}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: ex.kind === 'interactive' ? C.gold : C.primary, fontFamily: F.black, fontSize: 13, letterSpacing: 1.2 }}>
          {ex.kind === 'interactive' ? '✨ ' : ''}
          {KIND_LABEL[ex.kind]}
        </Text>
        {retry ? <Text style={{ color: C.fire, fontFamily: F.black, fontSize: 12, marginLeft: 10 }}>↻ REVISÃO DE ERRO</Text> : null}
      </View>
      <RichText size={ex.kind === 'tf' ? 20 : 19} style={{ marginBottom: 14 }}>
        {ex.prompt}
      </RichText>
      {ex.visual ? (
        <View style={{ marginBottom: 14 }}>
          <Visual spec={ex.visual} width={width} />
        </View>
      ) : null}
      {body}
    </View>
  );
}
