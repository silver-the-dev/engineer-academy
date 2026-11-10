import { computeStreak, longestStreak } from '../lib/dates';
import { levelFromXp } from '../state/store';

export type Achievement = { id: string; title: string; desc: string; icon: string; test: (s: any) => boolean };

const sectionDone = (s: any, prefix: string, min: number) => Object.keys(s.lessons).filter((k) => k.startsWith(prefix)).length >= min;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: 'Primeiro passo', desc: 'Conclua sua primeira lição', icon: '🎓', test: (s) => s.stats.lessonsDone >= 1 },
  { id: 'l10', title: 'Engrenando', desc: 'Conclua 10 lições', icon: '⚙️', test: (s) => s.stats.lessonsDone >= 10 },
  { id: 'l50', title: 'Máquina de estudar', desc: 'Conclua 50 lições', icon: '🏭', test: (s) => s.stats.lessonsDone >= 50 },
  { id: 'l100', title: 'Centurião', desc: 'Conclua 100 lições', icon: '💯', test: (s) => s.stats.lessonsDone >= 100 },
  { id: 'perfect1', title: 'Gabaritou', desc: 'Faça uma lição sem erros', icon: '🎯', test: (s) => s.stats.perfect >= 1 },
  { id: 'perfect10', title: 'Precisão de engenheiro', desc: '10 lições perfeitas', icon: '📐', test: (s) => s.stats.perfect >= 10 },
  { id: 'perfect30', title: 'Erro zero', desc: '30 lições perfeitas', icon: '🧮', test: (s) => s.stats.perfect >= 30 },
  { id: 's3', title: 'Aquecendo', desc: 'Ofensiva de 3 dias', icon: '🔥', test: (s) => longestStreak(s.days, s.frozenDays) >= 3 || computeStreak(s.days, s.frozenDays) >= 3 },
  { id: 's7', title: 'Semana cheia', desc: 'Ofensiva de 7 dias', icon: '📅', test: (s) => longestStreak(s.days, s.frozenDays) >= 7 },
  { id: 's30', title: 'Mês de foco', desc: 'Ofensiva de 30 dias', icon: '🌋', test: (s) => longestStreak(s.days, s.frozenDays) >= 30 },
  { id: 's100', title: 'Lenda da constância', desc: 'Ofensiva de 100 dias', icon: '👑', test: (s) => longestStreak(s.days, s.frozenDays) >= 100 },
  { id: 'combo10', title: 'Em chamas', desc: '10 acertos seguidos', icon: '⚡', test: (s) => s.stats.bestCombo >= 10 },
  { id: 'combo25', title: 'Imparável', desc: '25 acertos seguidos', icon: '🚀', test: (s) => s.stats.bestCombo >= 25 },
  { id: 'xp1000', title: 'Mil XP', desc: 'Acumule 1.000 XP', icon: '⭐', test: (s) => s.xp >= 1000 },
  { id: 'xp5000', title: 'Cinco mil XP', desc: 'Acumule 5.000 XP', icon: '🌟', test: (s) => s.xp >= 5000 },
  { id: 'lvl10', title: 'Nível 10', desc: 'Alcance o nível 10', icon: '🏅', test: (s) => levelFromXp(s.xp).level >= 10 },
  { id: 'practice5', title: 'Revisor', desc: 'Faça 5 treinos de revisão', icon: '🔁', test: (s) => s.stats.practiceDone >= 5 },
  { id: 'owl', title: 'Coruja', desc: 'Estude depois das 23h', icon: '🦉', test: (s) => s.stats.nightOwl >= 1 },
  { id: 'bird', title: 'Madrugador', desc: 'Estude antes das 7h', icon: '🐦', test: (s) => s.stats.earlyBird >= 1 },
  { id: 'fund', title: 'Base sólida', desc: '10 lições de Fundamentos', icon: '🧱', test: (s) => sectionDone(s, 'f-', 10) },
  { id: 'calc', title: 'Newton aprovaria', desc: '10 lições de Cálculo', icon: '∫', test: (s) => sectionDone(s, 'c-', 10) },
  { id: 'gaal', title: 'Vetorizado', desc: '10 lições de GA e Álgebra Linear', icon: '🧭', test: (s) => sectionDone(s, 'g-', 10) },
  { id: 'num', title: 'Numericamente estável', desc: '10 lições de Cálculo Numérico', icon: '💻', test: (s) => sectionDone(s, 'n-', 10) },
  { id: 'est', title: 'Estatisticamente significativo', desc: '10 lições de Estatística', icon: '📊', test: (s) => sectionDone(s, 'e-', 10) },
  { id: 'mec', title: 'Corpo em movimento', desc: '10 lições de Mecânica', icon: '🚀', test: (s) => sectionDone(s, 'm-', 10) },
  { id: 'ele', title: 'Alta tensão', desc: '10 lições de Eletricidade', icon: '⚡', test: (s) => sectionDone(s, 'el-', 10) },
  { id: 'emg', title: 'Força de campo', desc: '8 lições de Eletromagnetismo', icon: '🧲', test: (s) => sectionDone(s, 'em-', 8) },
  { id: 'eln', title: 'Bem polarizado', desc: '10 lições de Eletrônica Analógica', icon: '🔌', test: (s) => sectionDone(s, 'ea-', 10) },
  { id: 'dig', title: 'Nível lógico alto', desc: '10 lições de Eletrônica Digital', icon: '💡', test: (s) => sectionDone(s, 'dg-', 10) },
];

export function checkAchievements(state: any): string[] {
  const out: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    try {
      if (a.test(state)) out.push(a.id);
    } catch {}
  }
  return out;
}

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);
