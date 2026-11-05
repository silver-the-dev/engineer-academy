import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { C, F, alpha } from '../../theme';
import { useApp } from '../../state/store';
import { TopBar } from '../../components/ui/TopBar';
import { Button } from '../../components/ui/Button';
import { SECTIONS } from '../../content';

export default function PracticeScreen() {
  const mistakes = useApp((s) => s.mistakes);
  const lessons = useApp((s) => s.lessons);
  const nMistakes = Object.keys(mistakes).length;
  const doneCount = Object.keys(lessons).length;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar left={<Text style={{ color: C.text, fontFamily: F.black, fontSize: 22 }}>Treinar</Text>} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ padding: 18, borderRadius: 22, backgroundColor: alpha(C.cyan, 0.12), borderWidth: 2, borderColor: alpha(C.cyan, 0.5) }}>
          <Text style={{ fontSize: 40, color: C.text }}>🧠</Text>
          <Text style={{ color: C.cyan, fontFamily: F.black, fontSize: 22, marginTop: 4 }}>Treino inteligente</Text>
          <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 14, marginVertical: 8 }}>
            Revisa os exercícios em que você errou ({nMistakes} pendentes) e mistura questões das lições já feitas. Não gasta vidas — e se você for bem, ganha uma ❤️.
          </Text>
          <Button title="Começar treino" color={C.cyan} textColor={C.bg} disabled={doneCount === 0 && nMistakes === 0} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: 'practice', mode: 'practice' } })} />
          {doneCount === 0 ? <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 12, marginTop: 8 }}>Conclua pelo menos uma lição para liberar o treino.</Text> : null}
        </View>

        <Text style={{ color: C.text, fontFamily: F.black, fontSize: 19, marginTop: 24, marginBottom: 10 }}>Revisar unidades</Text>
        {SECTIONS.map((s) => {
          const units = s.units.filter((u) => u.lessons.some((l) => lessons[l.id]));
          if (!units.length) return null;
          return (
            <View key={s.id} style={{ marginBottom: 14 }}>
              <Text style={{ color: s.color, fontFamily: F.black, fontSize: 13, letterSpacing: 1, marginBottom: 6 }}>
                {s.emoji} {s.title.toUpperCase()}
              </Text>
              {units.map((u) => {
                const n = u.lessons.filter((l) => lessons[l.id]).length;
                return (
                  <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: C.surface, marginBottom: 8, borderWidth: 2, borderColor: C.border }}>
                    <Text style={{ fontSize: 26, marginRight: 10, color: C.text }}>{u.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontFamily: F.black, fontSize: 15 }}>{u.title}</Text>
                      <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 12 }}>
                        {n}/{u.lessons.length} lições concluídas
                      </Text>
                    </View>
                    <Button small title="Revisar" color={s.color} style={{ alignSelf: 'center' }} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: u.id, mode: 'review' } })} />
                  </View>
                );
              })}
            </View>
          );
        })}
        {doneCount === 0 ? (
          <Text style={{ color: C.textDim, fontFamily: F.semibold, textAlign: 'center', marginTop: 10 }}>As unidades que você começar aparecem aqui para revisão rápida.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
