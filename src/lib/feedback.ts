import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { useApp } from '../state/store';

const SOURCES = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
  tap: require('../../assets/sounds/tap.wav'),
  combo: require('../../assets/sounds/combo.wav'),
  unlock: require('../../assets/sounds/unlock.wav'),
};
type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let ready = false;

export async function initSounds() {
  if (ready) return;
  ready = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' } as any);
  } catch {}
  for (const k of Object.keys(SOURCES) as SoundName[]) {
    try {
      players[k] = createAudioPlayer(SOURCES[k]);
      players[k]!.volume = k === 'tap' ? 0.35 : 0.8;
    } catch {}
  }
}

export function play(name: SoundName) {
  if (!useApp.getState().settings.sound) return;
  const p = players[name];
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {}
}

function hapticsOn() {
  return Platform.OS !== 'web' && useApp.getState().settings.haptics;
}

let lastTick = 0;
export function tick() {
  if (!hapticsOn()) return;
  const now = Date.now();
  if (now - lastTick < 35) return;
  lastTick = now;
  Haptics.selectionAsync().catch(() => {});
}

export function tapFeedback() {
  if (hapticsOn()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  play('tap');
}

export function correctFeedback(combo = 0) {
  if (hapticsOn()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  play(combo >= 3 && combo % 3 === 0 ? 'combo' : 'correct');
}

export function wrongFeedback() {
  if (hapticsOn()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  play('wrong');
}

export function completeFeedback() {
  if (hapticsOn()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  play('complete');
}

export function unlockFeedback() {
  if (hapticsOn()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  play('unlock');
}
