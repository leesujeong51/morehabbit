import confetti from 'canvas-confetti';
import type { Routine, RoutineLog, DailyStats } from '../types/routine';
import { getDayOfWeek, parseDateKey, toDateKey } from './dateUtils';

import { subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export const isRoutineScheduledForDate = (routine: Routine, dateKey: string): boolean => {
  if (routine.archived) return false;

  // Check if routine was created before or on this date
  const routineCreateDateKey = toDateKey(new Date(routine.createdAt));
  if (dateKey < routineCreateDateKey) {
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

  // Check if today was scheduled and completed, or if not completed yet check from yesterday
  const todayKey = toDateKey(currentDate);
  const todayLog = logs.find((l) => l.routineId === routine.id && l.date === todayKey);

  // If today is completed, start from today. If not yet completed today, start checking from yesterday
  if (todayLog?.completed) {
    streak++;
    currentDate = subDays(currentDate, 1);
  } else {
    // If today is not completed yet, start from yesterday
    currentDate = subDays(currentDate, 1);
  }

  // Look back up to 90 days
  for (let i = 0; i < 90; i++) {
    const dateKey = toDateKey(currentDate);
    const routineCreateDateKey = toDateKey(new Date(routine.createdAt));
    if (dateKey < routineCreateDateKey) break;

    const isScheduled = isRoutineScheduledForDate(routine, dateKey);
    if (!isScheduled) {
      // Skip unscheduled days without breaking streak
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

// Calculate overall user streak (days with at least 80% or >=1 routine completed)
export const calculateOverallStreak = (
  routines: Routine[],
  logs: RoutineLog[],
  untilDateKey: string = toDateKey()
): number => {
  let streak = 0;
  let currentDate = parseDateKey(untilDateKey);

  const todayKey = toDateKey(currentDate);
  const todayStats = getDailyStats(routines, logs, todayKey);

  if (todayStats.completedRoutines > 0 && todayStats.percentage >= 50) {
    streak++;
    currentDate = subDays(currentDate, 1);
  } else {
    currentDate = subDays(currentDate, 1);
  }

  for (let i = 0; i < 60; i++) {
    const dateKey = toDateKey(currentDate);
    const stats = getDailyStats(routines, logs, dateKey);

    if (stats.totalRoutines > 0 && stats.percentage >= 50) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
};

// Encouraging daily comment based on progress
export const getEncouragementMessage = (percentage: number): string => {
  if (percentage === 100) {
    return '🎉 완벽해요! 오늘 모든 루틴을 달성했습니다!';
  } else if (percentage >= 70) {
    return '🌿 멋져요! 오늘 목표의 대부분을 이뤄냈어요.';
  } else if (percentage >= 40) {
    return '✨ 한 걸음씩 꾸준히 나아가는 중이에요!';
  } else if (percentage > 0) {
    return '🌱 좋은 시작이에요. 첫 루틴을 기분 좋게 완료했어요!';
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
