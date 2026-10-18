import confetti from 'canvas-confetti';
import type { Routine, RoutineLog, DailyStats } from '../types/routine';
import { getDayOfWeek, parseDateKey, toDateKey } from './dateUtils';

import { subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export const isRoutineScheduledForDate = (routine: Routine, dateKey: string): boolean => {
  if (routine.archived) return false;

  // Check if routine was created/started on or before this date
  const routineStartDateKey = routine.startDate || toDateKey(new Date(routine.createdAt));
  if (dateKey < routineStartDateKey) {
    return false;
  }

  // Check optional endDate (Request 1: 투두+할일 루틴 종료일도 설정, 종료일은 필수가 아니도록)
  if (routine.endDate && dateKey > routine.endDate) {
    return false;
  }

  if (routine.repeatType === 'daily') {
    return true;
  }

  if (routine.repeatType === 'weekly_days') {
    const day = getDayOfWeek(dateKey);
    return Array.isArray(routine.repeatDays) && routine.repeatDays.includes(day);
  }

  if (routine.repeatType === 'weekly_count') {
    // For weekly count, it is scheduled throughout the week
    return true;
  }

  return true;
};

// Calculate completion count for a weekly_count routine in the week of given date
export const getWeeklyCountProgress = (
  routineId: string,
  logs: RoutineLog[],
  dateKey: string
): { completedCount: number; targetCount: number } => {
  const date = parseDateKey(dateKey);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((d) => toDateKey(d));

  const completedCount = logs.filter(
    (l) => l.routineId === routineId && weekDays.includes(l.date) && l.completed
  ).length;

  return {
    completedCount,
    targetCount: 0,
  };
};

export const getDailyStats = (
  routines: Routine[],
  logs: RoutineLog[],
  dateKey: string
): DailyStats => {
  const scheduled = routines.filter((r) => isRoutineScheduledForDate(r, dateKey));
  if (scheduled.length === 0) {
    return { totalRoutines: 0, completedRoutines: 0, percentage: 0 };
  }

  const completedCount = scheduled.filter((r) => {
    const log = logs.find((l) => l.routineId === r.id && l.date === dateKey);
    return log?.completed === true;
  }).length;

  const percentage = Math.round((completedCount / scheduled.length) * 100);

  return {
    totalRoutines: scheduled.length,
    completedRoutines: completedCount,
    percentage,
  };
};

// Calculate current streak for a routine
export const calculateRoutineStreak = (
  routine: Routine,
  logs: RoutineLog[],
  untilDateKey: string = toDateKey()
): number => {
  let streak = 0;
  let currentDate = parseDateKey(untilDateKey);

  const todayKey = toDateKey(currentDate);
  const todayLog = logs.find((l) => l.routineId === routine.id && l.date === todayKey);

  if (todayLog?.completed) {
    streak++;
    currentDate = subDays(currentDate, 1);
  } else {
    currentDate = subDays(currentDate, 1);
  }

  for (let i = 0; i < 90; i++) {
    const dateKey = toDateKey(currentDate);
    const routineCreateDateKey = toDateKey(new Date(routine.createdAt));
    if (dateKey < routineCreateDateKey) break;

    const isScheduled = isRoutineScheduledForDate(routine, dateKey);
    if (!isScheduled) {
      currentDate = subDays(currentDate, 1);
      continue;
    }

    const log = logs.find((l) => l.routineId === routine.id && l.date === dateKey);
    if (log?.completed) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
};

// Calculate overall user streak (User Rule: "불꽃은 1개라도 하면 계속 이어가는 것으로 해줘")
export const calculateOverallStreak = (
  _routines: Routine[],
  logs: RoutineLog[],
  untilDateKey: string = toDateKey()
): number => {
  let streak = 0;
  let currentDate = parseDateKey(untilDateKey);

  const todayKey = toDateKey(currentDate);
  const todayCompleted = logs.some((l) => l.date === todayKey && l.completed);

  if (todayCompleted) {
    streak++;
    currentDate = subDays(currentDate, 1);
  } else {
    // If not done yet today, check from yesterday so streak doesn't prematurely reset mid-day
    currentDate = subDays(currentDate, 1);
  }

  for (let i = 0; i < 365; i++) {
    const dateKey = toDateKey(currentDate);
    const hasCompleted = logs.some((l) => l.date === dateKey && l.completed);

    if (hasCompleted) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
};

// Calculate maximum historical streak
export const calculateMaxStreak = (logs: RoutineLog[]): number => {
  const completedDates = Array.from(
    new Set(logs.filter((l) => l.completed).map((l) => l.date))
  ).sort();

  if (completedDates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const prev = parseDateKey(completedDates[i - 1]);
    const curr = parseDateKey(completedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
};

// Calculate days with completed routines in given month (e.g. "2026-10")
export const calculateMonthlyActiveDays = (
  logs: RoutineLog[],
  yearMonthPrefix: string = toDateKey().slice(0, 7)
): number => {
  const monthCompletedDates = new Set(
    logs
      .filter((l) => l.completed && l.date.startsWith(yearMonthPrefix))
      .map((l) => l.date)
  );
  return monthCompletedDates.size;
};

// Encouraging daily comment based on progress
export const getEncouragementMessage = (percentage: number): string => {
  if (percentage === 100) {
    return '🎉 완벽해요! 오늘 모든 습관을 달성했습니다!';
  } else if (percentage >= 70) {
    return '🌿 멋져요! 오늘 목표의 대부분을 이뤄냈어요.';
  } else if (percentage >= 40) {
    return '✨ 한 걸음씩 꾸준히 나아가는 중이에요!';
  } else if (percentage > 0) {
    return '🌱 좋은 시작이에요. 첫 습관을 기분 좋게 완료했어요!';
  } else {
    return '☀️ 오늘 하루도 나만의 속도로 시작해볼까요?';
  }
};

// Confetti burst for 100% completion celebration - soft and gentle
export const triggerConfetti = (): void => {
  try {
    confetti({
      particleCount: 35,
      spread: 55,
      ticks: 120,
      gravity: 0.8,
      scalar: 0.85,
      origin: { y: 0.65 },
      colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#fbbf24', '#f472b6'],
    });
  } catch (err) {
    console.error('Confetti error:', err);
  }
};

// 31+ Daily Inspiring Habit Quotes (Request 3)
export const DAILY_HABIT_QUOTES: string[] = [
  '작은 습관이 모여 위대한 변화를 만듭니다.',
  '오늘 한 번의 실천이 내일의 나를 바꿉니다.',
  '완벽하지 않아도 괜찮아요, 시작한 것만으로도 충분합니다.',
  '습관은 나를 사랑하는 가장 다정한 방법입니다.',
  '어제보다 1% 나아진 오늘을 응원해요.',
  '느려도 괜찮아요. 중요한 것은 멈추지 않는 것입니다.',
  '스스로와의 작은 약속을 지켰을 때 자존감이 자라납니다.',
  '오늘 흘린 땀과 정성은 결코 사라지지 않아요.',
  '기분은 순간이지만, 습관은 평생을 갑니다.',
  '힘든 날엔 가볍게, 좋은 날엔 조금 더 나아가 보세요.',
  '마음먹은 순간 이미 절반은 이뤄낸 거예요.',
  '습관의 뿌리가 깊으면 어떤 흔들림에도 단단합니다.',
  '오늘 나를 위해 물 한 잔, 가벼운 스트레칭부터 시작해요.',
  '남과 비교하지 말고, 오직 어제의 나와 비교하세요.',
  '작은 습관 하나가 하루 전체의 리듬을 바꿉니다.',
  '꾸준함은 평범함을 비범함으로 바꾸는 가장 강력한 마법입니다.',
  '지금의 노력이 미래의 당신에게 큰 선물이 될 거예요.',
  '오늘 하루도 나만의 속도로 씩씩하게 걸어가요.',
  '성공의 비결은 매일 반복되는 작은 일상 속에 있습니다.',
  '나를 아끼는 마음으로 오늘 하루를 따뜻하게 채워보세요.',
  '지쳤다면 쉬어가도 좋아요, 포기하지만 않으면 됩니다.',
  '내가 만든 좋은 습관이 결국 나를 만들어 줍니다.',
  '오늘 실천한 10분이 내일의 1시간보다 값집니다.',
  '작은 성취들이 모여 커다란 자신감이 됩니다.',
  '숨을 깊게 들이쉬고, 지금 이 순간에 집중해 보세요.',
  '하루의 시작을 긍정의 눈빛으로 맞이해 주세요.',
  '단단한 일상은 나를 지켜주는 가장 든든한 방패입니다.',
  '오늘도 내 삶의 멋진 주인공으로 살아가는 당신을 응원해요.',
  '작은 습관의 씨앗이 내일 울창한 숲이 될 거예요.',
  '스스로에게 따뜻한 칭찬 한마디를 건네보세요.',
  '매일 쌓이는 모어해빗과 함께 기적 같은 하루를 만드세요.',
];

// Returns deterministic daily quote based on dateKey (YYYY-MM-DD)
export const getDailyMotivationalQuote = (dateKey: string): string => {
  if (!dateKey) return DAILY_HABIT_QUOTES[0];
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_HABIT_QUOTES.length;
  return DAILY_HABIT_QUOTES[index];
};

