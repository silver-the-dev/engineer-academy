import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { C, F, alpha } from '../../theme';
import { levelFromXp, useApp, useStreak } from '../../state/store';
import { TopBar } from '../../components/ui/TopBar';
import { Button, ProgressBar } from '../../components/ui/Button';
import { Heatmap } from '../../components/ui/Heatmap';
import { ACHIEVEMENTS } from '../../content/achievements';
import { longestStreak } from '../../lib/dates';
import { ensurePermission, rescheduleReminders, sendTestNotification } from '../../lib/notifications';
import { requestPinWidget, syncWidget } from '../../lib/widget';
import { tapFeedback } from '../../lib/feedback';

function Stat({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={{ width: '48%', padding: 12, borderRadius: 16, borderWidth: 2, borderColor: C.border, backgroundColor: C.surface, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ color: C.text, fontSize: 24, marginRight: 8 }}>{icon}</Text>
      <View>
        <Text style={{ color, fontFamily: F.black, fontSize: 19 }}>{value}</Text>
        <Text style={{ color: C.textMuted, fontFamily: F.bold, fontSize: 12 }}>{label}</Text>
      </View>
    </View>
  );
}

function Row({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: C.surface2 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 15 }}>{label}</Text>
        {desc ? <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 12 }}>{desc}</Text> : null}
      </View>
      <Switch value={value} onValueChange={(v) => { tapFeedback(); onChange(v); }} trackColor={{ true: C.primary, false: C.surface3 }} thumbColor={C.white} />
    </View>
  );
}

function Stepper({ value, onChange, min, max, fmt }: { value: number; onChange: (v: number) => void; min: number; max: number; fmt?: (v: number) => string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable onPress={() => onChange(value <= min ? max : value - 1)} style={{ padding: 8, backgroundColor: C.surface3, borderRadius: 10 }}>
        <Text style={{ color: C.text, fontFamily: F.black, fontSize: 16 }}>−</Text>
      </Pressable>
      <Text style={{ color: C.cyan, fontFamily: F.black, fontSize: 18, minWidth: 44, textAlign: 'center' }}>{fmt ? fmt(value) : value}</Text>
      <Pressable onPress={() => onChange(value >= max ? min : value + 1)} style={{ padding: 8, backgroundColor: C.surface3, borderRadius: 10 }}>
        <Text style={{ color: C.text, fontFamily: F.black, fontSize: 16 }}>+</Text>
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const s = useApp();
  const streak = useStreak();
  const [name, setName] = useState(s.name);
  const lv = levelFromXp(s.xp);
  const acc = s.stats.answers ? Math.round((s.stats.correct / s.stats.answers) * 100) : 0;
  const studied = Object.values(s.days).filter((v) => v > 0).length;
  const mins = Math.round(s.stats.timeMs / 60000);
  const set = (patch: any) => {
    s.updateSettings(patch);
    setTimeout(() => {
      rescheduleReminders();
      syncWidget();
    }, 50);
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar left={<Text style={{ color: C.text, fontFamily: F.black, fontSize: 22 }}>Perfil</Text>} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 50 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 4, borderColor: alpha(C.cyan, 0.6) }}>
            <Text style={{ color: C.white, fontFamily: F.black, fontSize: 30 }}>{(s.name[0] || 'E').toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <TextInput value={name} onChangeText={setName} onBlur={() => s.setName(name)} style={{ color: C.text, fontFamily: F.black, fontSize: 22, padding: 0 }} />
            <Text style={{ color: C.cyan, fontFamily: F.black, fontSize: 14, marginBottom: 6 }}>
              Nível {lv.level} · {s.xp} XP
            </Text>
            <ProgressBar value={(s.xp - lv.base) / (lv.next - lv.base)} color={C.cyan} height={10} />
            <Text style={{ color: C.textDim, fontFamily: F.bold, fontSize: 11, marginTop: 3 }}>{lv.next - s.xp} XP para o nível {lv.level + 1}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Stat icon="🔥" value={`${streak}`} label="ofensiva atual" color={C.fire} />
          <Stat icon="🏔️" value={`${Math.max(streak, longestStreak(s.days, s.frozenDays))}`} label="maior ofensiva" color={C.gold} />
          <Stat icon="📅" value={`${studied}`} label={studied === 1 ? "dia estudado" : "dias estudados"} color={C.success} />
          <Stat icon="📘" value={`${s.stats.lessonsDone}`} label="lições" color={C.primary} />
          <Stat icon="🎯" value={`${acc}%`} label="precisão" color={C.cyan} />
          <Stat icon="⏱️" value={`${mins} min`} label="tempo estudando" color={C.p5} />
        </View>

        <Text style={{ color: C.text, fontFamily: F.black, fontSize: 19, marginTop: 10, marginBottom: 10 }}>Mapa de estudos</Text>
        <View style={{ backgroundColor: '#0D1117', borderRadius: 18, padding: 12 }}>
          <Heatmap days={s.days} frozen={s.frozenDays} goal={s.settings.dailyGoal} width={width - 56} />
        </View>
        <Button title="Adicionar widget na tela inicial" icon="🟩" color={C.successDark} style={{ marginTop: 12 }} onPress={async () => {
          syncWidget();
          const ok = await requestPinWidget();
          if (!ok) Alert.alert('Widget', 'Segure o dedo na tela inicial → Widgets → Engineer Academy → "Dias de estudo".');
        }} />

        <Text style={{ color: C.text, fontFamily: F.black, fontSize: 19, marginTop: 22, marginBottom: 10 }}>
          Conquistas ({Object.keys(s.achievements).length}/{ACHIEVEMENTS.length})
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {ACHIEVEMENTS.map((a) => {
            const got = !!s.achievements[a.id];
            return (
              <View key={a.id} style={{ width: '31.5%', padding: 10, borderRadius: 16, marginBottom: 10, alignItems: 'center', backgroundColor: got ? alpha(C.gold, 0.12) : C.surface, borderWidth: 2, borderColor: got ? alpha(C.gold, 0.6) : C.border }}>
                <Text style={{ color: C.text, fontSize: 30, opacity: got ? 1 : 0.25 }}>{a.icon}</Text>
                <Text style={{ color: got ? C.gold : C.textDim, fontFamily: F.black, fontSize: 12, textAlign: 'center', marginTop: 4 }} numberOfLines={2}>
                  {a.title}
                </Text>
                <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 10, textAlign: 'center' }} numberOfLines={2}>
                  {a.desc}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={{ color: C.text, fontFamily: F.black, fontSize: 19, marginTop: 18, marginBottom: 4 }}>Configurações</Text>
        <View style={{ backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: C.surface2 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 15 }}>Meta diária</Text>
              <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 12 }}>XP por dia para completar a meta</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderColor: C.surface2 }}>
            {[
              [20, 'Leve'],
              [50, 'Normal'],
              [100, 'Puxado'],
              [150, 'Insano'],
            ].map(([v, l]) => (
              <Pressable key={v} onPress={() => set({ dailyGoal: v })} style={{ flex: 1, padding: 8, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: s.settings.dailyGoal === v ? C.primary : C.border, backgroundColor: s.settings.dailyGoal === v ? alpha(C.primary, 0.15) : 'transparent' }}>
                <Text style={{ color: C.text, fontFamily: F.black, fontSize: 15 }}>{v}</Text>
                <Text style={{ color: C.textMuted, fontFamily: F.bold, fontSize: 11 }}>{l}</Text>
              </Pressable>
            ))}
          </View>
          <Row label="Lembretes diários" desc="Notificação todos os dias no horário escolhido" value={s.settings.notifications} onChange={async (v) => {
            if (v) await ensurePermission(true);
            set({ notifications: v });
          }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: C.surface2 }}>
            <Text style={{ color: C.text, fontFamily: F.bold, fontSize: 15, flex: 1 }}>Horário do lembrete</Text>
            <Stepper value={s.settings.reminderHour} min={5} max={23} onChange={(v) => set({ reminderHour: v })} fmt={(v) => `${String(v).padStart(2, '0')}h`} />
            <View style={{ width: 8 }} />
            <Stepper value={s.settings.reminderMinute / 15} min={0} max={3} onChange={(v) => set({ reminderMinute: v * 15 })} fmt={(v) => String(v * 15).padStart(2, '0')} />
          </View>
          <Row label="Alerta de ofensiva em risco" desc="Aviso às 21:45 se você ainda não estudou" value={s.settings.riskReminder} onChange={(v) => set({ riskReminder: v })} />
          <Row label="Sons" value={s.settings.sound} onChange={(v) => set({ sound: v })} />
          <Row label="Vibração" value={s.settings.haptics} onChange={(v) => set({ haptics: v })} />
          <Row label="Vidas (❤️)" desc="Perde uma vida a cada erro, como no Duolingo" value={s.settings.hearts} onChange={(v) => set({ hearts: v })} />
          <Row label="Modo livre" desc="Desbloqueia todas as lições de todas as seções" value={s.settings.freeMode} onChange={(v) => set({ freeMode: v })} />
        </View>
        <Button title="Testar notificação" small color={C.surface3} style={{ marginTop: 12 }} onPress={async () => {
          const ok = await ensurePermission(true);
          if (ok) sendTestNotification();
          else Alert.alert('Permissão negada', 'Ative as notificações do Engineer Academy nas configurações do Android.');
        }} />
        <Button title="Apagar todo o progresso" small variant="ghost" color={C.danger} style={{ marginTop: 18 }} onPress={() => Alert.alert('Apagar progresso?', 'Isso zera XP, ofensiva e lições. Não dá para desfazer.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Apagar', style: 'destructive', onPress: () => { s.resetAll(); syncWidget(); } },
        ])} />
        <Text style={{ color: C.textDim, fontFamily: F.semibold, fontSize: 11, textAlign: 'center', marginTop: 16 }}>Engineer Academy v1.0 · feito para estudar Engenharia todos os dias</Text>
      </ScrollView>
    </View>
  );
}
