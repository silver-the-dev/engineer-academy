import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SECTIONS } from '../content';
import { runContentQA } from '../lib/qa';
import { C, F } from '../theme';

/** Internal QA screen: validates every TeX snippet and exercise structure (same check as `node scripts/qa-content.cjs`). */
export default function Debug() {
  const report = useMemo(() => runContentQA(SECTIONS), []);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: C.text, fontFamily: F.black, fontSize: 20 }}>QA de conteúdo</Text>
      <Text nativeID="qa-summary" style={{ color: C.textMuted, fontFamily: F.bold, marginVertical: 8 }}>
        {`lições=${report.nLessons} partes=${report.nParts} exercícios=${report.nItems} (testados=${report.nEx}) fórmulas=${report.nTex} erros=${report.errors.length} avisos=${report.warnings.length}`}
      </Text>
      {report.bySection.map((s) => (
        <Text key={s} style={{ color: C.text, fontFamily: F.semibold, fontSize: 12 }}>
          {s}
        </Text>
      ))}
      {report.errors.map((e, i) => (
        <View key={i} style={{ paddingVertical: 4, borderBottomWidth: 1, borderColor: C.surface2 }}>
          <Text style={{ color: C.danger, fontFamily: F.semibold, fontSize: 12 }}>{e}</Text>
        </View>
      ))}
      {report.warnings.map((e, i) => (
        <View key={'w' + i} style={{ paddingVertical: 4, borderBottomWidth: 1, borderColor: C.surface2 }}>
          <Text style={{ color: C.gold, fontFamily: F.semibold, fontSize: 12 }}>{e}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
