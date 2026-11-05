import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, Text, View } from 'react-native';
import { C, F, alpha } from '../../theme';
import type { CompleteSummary } from '../../state/store';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import { achievementById } from '../../content/achievements';

function Stat({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <View style={{ flex: 1, borderRadius: 16, borderWidth: 2, borderColor: color, overflow: 'hidden' }}>
      <View style={{ backgroundColor: color, paddingVertical: 4, alignItems: 'center' }}>
        <Text style={{ color: C.bg, fontFamily: F.black, fontSize: 12, letterSpacing: 1 }}>{label}</Text>
      </View>
      <View style={{ paddingVertical: 12, alignItems: 'center', backgroundColor: C.surface }}>
        <Text style={{ color, fontFamily: F.black, fontSize: 22 }}>
          {icon} {value}
        </Text>
      </View>
    </View>
  );
}

const TITLES = ['Lição concluída!', 'Mandou bem!', 'Excelente!', 'Que cérebro!', 'Arrasou!'];

export function LessonComplete({ summary, durationMs, onContinue, title }: { summary: CompleteSummary; durationMs: number; onContinue: () => void; title?: string }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const flame = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(flame, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(flame, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, [scale, flame]);
  const mins = Math.floor(durationMs / 60000);
  const secs = Math.floor((durationMs % 60000) / 1000);
  const streakUp = summary.streakAfter > summary.streakBefore;
  const t = title ?? (summary.perfect ? 'Perfeito! 🎯' : TITLES[Math.floor(Math.random() * TITLES.length)]);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50, alignItems: 'center' }}>
        <Animated.Text style={{ fontSize: 90, transform: [{ scale }] }}>{summary.perfect ? '🏆' : '🎉'}</Animated.Text>
        <Text style={{ color: C.gold, fontFamily: F.black, fontSize: 30, marginTop: 8, textAlign: 'center' }}>{t}</Text>
        {summary.levelAfter > summary.levelBefore ? (
          <Text style={{ color: C.cyan, fontFamily: F.black, fontSize: 18, marginTop: 6 }}>⬆️ Subiu para o nível {summary.levelAfter}!</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, alignSelf: 'stretch' }}>
          <Stat label="XP" value={`+${summary.xp}`} color={C.gold} icon="⚡" />
          <Stat label="PRECISÃO" value={`${Math.round(summary.accuracy * 100)}%`} color={C.success} icon="🎯" />
          <Stat label="TEMPO" value={`${mins}:${String(secs).padStart(2, '0')}`} color={C.cyan} icon="⏱" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, alignSelf: 'stretch' }}>
          <Stat label="GEMAS" value={`+${summary.gems}`} color={C.gem} icon="💎" />
          <Stat label="OFENSIVA" value={`${summary.streakAfter}`} color={C.fire} icon="🔥" />
        </View>
        {streakUp ? (
          <View style={{ marginTop: 18, padding: 16, borderRadius: 20, backgroundColor: alpha(C.fire, 0.14), borderWidth: 2, borderColor: alpha(C.fire, 0.5), alignSelf: 'stretch', alignItems: 'center' }}>
            <Animated.Text style={{ fontSize: 46, transform: [{ scale: flame.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }] }}>🔥</Animated.Text>
            <Text style={{ color: C.fire, fontFamily: F.black, fontSize: 20 }}>Ofensiva de {summary.streakAfter} {summary.streakAfter === 1 ? 'dia' : 'dias'}!</Text>
            <Text style={{ color: C.textMuted, fontFamily: F.semibold, marginTop: 4, textAlign: 'center' }}>Mais um quadradinho verde no seu mapa de estudos 🟩</Text>
          </View>
        ) : null}
        {summary.goalReachedNow ? (
          <View style={{ marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: alpha(C.success, 0.12), borderWidth: 2, borderColor: alpha(C.success, 0.5), alignSelf: 'stretch', alignItems: 'center' }}>
            <Text style={{ color: C.success, fontFamily: F.black, fontSize: 18 }}>✅ Meta diária concluída! +10 💎</Text>
          </View>
        ) : null}
        {summary.newAchievements.map((id) => {
          const a = achievementById(id);
          if (!a) return null;
          return (
            <View key={id} style={{ marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: alpha(C.primary, 0.14), borderWidth: 2, borderColor: alpha(C.primary, 0.6), alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 34, marginRight: 12 }}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.primary, fontFamily: F.black, fontSize: 12, letterSpacing: 1 }}>CONQUISTA DESBLOQUEADA · +20 💎</Text>
                <Text style={{ color: C.text, fontFamily: F.black, fontSize: 17 }}>{a.title}</Text>
                <Text style={{ color: C.textMuted, fontFamily: F.semibold }}>{a.desc}</Text>
              </View>
            </View>
          );
        })}
        <View style={{ height: 110 }} />
      </ScrollView>
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 28 }}>
        <Button title="Continuar" onPress={onContinue} color={C.success} />
      </View>
      <Confetti />
    </View>
  );
}
