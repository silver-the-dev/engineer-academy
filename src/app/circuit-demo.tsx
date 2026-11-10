import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircuitSim } from '../components/visuals/CircuitSim';
import { Action } from '../components/circuit/Controls';
import { demoExamples, demoTypes } from '../components/circuit/examples';
import type { Example } from '../components/circuit/examples';
import { CircuitActivity } from '../components/circuit/Activity';
import { ScrollLockProvider, useScrollLockState } from '../components/ScrollLock';
import { C, F } from '../theme';

export default function CircuitDemo() {
  const { width } = useWindowDimensions(), widgetWidth = Math.min(width - 24, 640);
  const [locked, setLocked] = useScrollLockState();
  const focused = useIsFocused();
  const [visible, setVisible] = useState<string[]>([demoExamples[0].id]);
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: { item: Example }[] }) => setVisible(viewableItems.map(v => v.item.id)), []);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 1, minimumViewTime: 100 }).current;
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
    <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Action title="‹ Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
      <Text style={{ color: C.text, fontFamily: F.heavy, fontSize: 20 }}>Galeria de circuitos</Text></View>
    <ScrollLockProvider setLocked={setLocked}>
      <FlatList data={demoExamples} keyExtractor={e => e.id} scrollEnabled={!locked} initialNumToRender={2} maxToRenderPerBatch={2} windowSize={3}
        extraData={[visible, focused]} viewabilityConfig={viewabilityConfig} onViewableItemsChanged={onViewableItemsChanged}
        contentContainerStyle={{ padding: 12, gap: 24, alignSelf: 'center', width: widgetWidth + 24, paddingBottom: 40 }}
        ListHeaderComponent={<View style={{ gap: 8 }}><Text style={{ color: C.textMuted, fontFamily: F.regular }}>{demoTypes.length} tipos de peça · modos observar, ajustar e montar. Toque para medir; nas chaves e entradas, toque para alternar.</Text><Action title="Abrir laboratório livre" onPress={() => router.push('/lab')} /></View>}
        renderItem={({ item }) => <View style={{ gap: 10 }}><Text style={{ color: C.text, fontFamily: F.heavy, fontSize: 17 }}>{item.title}</Text><CircuitActivity.Provider value={focused && visible.includes(item.id)}><CircuitSim {...item.spec} width={widgetWidth} /></CircuitActivity.Provider></View>} />
    </ScrollLockProvider>
  </SafeAreaView>;
}
