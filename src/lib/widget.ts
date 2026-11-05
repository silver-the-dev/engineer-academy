import StreakWidget from '../../modules/streak-widget/src/StreakWidgetModule';
import { levelFromXp, useApp } from '../state/store';

let timer: any = null;

/** Pushes the last ~400 days of XP to the native home-screen widget (debounced). */
export function syncWidget() {
  if (!StreakWidget) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const s = useApp.getState();
    const days: Record<string, number> = {};
    const keys = Object.keys(s.days).sort().slice(-400);
    for (const k of keys) days[k] = s.days[k];
    for (const k of s.frozenDays) if (!days[k]) days[k] = 1; // frozen days count as kept
    const payload = JSON.stringify({ days, dailyGoal: s.settings.dailyGoal, totalXp: s.xp, level: levelFromXp(s.xp).level });
    StreakWidget!.updateAsync(payload).catch(() => {});
  }, 300);
}

export async function requestPinWidget(): Promise<boolean> {
  if (!StreakWidget) return false;
  try {
    return await StreakWidget.requestPinAsync();
  } catch {
    return false;
  }
}

export async function widgetCount(): Promise<number> {
  if (!StreakWidget) return 0;
  try {
    return await StreakWidget.countAsync();
  } catch {
    return 0;
  }
}
