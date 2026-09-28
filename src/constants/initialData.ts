import type { Category, Routine, RoutineLog, DailyReview, SleepLog } from '../types/routine';
import { format, subDays } from 'date-fns';


export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'health',
    name: '운동 & 건강',
    emoji: '🏃‍♂️',
    color: '#455538', // Sage Olive Green
    bgLight: '#EBF2E4',
    textDark: '#2E3A24',
  },
  {
    id: 'growth',
    name: '공부 & 자기계발',
    emoji: '📚',
    color: '#795336', // Terracotta Clay
    bgLight: '#FCEEE3',
    textDark: '#523620',
  },
  {
    id: 'life',
    name: '생활 & 습관',
    emoji: '🌿',
    color: '#536345', // Olive Moss
    bgLight: '#F0F5EC',
    textDark: '#334027',
  },
  {
    id: 'mind',
    name: '마음 & 멘탈',
    emoji: '🧘',
    color: '#8C652D', // Organic Honey Amber
    bgLight: '#FBF4E7',
    textDark: '#5B3F18',
  },
  {
    id: 'hobby',
    name: '취미 & 힐링',
    emoji: '🎨',
    color: '#8E5256', // Dusty Clay Rose
    bgLight: '#F9EDEE',
    textDark: '#5A2C30',
  },
];


export const INITIAL_ROUTINES: Routine[] = [
  {
    id: 'rt-1',
    title: '미온수 한 잔 마시기',
    emoji: '💧',
    categoryId: 'life',
    timeOfDay: 'morning',
    reminderTime: '07:00',
    repeatType: 'daily',
    createdAt: new Date().toISOString(),
    order: 1,
  },
  {
    id: 'rt-2',
    title: '아침 가벼운 스트레칭 10분',
    emoji: '🧘',
    categoryId: 'health',
    timeOfDay: 'morning',
    reminderTime: '07:30',
    repeatType: 'weekly_days',
    repeatDays: [1, 2, 3, 4, 5], // Mon to Fri
    createdAt: new Date().toISOString(),
    order: 2,
  },
  {
    id: 'rt-3',
    title: '비타민 및 영양제 챙겨먹기',
    emoji: '💊',
    categoryId: 'health',
    timeOfDay: 'afternoon',
    reminderTime: '13:00',
    repeatType: 'daily',
    createdAt: new Date().toISOString(),
    order: 3,
  },
  {
    id: 'rt-4',
    title: '독서 20분 또는 아티클 읽기',
    emoji: '📖',
    categoryId: 'growth',
    timeOfDay: 'evening',
    reminderTime: '20:30',
    repeatType: 'daily',
    createdAt: new Date().toISOString(),
    order: 4,
  },
  {
    id: 'rt-5',
    title: '유산소 운동 or 홈트레이닝',
    emoji: '🏃',
    categoryId: 'health',
    timeOfDay: 'evening',
    reminderTime: '19:00',
    repeatType: 'weekly_count',
    targetCountPerWeek: 3,
    createdAt: new Date().toISOString(),
    order: 5,
  },
  {
    id: 'rt-6',
    title: '하루 5분 회고 & 감사 일기',
    emoji: '✨',
    categoryId: 'mind',
    timeOfDay: 'night',
    reminderTime: '22:30',
    repeatType: 'daily',
    createdAt: new Date().toISOString(),
    order: 6,
  },
];

// Generate initial sample logs for the past 5 days
export const getInitialSampleLogs = (): { logs: RoutineLog[]; reviews: DailyReview[] } => {
  const logs: RoutineLog[] = [];
  const reviews: DailyReview[] = [];
  const today = new Date();

  // Create sample logs for past 5 days
  for (let i = 4; i >= 1; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');

    // rt-1 (Water): completed all days
    logs.push({
      routineId: 'rt-1',
      date: dateStr,
      completed: true,
      completedAt: '07:05',
      note: '시원하게 하루 시작!',
    });

    // rt-2 (Stretch): completed 3 out of 4 days
    if (i !== 2) {
      logs.push({
        routineId: 'rt-2',
        date: dateStr,
        completed: true,
        completedAt: '07:35',
        note: '어깨가 시원해짐',
      });
    }

    // rt-3 (Vitamins): completed
    logs.push({
      routineId: 'rt-3',
      date: dateStr,
      completed: true,
      completedAt: '13:10',
    });

    // rt-4 (Book): completed 2 days
    if (i % 2 === 0) {
      logs.push({
        routineId: 'rt-4',
        date: dateStr,
        completed: true,
        completedAt: '21:00',
        note: '마음에 드는 문장 필사 완료',
      });
    }

    // Sample reviews
    const moods: ('great' | 'good' | 'normal')[] = ['great', 'good', 'good', 'normal', 'great'];
    const notes = [
      '오늘 하루도 알차게 채워나간 느낌!',
      '퇴근 후 운동까지 마치니 뿌듯하다.',
      '피곤했지만 루틴을 지켜서 마음이 편안함.',
      '내일은 독서 시간을 조금 더 늘려봐야겠다.',
      '새로운 한 주 활기차게 시작!',
    ];

    reviews.push({
      date: dateStr,
      mood: moods[i % moods.length],
      note: notes[i % notes.length],
      updatedAt: new Date().toISOString(),
    });
  }

  return { logs, reviews };
};

export const getInitialSampleSleepLogs = (): SleepLog[] => {
  const list: SleepLog[] = [];
  const today = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    list.push({
      date: dateStr,
      bedtime: '23:30',
      wakeTime: '07:00',
      durationMinutes: 450, // 7h 30m
      quality: i === 1 ? 'good' : i === 3 ? 'fair' : 'great',
      note: i === 0 ? '알람 울리기 전에 개운하게 기상함 ✨' : '편안하게 숙면함',
      updatedAt: new Date().toISOString(),
    });
  }
  return list;
};
