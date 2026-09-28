export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime';

export type RepeatType = 'daily' | 'weekly_days' | 'weekly_count';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string; // e.g. '#10533f', '#fc934f', etc.
  bgLight: string;
  textDark: string;
}

export interface Routine {
  id: string;
  title: string;
  emoji: string;
  categoryId: string;
  timeOfDay: TimeOfDay;
  reminderTime?: string; // HH:mm format, e.g. '07:30'
  repeatType: RepeatType;
  repeatDays?: number[]; // 0: Sun, 1: Mon, ..., 6: Sat
  targetCountPerWeek?: number; // e.g. 3 times a week
  archived?: boolean;
  createdAt: string; // ISO string
  order: number;
  xp?: number;
  tag?: string; // e.g. '500ml', '15분', '30p'
}

export interface RoutineLog {
  routineId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  note?: string; // Memo for this completion
}

export type MoodType = 'great' | 'good' | 'normal' | 'tired' | 'bad';

export type SleepQuality = 'great' | 'good' | 'fair' | 'poor';

export interface SleepLog {
  date: string; // YYYY-MM-DD
  bedtime: string; // HH:mm format, e.g. '23:30'
  wakeTime: string; // HH:mm format, e.g. '07:00'
  durationMinutes: number; // e.g. 450 (7h 30m)
  quality: SleepQuality;
  note?: string; // Memo about sleep
  updatedAt?: string;
}

export interface DailyReview {
  date: string; // YYYY-MM-DD
  mood?: MoodType;
  note?: string; // One line reflection/diary
  updatedAt: string;
}

export interface DailyStats {
  totalRoutines: number;
  completedRoutines: number;
  percentage: number;
}

export type ActiveTab = 'today' | 'explore' | 'stats' | 'pomodoro' | 'profile' | 'focus';

export interface RoutineTemplate {
  id: string;
  title: string;
  desc: string;
  category: string;
  categoryId: string;
  emoji: string;
  timeOfDay: TimeOfDay;
  durationMinutes: number;
  xp: number;
  tag: string;
  practitionerCount: number;
  steps?: string[];
}

export interface RoutinePack {
  id: string;
  title: string;
  badge: string;
  desc: string;
  totalDuration: string;
  totalXp: number;
  bannerImage: string;
  routines: Array<{
    title: string;
    emoji: string;
    duration: string;
    timeOfDay: TimeOfDay;
    categoryId: string;
    xp: number;
    tag: string;
  }>;
}

export interface AchievementBadge {
  id: string;
  title: string;
  level: string;
  desc: string;
  icon: string;
  achieved: boolean;
  progressPercent?: number;
}

export type SoundEffectType = 'rain' | 'birds' | 'cafe' | 'mute';
