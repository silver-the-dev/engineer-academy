import React, { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircuitSim } from '../components/visuals/CircuitSim';
import { Action, styles } from '../components/circuit/Controls';
import { examples } from '../components/circuit/examples';
import { allTypes } from '../components/circuit/model';
import { CircuitActivity } from '../components/circuit/Activity';
import { ScrollLockProvider, useScrollLockState } from '../components/ScrollLock';
import { C, F } from '../theme';

export default function Lab() {
  const { width } = useWindowDimensions();
  const [locked, setLocked] = useScrollLockState();
  const focused = useIsFocused();
  const [example, setExample] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const selected = examples.find(e => e.id === example);
  const widgetWidth = Math.min(width - 24, 640);
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
    <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}><Action title="‹ Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
      <Text style={{ color: C.text, fontFamily: F.heavy, fontSize: 20, flex: 1 }}>Laboratório</Text></View>
    <ScrollLockProvider setLocked={setLocked}>
      <ScrollView scrollEnabled={!locked} contentContainerStyle={{ padding: 12, alignItems: 'center', gap: 16, paddingBottom: 40 }}>
        <View style={{ width: widgetWidth, gap: 8 }}><Text style={{ color: C.textMuted, fontFamily: F.regular, fontSize: 14 }}>Monte, meça e experimente. Escolha uma peça e arraste entre os pontos. Para conectar um fio no meio de outro, divida-o em dois fios.</Text>
          <Text style={styles.name}>{selected?.title ?? 'Circuito livre'}</Text></View>
        <CircuitActivity.Provider value={focused}><CircuitSim key={`${example ?? 'empty'}-${revision}`} {...selected?.spec} comps={selected?.spec.comps ?? EMPTY} cols={9} rows={12} mode="build" palette={allTypes} width={widgetWidth} /></CircuitActivity.Provider>
        <View style={{ width: widgetWidth, gap: 10 }}><Text style={styles.name}>Exemplos prontos</Text>
          <Text style={styles.small}>Escolher um exemplo abre uma nova montagem.</Text>
          <Action title="＋ Nova montagem vazia" onPress={() => { setExample(null); setRevision(r => r + 1); }} />
          {examples.map(e => <Action key={e.id} title={e.title} active={e.id === example} onPress={() => { setExample(e.id); setRevision(r => r + 1); }} />)}
        </View>
      </ScrollView>
    </ScrollLockProvider>
  </SafeAreaView>;
}
const EMPTY: [] = [];
