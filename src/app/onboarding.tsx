import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, alpha } from '../theme';
import { useApp } from '../state/store';
import { Button } from '../components/ui/Button';
import { ensurePermission, rescheduleReminders } from '../lib/notifications';
import { SECTIONS } from '../content';
import { syncWidget } from '../lib/widget';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(50);
  const [section, setSection] = useState(SECTIONS[0].id);
  const s = useApp();
  const finish = async () => {
    s.setName(name || 'Engenheiro(a)');
    s.updateSettings({ dailyGoal: goal, section });
    await ensurePermission(true).catch(() => false);
    s.setOnboarded();
    rescheduleReminders();
    syncWidget();
    router.replace('/');
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}>
      <ScrollView contentContainerStyle={{ padding: 22, flexGrow: 1 }}>
        {step === 0 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 90, color: C.primary, fontFamily: F.black }}>∫</Text>
            <Text style={{ color: C.text, fontFamily: F.black, fontSize: 32, textAlign: 'center' }}>Engineer Academy</Text>
            <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 17, textAlign: 'center', marginTop: 10 }}>
              Matemática de Engenharia em lições curtas, visuais e interativas. Do pré-cálculo ao Cálculo 4: funções, cálculo, álgebra linear, cálculo vetorial, EDOs, numérico e estatística — um pouquinho todo dia.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 26, gap: 8 }}>
              {['📈 gráficos interativos', '🔥 ofensiva diária', '🟩 widget de dias', '🏆 conquistas', '🔔 lembretes'].map((t) => (
                <View key={t} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.surface2 }}>
                  <Text style={{ color: C.text, fontFamily: F.bold }}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {step === 1 && (
          <View>
            <Text style={{ color: C.text, fontFamily: F.black, fontSize: 26, marginBottom: 14 }}>Como podemos te chamar?</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={C.textDim} style={{ color: C.text, fontFamily: F.bold, fontSize: 20, backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: C.border }} />
            <Text style={{ color: C.text, fontFamily: F.black, fontSize: 22, marginTop: 28, marginBottom: 12 }}>Qual sua meta diária?</Text>
            {[
              [20, 'Leve', '~5 min/dia'],
              [50, 'Normal', '~10 min/dia'],
              [100, 'Puxado', '~20 min/dia'],
              [150, 'Insano', '~30 min/dia'],
            ].map(([v, l, d]) => (
              <Pressable key={v} onPress={() => setGoal(v as number)} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 2, borderColor: goal === v ? C.primary : C.border, backgroundColor: goal === v ? alpha(C.primary, 0.14) : C.surface }}>
                <Text style={{ color: C.text, fontFamily: F.black, fontSize: 17, flex: 1 }}>{l}</Text>
                <Text style={{ color: C.textMuted, fontFamily: F.bold }}>
                  {v} XP · {d}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {step === 2 && (
          <View>
            <Text style={{ color: C.text, fontFamily: F.black, fontSize: 26, marginBottom: 6 }}>Por onde começar?</Text>
            <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 15, marginBottom: 14 }}>Você pode trocar de matéria a qualquer momento.</Text>
            {SECTIONS.map((sec) => (
              <Pressable key={sec.id} onPress={() => setSection(sec.id)} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 8, borderWidth: 2, borderColor: section === sec.id ? sec.color : C.border, backgroundColor: section === sec.id ? alpha(sec.color, 0.14) : C.surface }}>
                <Text style={{ fontSize: 30, marginRight: 12, width: 44, textAlign: 'center', color: sec.color, fontFamily: F.black }}>{sec.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: sec.color, fontFamily: F.black, fontSize: 17 }}>{sec.title}</Text>
                  <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 13 }}>{sec.subtitle}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        {step === 3 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 80, color: C.text }}>🔔</Text>
            <Text style={{ color: C.text, fontFamily: F.black, fontSize: 26, textAlign: 'center', marginTop: 10 }}>Lembretes diários</Text>
            <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 16, textAlign: 'center', marginTop: 10 }}>
              Vamos te lembrar todo dia às 19h (dá para mudar no Perfil) e avisar se a ofensiva estiver em risco. Permita as notificações na próxima tela.
            </Text>
            <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 16, textAlign: 'center', marginTop: 16 }}>
              🟩 Dica: adicione o widget “Dias de estudo” na tela inicial para ver seus quadradinhos estilo GitHub.
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14, gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? C.primary : C.surface3 }} />
          ))}
        </View>
        <Button title={step < 3 ? 'Continuar' : 'Começar a estudar!'} color={step < 3 ? C.primary : C.success} onPress={() => (step < 3 ? setStep(step + 1) : finish())} />
      </View>
    </View>
  );
}
