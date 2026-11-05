import React from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, alpha } from '../../theme';
import { findUnit } from '../../content';
import { RichText } from '../../components/math/RichText';
import { CardView } from '../../components/lesson/CardView';
import { useApp } from '../../state/store';
import { Button } from '../../components/ui/Button';

/** "Guia da unidade": summary + all theory cards for quick consultation. */
export default function UnitGuide() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const loc = findUnit(id!);
  const lessons = useApp((s) => s.lessons);
  if (!loc) return null;
  const { unit, section } = loc;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 2, borderColor: C.surface2 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: C.textMuted, fontSize: 24, fontFamily: F.black }}>←</Text>
        </Pressable>
        <Text style={{ color: C.text, fontFamily: F.black, fontSize: 18, marginLeft: 14, flex: 1 }} numberOfLines={1}>
          📖 Guia · {unit.title}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 50 }}>
        <View style={{ padding: 16, borderRadius: 20, backgroundColor: alpha(section.color, 0.14), borderWidth: 2, borderColor: alpha(section.color, 0.5), marginBottom: 18 }}>
          <Text style={{ fontSize: 36, color: C.text }}>{unit.icon}</Text>
          <Text style={{ color: section.color, fontFamily: F.black, fontSize: 22 }}>{unit.title}</Text>
          <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 14, marginBottom: 6 }}>{unit.subtitle}</Text>
          {unit.source ? <Text style={{ color: C.textDim, fontFamily: F.bold, fontSize: 12 }}>📚 Material: {unit.source}</Text> : null}
          {unit.extra ? <Text style={{ color: C.gold, fontFamily: F.bold, fontSize: 12, marginTop: 4 }}>✨ Tópico extra, adicionado para completar sua formação</Text> : null}
          {unit.guide ? (
            <View style={{ marginTop: 10 }}>
              <RichText size={15.5}>{unit.guide}</RichText>
            </View>
          ) : null}
        </View>
        {unit.lessons.map((l, i) => (
          <View key={l.id} style={{ marginBottom: 26 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: lessons[l.id] ? C.gold : section.color, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ color: C.bg, fontFamily: F.black }}>{lessons[l.id] ? '✓' : i + 1}</Text>
              </View>
              <Text style={{ color: C.text, fontFamily: F.black, fontSize: 19, flex: 1 }}>{l.title}</Text>
            </View>
            {l.cards.map((c, ci) => (
              <View key={ci} style={{ padding: 14, borderRadius: 18, backgroundColor: C.surface, marginBottom: 10 }}>
                <CardView card={c} width={width - 60} color={section.color} />
              </View>
            ))}
            <Button small title="Praticar esta lição" color={section.color} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: l.id } })} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
