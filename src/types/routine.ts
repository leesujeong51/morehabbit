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

export type RoutinePriority = 'high' | 'medium' | 'low';

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
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (선택 사항, 필수 아님)
  priority?: RoutinePriority; // 'high' | 'medium' | 'low'
  isPrivate?: boolean;
  order: number;
  xp?: number;
  tag?: string; // e.g. '500ml', '15분', '30p'
}

export interface UserProfile {
  name: string;
  hasCompletedOnboarding: boolean;
  allowNotification: boolean;
  avatarUrl?: string; // Custom uploaded image (Data URL)
  avatarEmoji?: string; // E.g. '🐨', '🦁', '🌟', etc.
  bio?: string; // "나만의 한 줄 다짐"
  ageGroup?: string;
  gender?: string;
  routineCountGoal?: string;
  focusArea?: string;
  focusTimeOfDay?: string;
  accountType?: 'guest' | 'linked';
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
  practitionerCount?: number;
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
  unlockedAt?: string;
  progressPercent?: number;
}

export type SoundEffectType = 'rain' | 'birds' | 'cafe' | 'mute';

// 할일 및 아이디어 창고 메모장 모델 (Request 2)
export interface IdeaMemo {
  id: string;
  title: string;
  content: string;
  type: 'todo' | 'idea' | 'memo';
  completed?: boolean;
  tags?: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  deletedAt?: string; // ISO string when moved to trash (7일 보관 후 영구 삭제)
}

// 운영자 문의 내역 게시판 모델 (Request 8)
export interface CustomerInquiry {
  id: string;
  category: string;
  subject: string;
  body: string;
  userEmail: string;
  userName: string;
  createdAt: string; // ISO string
}
