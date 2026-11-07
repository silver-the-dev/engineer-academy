import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, computeStreak, dateKey } from './dates';
import { useApp } from '../state/store';

const CHANNEL = 'study-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DAILY_MSGS: [string, string][] = [
  ['Hora da matemática! 📐', 'Uma lição rapidinha mantém sua ofensiva viva. Bora?'],
  ['Seu cérebro pediu derivadas 🧠', 'Leva 5 minutos. A ofensiva agradece.'],
  ['∫ estudo dt = sucesso', 'A integral do esforço diário é a aprovação. Faça a de hoje!'],
  ['Newton não descansou… 🍎', '…e você também não vai deixar a ofensiva cair, né?'],
  ['Vetor resultante: você aprovado ➡️', 'Some mais uma lição ao seu progresso hoje.'],
  ['lim (preguiça) → 0', 'Quando o estudo tende a todo dia, a nota tende ao máximo.'],
  ['Engenheiro(a) de plantão! 🛠️', 'Uma lição agora e o dia está ganho.'],
  ['Desvio padrão da sua rotina: 0 🎯', 'Mantenha a constância: estude hoje.'],
  ['Bisseção da procrastinação ✂️', 'Divida o problema ao meio: comece com UMA lição.'],
  ['Seus quadradinhos estão esperando 🟩', 'Pinte mais um dia de verde no seu mapa de estudos.'],
  ['Probabilidade de passar: ↑', 'Cada lição aumenta suas chances. Vem!'],
  ['O Engineer Academy sente sua falta 🥺', 'Até o gráfico ficou triste. Bora estudar?'],
];

const RISK_MSGS: [string, string][] = [
  ['🔥 Sua ofensiva está em risco!', 'Faltam poucas horas. Uma lição salva o dia!'],
  ['⏰ Última chamada!', 'Não deixe sua ofensiva de {n} dias tender a zero.'],
  ['🧯 Ofensiva pegando fogo… do jeito errado', 'Faça uma lição rápida antes da meia-noite.'],
];

export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Lembretes de estudo',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#7C5CFF',
    sound: 'default',
  });
}

export async function ensurePermission(ask: boolean): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!ask) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

let scheduling = false;

/**
 * (Re)schedules reminders for the next 21 days with varied messages.
 * Today is skipped when the daily goal is already reached.
 */
export async function rescheduleReminders() {
  if (Platform.OS === 'web' || scheduling) return;
  scheduling = true;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const s = useApp.getState();
    if (!s.settings.notifications) return;
    const ok = await ensurePermission(false);
    if (!ok) return;
    const now = new Date();
    const todayXp = s.days[dateKey(now)] ?? 0;
    const doneToday = todayXp >= s.settings.dailyGoal;
    const studiedToday = todayXp > 0;
    const streak = computeStreak(s.days, s.frozenDays);
    for (let i = 0; i < 21; i++) {
      const day = addDays(now, i);
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), s.settings.reminderHour, s.settings.reminderMinute, 0);
      if (i === 0 && (doneToday || at <= now)) {
        // nothing
      } else if (at > now) {
        const [title, body] = DAILY_MSGS[(day.getDate() + day.getMonth() * 3) % DAILY_MSGS.length];
        await Notifications.scheduleNotificationAsync({
          content: { title, body, data: { kind: 'daily' } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
        });
      }
      if (s.settings.riskReminder) {
        const risk = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 21, 45, 0);
        const skip = i === 0 && (studiedToday || risk <= now);
        if (!skip && risk > now) {
          const [t, b] = RISK_MSGS[(day.getDate() + i) % RISK_MSGS.length];
          await Notifications.scheduleNotificationAsync({
            content: { title: t, body: b.replace('{n}', String(Math.max(streak, 1))), data: { kind: 'risk' } },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: risk, channelId: CHANNEL },
          });
        }
      }
    }
  } catch {
    // ignore
  } finally {
    scheduling = false;
  }
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Engineer Academy 🎓', body: 'Notificações funcionando! Você receberá lembretes diários.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: CHANNEL } as any,
  });
}
