import React from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { C, F, alpha } from '../../theme';

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

/** Source code listing (C, Arduino…): monospaced, numbered, scrolls sideways, optional highlighted lines (1-based). */
export function CodeBlock({ code, highlight = [], title, width }: { code: string; highlight?: number[]; title?: string; width: number }) {
  const lines = code.replace(/\t/g, '  ').replace(/^\n+|\s+$/g, '').split('\n');
  const digits = String(lines.length).length;
  return (
    <View style={{ width, borderRadius: 14, borderWidth: 2, borderColor: C.border, backgroundColor: C.bgDeep, overflow: 'hidden' }}>
      {title ? (
        <Text style={{ color: C.textMuted, fontFamily: F.heavy, fontSize: 11, letterSpacing: 1, paddingHorizontal: 12, paddingTop: 8 }}>{title.toUpperCase()}</Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
        <View>
          {lines.map((line, k) => {
            const on = highlight.includes(k + 1);
            return (
              <View key={k} style={{ flexDirection: 'row', paddingHorizontal: 12, backgroundColor: on ? alpha(C.gold, 0.16) : 'transparent' }}>
                <Text style={{ fontFamily: MONO, fontSize: 13, lineHeight: 20, color: on ? C.gold : C.textDim, width: digits * 9 + 10 }}>{k + 1}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 13, lineHeight: 20, color: C.text }}>{line || ' '}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
