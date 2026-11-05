import React, { useEffect } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { C, F, alpha } from '../../theme';
import { useApp, FREEZE_PRICE, REFILL_PRICE, MAX_HEARTS } from '../../state/store';
import { TopBar } from '../../components/ui/TopBar';
import { Button, ProgressBar } from '../../components/ui/Button';
import { addDays, dateKey, WEEKDAYS } from '../../lib/dates';
import { unlockFeedback } from '../../lib/feedback';

const QUEST_TEXT: Record<string, (t: number) => string> = {
  xp: (t) => `Ganhe ${t} XP`,
  lessons: (t) => `Conclua ${t} lições`,
  perfect: () => 'Faça 1 lição sem erros',
  combo: (t) => `Acerte ${t} seguidas`,
  practice: () => 'Faça 1 treino inteligente',
  correct: (t) => `Acerte ${t} exercícios`,
};
const QUEST_ICON: Record<string, string> = { xp: '⚡', lessons: '📘', perfect: '🎯', combo: '🔥', practice: '🧠', correct: '✅' };

export default function QuestsScreen() {
  const { width } = useWindowDimensions();
  const quests = useApp((s) => s.quests);
  const days = useApp((s) => s.days);
  const gems = useApp((s) => s.gems);
  const freezes = useApp((s) => s.freezes);
  const goal = useApp((s) => s.settings.dailyGoal);
  const hearts = useApp((s) => s.currentHearts());
  const ensureDaily = useApp((s) => s.ensureDaily);
  const claim = useApp((s) => s.claimQuest);
  const buyFreeze = useApp((s) => s.buyFreeze);
  const refill = useApp((s) => s.refillHearts);
  useEffect(() => ensureDaily(), [ensureDaily]);

  const W = width - 32;
  const H = 150;
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6));
  const vals = last7.map((d) => days[dateKey(d)] ?? 0);
  const max = Math.max(goal * 1.3, ...vals, 10);
  const bw = (W - 20) / 7;
  const weekXp = vals.reduce((a, b) => a + b, 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar left={<Text style={{ color: C.text, fontFamily: F.black, fontSize: 22 }}>Missões</Text>} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ color: C.text, fontFamily: F.black, fontSize: 19, marginBottom: 10 }}>Missões do dia</Text>
        {quests.list.map((q) => {
          const done = q.progress >= q.target;
          return (
            <View key={q.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: C.surface, borderWidth: 2, borderColor: done && !q.claimed ? C.gold : C.border, marginBottom: 10 }}>
              <Text style={{ color: C.text, fontSize: 30, marginRight: 12 }}>{QUEST_ICON[q.kind]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontFamily: F.black, fontSize: 15, marginBottom: 6 }}>{QUEST_TEXT[q.kind](q.target)}</Text>
                <ProgressBar value={q.progress / q.target} color={done ? C.gold : C.primary} height={12} />
                <Text style={{ color: C.textMuted, fontFamily: F.bold, fontSize: 12, marginTop: 4 }}>
                  {q.progress}/{q.target} · recompensa {q.reward} 💎
                </Text>
              </View>
              {done ? (
                q.claimed ? (
                  <Text style={{ color: C.text, fontSize: 26, marginLeft: 8 }}>✅</Text>
                ) : (
                  <Button small title="Pegar" color={C.gold} textColor={C.bg} style={{ alignSelf: 'center', marginLeft: 8 }} onPress={() => { claim(q.id); unlockFeedback(); }} />
                )
              ) : (
                <Text style={{ color: C.text, fontSize: 26, marginLeft: 8, opacity: 0.5 }}>🎁</Text>
              )}
            </View>
          );
        })}

        <Text style={{ color: C.text, fontFamily: F.black, fontSize: 19, marginTop: 18, marginBottom: 4 }}>Últimos 7 dias</Text>
        <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 13, marginBottom: 10 }}>{weekXp} XP na semana · meta diária {goal} XP</Text>
        <View style={{ backgroundColor: C.surface, borderRadius: 18, padding: 10 }}>
          <Svg width={W - 20} height={H + 24}>
            <Line x1={0} x2={W - 20} y1={H - (goal / max) * H} y2={H - (goal / max) * H} stroke={C.gold} strokeDasharray="6 4" strokeWidth={2} />
            {vals.map((v, i) => {
              const h = (v / max) * H;
              return (
                <React.Fragment key={i}>
                  <Rect x={i * bw + 6} y={H - h} width={bw - 12} height={Math.max(2, h)} rx={6} fill={v >= goal ? C.success : v > 0 ? C.primary : C.surface3} />
                  <SvgText x={i * bw + bw / 2} y={H + 18} fill={i === 6 ? C.cyan : C.textMuted} fontSize={12} textAnchor="middle" fontFamily={F.black}>
                    {i === 6 ? 'Hoje' : WEEKDAYS[last7[i].getDay()]}
                  </SvgText>
                  {v > 0 ? (
                    <SvgText x={i * bw + bw / 2} y={H - h - 4} fill={C.text} fontSize={11} textAnchor="middle" fontFamily={F.bold}>
                      {v}
                    </SvgText>
                  ) : null}
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        <Text style={{ color: C.text, fontFamily: F.black, fontSize: 19, marginTop: 22, marginBottom: 10 }}>Loja 💎 {gems}</Text>
        <View style={{ padding: 14, borderRadius: 18, backgroundColor: alpha('#4DABF7', 0.1), borderWidth: 2, borderColor: alpha('#4DABF7', 0.5), marginBottom: 10 }}>
          <Text style={{ color: '#74C0FC', fontFamily: F.black, fontSize: 17 }}>🧊 Congelar ofensiva ({freezes}/2)</Text>
          <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 13, marginVertical: 6 }}>Protege sua ofensiva se você ficar um dia sem estudar. É usado automaticamente.</Text>
          <Button small title={`Comprar · ${FREEZE_PRICE} 💎`} color="#4DABF7" disabled={gems < FREEZE_PRICE || freezes >= 2} onPress={() => { if (buyFreeze()) unlockFeedback(); }} />
        </View>
        <View style={{ padding: 14, borderRadius: 18, backgroundColor: alpha(C.heart, 0.1), borderWidth: 2, borderColor: alpha(C.heart, 0.5) }}>
          <Text style={{ color: C.heart, fontFamily: F.black, fontSize: 17 }}>❤️ Recarregar vidas ({hearts}/{MAX_HEARTS})</Text>
          <Text style={{ color: C.textMuted, fontFamily: F.semibold, fontSize: 13, marginVertical: 6 }}>Vidas voltam sozinhas: 1 a cada 20 minutos.</Text>
          <Button small title={`Recarregar · ${REFILL_PRICE} 💎`} color={C.heart} disabled={gems < REFILL_PRICE || hearts >= MAX_HEARTS} onPress={() => { if (refill(true)) unlockFeedback(); }} />
        </View>
      </ScrollView>
    </View>
  );
}
