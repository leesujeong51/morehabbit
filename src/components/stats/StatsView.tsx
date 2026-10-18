import React, { useState, useMemo, useEffect } from 'react';
import type { Routine, RoutineLog, DailyReview, Category } from '../../types/routine';
import {
  getDailyStats,
  calculateOverallStreak,
  calculateMaxStreak,
  calculateMonthlyActiveDays,
} from '../../utils/routineUtils';
import { getWeekDates, isDateToday, formatDisplayDate, toDateKey } from '../../utils/dateUtils';
import type { WeekDateItem } from '../../utils/dateUtils';
import { getTodayPomodoroStats, getWeeklyPomodoroStats } from '../../utils/pomodoroStorage';
import { useLanguage, getDayNamesForLanguage } from '../../utils/i18n';
import {
  TRACKING_DEFINITIONS,
  getActiveTrackerIds,
  getDailyTrackingLogs,
  CONDITION_EMOJIS,
  trackerTitle,
  trackerUnit,
  conditionLabel,
} from '../../utils/trackingStorage';
import type { DailyTrackingLogs } from '../../utils/trackingStorage';

interface StatsViewProps {
  routines: Routine[];
  logs: RoutineLog[];
  reviews?: DailyReview[];
  categories: Category[];
  userName?: string;
  onToggleComplete?: (id: string, dateKey: string) => void;
  onSelectDate?: (dateKey: string) => void;
}

interface DayStatItem {
  key: string;
  dayLabel: string;
  dateNumber: string;
  percentage: number;
  completed: number;
  total: number;
  isToday: boolean;
}

export const StatsView: React.FC<StatsViewProps> = ({
  routines,
  logs,
  categories,
  userName = 'SJ',
  onSelectDate,
}) => {
  const { language, t } = useLanguage();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  // Real Streak Calculation (불꽃 1개라도 실천 시 유지)
  const streak = useMemo(() => {
    return calculateOverallStreak(routines, logs);
  }, [routines, logs]);

  // Real Max Streak & Monthly Active Days
  const maxStreak = useMemo(() => {
    return calculateMaxStreak(logs);
  }, [logs]);

  const monthlyActiveDays = useMemo(() => {
    return calculateMonthlyActiveDays(logs);
  }, [logs]);

  // Compute 7 days of the current week
  const weekDates = useMemo(() => {
    return getWeekDates(new Date());
  }, []);

  const weekDayStats: DayStatItem[] = useMemo(() => {
    const dayNames = getDayNamesForLanguage(language);
    // Monday start: 1, 2, 3, 4, 5, 6, 0
    const daysMonStart = [
      dayNames[1],
      dayNames[2],
      dayNames[3],
      dayNames[4],
      dayNames[5],
      dayNames[6],
      dayNames[0],
    ];
    return weekDates.map((item: WeekDateItem, idx: number) => {
      const stats = getDailyStats(routines, logs, item.key);
      const isToday = isDateToday(item.key);
      return {
        key: item.key,
        dayLabel: daysMonStart[idx] || item.day,
        dateNumber: item.day,
        percentage: stats.totalRoutines > 0 ? stats.percentage : 0,
        completed: stats.completedRoutines,
        total: stats.totalRoutines,
        isToday,
      };
    });
  }, [weekDates, routines, logs, language]);

  // Real Pomodoro Focus stats
  const pomoToday = useMemo(() => getTodayPomodoroStats(), []);
  const pomoWeekly = useMemo(() => getWeeklyPomodoroStats(), []);

  // Average weekly rate
  const averageRate = useMemo(() => {
    const valid = weekDayStats.filter((d: DayStatItem) => d.total > 0);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc: number, curr: DayStatItem) => acc + curr.percentage, 0);
    return Math.round(sum / valid.length);
  }, [weekDayStats]);

  // Monthly metrics
  const currentMonthKey = toDateKey().slice(0, 7); // e.g. "2026-10"
  const monthlyLogs = useMemo(() => {
    return logs.filter((l) => l.date.startsWith(currentMonthKey) && l.completed);
  }, [logs, currentMonthKey]);

  // Yearly metrics
  const currentYearKey = toDateKey().slice(0, 4); // e.g. "2026"
  const yearlyLogs = useMemo(() => {
    return logs.filter((l) => l.date.startsWith(currentYearKey) && l.completed);
  }, [logs, currentYearKey]);
  const yearlyActiveDays = useMemo(() => {
    return new Set(yearlyLogs.map((l) => l.date)).size;
  }, [yearlyLogs]);

  // Daily Life Trackers Trends (User Request 2: 홈에서 기록한 내용의 통계 연동 및 흐름 시각화)
  const [activeTrackerIds, setActiveTrackerIds] = useState<string[]>(() => getActiveTrackerIds());
  const [trackingLogs, setTrackingLogs] = useState<DailyTrackingLogs>(() => getDailyTrackingLogs());
  const [selectedTrackerId, setSelectedTrackerId] = useState<string>(() => {
    const ids = getActiveTrackerIds();
    return ids[0] || 'track-steps';
  });

  useEffect(() => {
    const handleLogsUpdate = () => setTrackingLogs(getDailyTrackingLogs());
    const handleTrackersUpdate = () => {
      const nextIds = getActiveTrackerIds();
      setActiveTrackerIds(nextIds);
      if (!nextIds.includes(selectedTrackerId) && nextIds.length > 0) {
        setSelectedTrackerId(nextIds[0]);
      }
    };
    window.addEventListener('morehabbit-tracking-logs-updated', handleLogsUpdate);
    window.addEventListener('morehabbit-trackers-updated', handleTrackersUpdate);
    return () => {
      window.removeEventListener('morehabbit-tracking-logs-updated', handleLogsUpdate);
      window.removeEventListener('morehabbit-trackers-updated', handleTrackersUpdate);
    };
  }, [selectedTrackerId]);

  const activeTrackers = useMemo(() => {
    return TRACKING_DEFINITIONS.filter((def) => activeTrackerIds.includes(def.id));
  }, [activeTrackerIds]);

  const currentTracker = useMemo(() => {
    return (
      activeTrackers.find((d) => d.id === selectedTrackerId) ||
      activeTrackers[0] ||
      TRACKING_DEFINITIONS[0]
    );
  }, [activeTrackers, selectedTrackerId]);

  const todayValue = useMemo(() => {
    return trackingLogs[toDateKey()]?.[currentTracker.id]?.value;
  }, [trackingLogs, currentTracker]);

  const weeklyTrackerData = useMemo(() => {
    const dayNames = getDayNamesForLanguage(language);
    // Monday start: 1, 2, 3, 4, 5, 6, 0
    const daysMonStart = [
      dayNames[1],
      dayNames[2],
      dayNames[3],
      dayNames[4],
      dayNames[5],
      dayNames[6],
      dayNames[0],
    ];

    const rawValues = weekDates.map((item, idx) => {
      const log = trackingLogs[item.key]?.[currentTracker.id];
      const val = log?.value;
      return {
        dateKey: item.key,
        dayLabel: daysMonStart[idx] || item.day,
        value: val,
      };
    });

    const numericVals = rawValues
      .map((r) =>
        r.value !== undefined && currentTracker.inputType === 'condition'
          ? CONDITION_EMOJIS[String(r.value)]?.score || 50
          : Number(r.value)
      )
      .filter((n) => !isNaN(n) && n > 0);
    const maxVal = Math.max(...numericVals, currentTracker.defaultGoal || 100);

    return rawValues.map((r) => {
      const num =
        r.value !== undefined && currentTracker.inputType === 'condition'
          ? CONDITION_EMOJIS[String(r.value)]?.score || 50
          : Number(r.value || 0);
      const percentHeight = maxVal > 0 ? Math.min(100, Math.round((num / maxVal) * 100)) : 10;
      return {
        ...r,
        percentHeight,
      };
    });
  }, [weekDates, trackingLogs, currentTracker, language]);

  const trackerSummary = useMemo(() => {
    const validLogs = weeklyTrackerData.filter((d) => d.value !== undefined && d.value !== '');
    const loggedDays = validLogs.length;
    if (loggedDays === 0) return { avg: '-', max: '-', loggedDays: 0 };

    if (currentTracker.inputType === 'condition') {
      const best = validLogs[validLogs.length - 1]?.value;
      return {
        avg: `${Math.round((loggedDays / 7) * 100)}% 실천`,
        max: best ? (conditionLabel(String(best), language)) : '-',
        loggedDays,
      };
    }

    const nums = validLogs.map((d) => Number(d.value)).filter((n) => !isNaN(n));
    if (nums.length === 0) return { avg: '-', max: '-', loggedDays };

    const sum = nums.reduce((a, b) => a + b, 0);
    const isDecimal = currentTracker.id === 'track-weight' || currentTracker.id === 'track-sleep';
    const avg = isDecimal ? (sum / nums.length).toFixed(1) : Math.round(sum / nums.length).toLocaleString();
    const max = Math.max(...nums).toLocaleString();

    return {
      avg: `${avg} ${trackerUnit(currentTracker, language)}`,
      max: `${max} ${trackerUnit(currentTracker, language)}`,
      loggedDays,
    };
  }, [weeklyTrackerData, currentTracker]);

  // Month Days calculation for Monthly Habit Calendar Grid (User Request 4: 월간 달력 및 실천 현황)
  const monthDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon...
    // Mon start offset: 0 for Mon(1), 1 for Tue(2)... 6 for Sun(0)
    const offset = (firstDayOfWeek + 6) % 7;

    const days = [];
    for (let i = 1; i <= totalDays; i++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const dateKey = `${year}-${mStr}-${dStr}`;
      const stats = getDailyStats(routines, logs, dateKey);
      const isToday = isDateToday(dateKey);
      days.push({
        day: i,
        dateKey,
        percentage: stats.totalRoutines > 0 ? stats.percentage : 0,
        completed: stats.completedRoutines,
        total: stats.totalRoutines,
        isToday,
      });
    }
    return { totalDays, offset, days };
  }, [routines, logs]);

  // Monthly Tracker Data for Current Month (User Request 4: 월간 선택 시 월간 추이 제공)
  const monthlyTrackerData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const rawValues = [];
    for (let i = 1; i <= totalDays; i++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const dateKey = `${year}-${mStr}-${dStr}`;
      const log = trackingLogs[dateKey]?.[currentTracker.id];
      rawValues.push({
        dayNumber: i,
        dateKey,
        value: log?.value,
      });
    }

    const numericVals = rawValues
      .map((r) =>
        r.value !== undefined && currentTracker.inputType === 'condition'
          ? CONDITION_EMOJIS[String(r.value)]?.score || 50
          : Number(r.value)
      )
      .filter((n) => !isNaN(n) && n > 0);
    const maxVal = Math.max(...numericVals, currentTracker.defaultGoal || 100);

    return rawValues.map((r) => {
      const num =
        r.value !== undefined && currentTracker.inputType === 'condition'
          ? CONDITION_EMOJIS[String(r.value)]?.score || 50
          : Number(r.value || 0);
      const percentHeight = maxVal > 0 ? Math.min(100, Math.round((num / maxVal) * 100)) : 10;
      return {
        ...r,
        percentHeight,
      };
    });
  }, [trackingLogs, currentTracker]);

  const monthlyTrackerSummary = useMemo(() => {
    const validLogs = monthlyTrackerData.filter((d) => d.value !== undefined && d.value !== '');
    const loggedDays = validLogs.length;
    const totalDays = monthlyTrackerData.length;
    if (loggedDays === 0) return { avg: '-', max: '-', loggedDays: 0, totalDays };

    if (currentTracker.inputType === 'condition') {
      const best = validLogs[validLogs.length - 1]?.value;
      return {
        avg: `${Math.round((loggedDays / totalDays) * 100)}% 실천`,
        max: best ? (conditionLabel(String(best), language)) : '-',
        loggedDays,
        totalDays,
      };
    }

    const nums = validLogs.map((d) => Number(d.value)).filter((n) => !isNaN(n));
    if (nums.length === 0) return { avg: '-', max: '-', loggedDays, totalDays };

    const sum = nums.reduce((a, b) => a + b, 0);
    const isDecimal = currentTracker.id === 'track-weight' || currentTracker.id === 'track-sleep';
    const avg = isDecimal ? (sum / nums.length).toFixed(1) : Math.round(sum / nums.length).toLocaleString();
    const max = Math.max(...nums).toLocaleString();

    return {
      avg: `${avg} ${trackerUnit(currentTracker, language)}`,
      max: `${max} ${trackerUnit(currentTracker, language)}`,
      loggedDays,
      totalDays,
    };
  }, [monthlyTrackerData, currentTracker]);

  // Yearly Tracker Data for 12 Months
  const yearlyTrackerData = useMemo(() => {
    const year = toDateKey().slice(0, 4);
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const monthNames =
      language === 'en'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : language === 'ja'
        ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        : ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    const list = months.map((mStr, idx) => {
      const prefix = `${year}-${mStr}`;
      const monthVals: number[] = [];
      Object.entries(trackingLogs).forEach(([dateKey, trackers]) => {
        if (dateKey.startsWith(prefix) && trackers[currentTracker.id]?.value !== undefined && trackers[currentTracker.id]?.value !== '') {
          const v = trackers[currentTracker.id]?.value;
          const num =
            currentTracker.inputType === 'condition'
              ? CONDITION_EMOJIS[String(v)]?.score || 50
              : Number(v);
          if (!isNaN(num) && num > 0) monthVals.push(num);
        }
      });

      const avg =
        monthVals.length > 0
          ? Math.round(monthVals.reduce((a, b) => a + b, 0) / monthVals.length)
          : 0;
      return {
        monthLabel: monthNames[idx],
        avg,
        count: monthVals.length,
      };
    });

    const maxVal = Math.max(...list.map((l) => l.avg), currentTracker.defaultGoal || 100);
    return list.map((l) => ({
      ...l,
      percentHeight: maxVal > 0 && l.avg > 0 ? Math.min(100, Math.round((l.avg / maxVal) * 100)) : 6,
    }));
  }, [trackingLogs, currentTracker, language]);

  const yearlyTrackerSummary = useMemo(() => {
    const activeMonths = yearlyTrackerData.filter((m) => m.count > 0);
    if (activeMonths.length === 0) return { avg: '-', max: '-', loggedDays: 0 };

    const totalLogs = yearlyTrackerData.reduce((acc, m) => acc + m.count, 0);
    if (currentTracker.inputType === 'condition') {
      return {
        avg: `${activeMonths.length}개월 기록`,
        max: '활력 유지',
        loggedDays: totalLogs,
      };
    }

    const allAvgs = activeMonths.map((m) => m.avg);
    const sum = allAvgs.reduce((a, b) => a + b, 0);
    const avg = (sum / allAvgs.length).toLocaleString();
    const max = Math.max(...allAvgs).toLocaleString();

    return {
      avg: `${avg} ${trackerUnit(currentTracker, language)}`,
      max: `${max} ${trackerUnit(currentTracker, language)}`,
      loggedDays: totalLogs,
    };
  }, [yearlyTrackerData, currentTracker]);

  // Category breakdown calculation
  const categoryBreakdown = useMemo(() => {
    const counts: { [key: string]: number } = {};
    let totalCount = 0;

    routines.forEach((r) => {
      const catId = r.categoryId || 'cat-life';
      counts[catId] = (counts[catId] || 0) + 1;
      totalCount++;
    });

    if (totalCount === 0) {
      return [
        { name: language === 'en' ? 'Workout & Health' : language === 'ja' ? '運動・健康' : '운동 & 건강', percent: 40, color: '#10533f' },
        { name: language === 'en' ? 'Mind & Mental' : language === 'ja' ? '心・メンタル' : '마음 & 멘탈', percent: 25, color: '#2e6b56' },
        { name: language === 'en' ? 'Study & Growth' : language === 'ja' ? '勉強・自己啓発' : '공부 & 자기계발', percent: 20, color: '#fc934f' },
        { name: language === 'en' ? 'Daily & Habits' : language === 'ja' ? '生活・習慣' : '생활 & 습관', percent: 15, color: '#95d3ba' },
      ];
    }

    const defaultColors = ['#1d4ed8', '#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    const getLocalizedCatName = (cat?: Category) => {
      if (!cat) return language === 'en' ? 'Other Habits' : language === 'ja' ? 'その他習慣' : '기타 습관';
      const id = (cat.id || '').toLowerCase();
      const n = (cat.name || '').trim();
      if (language === 'en') {
        if (id.includes('health') || n.includes('운동') || n.includes('건강')) return 'Workout & Health';
        if (id.includes('growth') || id.includes('study') || n.includes('공부') || n.includes('자기계발')) return 'Study & Growth';
        if (id.includes('life') || n.includes('생활') || n.includes('습관')) return 'Daily & Habits';
        if (id.includes('mind') || n.includes('마음') || n.includes('멘탈')) return 'Mind & Mental';
        if (id.includes('hobby') || n.includes('취미') || n.includes('힐링')) return 'Hobby & Healing';
        return cat.name;
      }
      if (language === 'ja') {
        if (id.includes('health') || n.includes('운동') || n.includes('건강')) return '運動・健康';
        if (id.includes('growth') || id.includes('study') || n.includes('공부') || n.includes('자기계발')) return '勉強・自己啓発';
        if (id.includes('life') || n.includes('생활') || n.includes('습관')) return '生活・習慣';
        if (id.includes('mind') || n.includes('마음') || n.includes('멘탈')) return '心・メンタル';
        if (id.includes('hobby') || n.includes('취미') || n.includes('힐링')) return '趣味・癒し';
        return cat.name;
      }
      return cat.name;
    };

    return Object.entries(counts).map(([catId, count], idx) => {
      const cat = categories.find((c) => c.id === catId);
      const percent = Math.round((count / totalCount) * 100);
      const catName = getLocalizedCatName(cat);
      return {
        name: cat ? `${cat.emoji} ${catName}` : (language === 'en' ? 'Other Habits' : language === 'ja' ? 'その他習慣' : '기타 습관'),
        percent,
        color: cat?.color || defaultColors[idx % defaultColors.length],
      };
    });
  }, [routines, categories, language]);

  // Donut circumference = 2 * PI * 40 = 251.32
  const circumference = 251.32;
  let accumulatedPercent = 0;

  // Check if any day was 100% all-clear
  const hasAllClearDay = useMemo(() => {
    const distinctDates = Array.from(new Set(logs.map((l) => l.date)));
    return distinctDates.some((date) => {
      const stats = getDailyStats(routines, logs, date);
      return stats.totalRoutines > 0 && stats.percentage === 100;
    });
  }, [routines, logs]);

  // 10 Diverse Dynamic Badges (Request 5: 달성한 뱃지는 다양하게 만들어주고 연동되게 해)
  const bestStreak = Math.max(streak, maxStreak);
  const completedLogsCount = logs.filter((l) => l.completed).length;

  const dayUnit = language === 'en' ? ' days' : language === 'ja' ? '日' : '일';
  const doneLabel = language === 'en' ? 'Completed' : language === 'ja' ? '達成完了' : '달성 완료';

  const badges = [
    {
      id: 'badge-first-step',
      title: language === 'en' ? 'First Step' : language === 'ja' ? '最初の一歩' : '첫 걸음의 시작',
      desc: language === 'en' ? 'Completed your very first habit' : language === 'ja' ? '最初の習慣の実践を完了しました' : '첫 번째 습관 실천을 완료했어요',
      icon: 'flag',
      isUnlocked: completedLogsCount >= 1,
      progressText: completedLogsCount >= 1 ? `${doneLabel} 🎉` : (language === 'en' ? '0 / 1 Done' : language === 'ja' ? '0 / 1 完了' : '0 / 1 완료'),
      progressPercent: completedLogsCount >= 1 ? 100 : 0,
      levelBadge: 'LV.1 🌟',
      badgeColor: 'from-amber-400 to-orange-500',
    },
    {
      id: 'badge-streak-3',
      title: language === 'en' ? '3-Day Spark' : language === 'ja' ? '3日連続の炎' : '3일 연속 불꽃',
      desc: language === 'en' ? 'Kept the flame burning for 3 straight days' : language === 'ja' ? '3日間継続して炎を灯しました' : '3일 동안 꾸준히 불꽃을 밝혔어요',
      icon: 'local_fire_department',
      isUnlocked: bestStreak >= 3,
      progressText: bestStreak >= 3 ? `${doneLabel} 🔥` : `${bestStreak} / 3${dayUnit} (${Math.min(100, Math.round((bestStreak / 3) * 100))}%)`,
      progressPercent: Math.min(100, Math.round((bestStreak / 3) * 100)),
      levelBadge: 'LV.1 🔥',
      badgeColor: 'from-rose-500 to-red-600',
    },
    {
      id: 'badge-streak-7',
      title: language === 'en' ? 'Weekly Miracle' : language === 'ja' ? '一週間の奇跡' : '일주일의 기적',
      desc: language === 'en' ? 'Achieved small success with 7-day streak' : language === 'ja' ? '7日連続実践で小さな成功を掴みました' : '7일 연속 실천으로 작은 성공을 이뤘어요',
      icon: 'workspace_premium',
      isUnlocked: bestStreak >= 7,
      progressText: bestStreak >= 7 ? `${doneLabel} 🏅` : `${bestStreak} / 7${dayUnit} (${Math.min(100, Math.round((bestStreak / 7) * 100))}%)`,
      progressPercent: Math.min(100, Math.round((bestStreak / 7) * 100)),
      levelBadge: 'LV.2 🏅',
      badgeColor: 'from-emerald-400 to-teal-600',
    },
    {
      id: 'badge-streak-21',
      title: language === 'en' ? '21-Day Habit Revolution' : language === 'ja' ? '21日習慣革命' : '21일 습관 혁명',
      desc: language === 'en' ? 'Formed a lasting habit backed by neuroscience' : language === 'ja' ? '脳科学が証明した21日習慣の定着' : '뇌과학이 증명한 21일 습관 정착',
      icon: 'psychology',
      isUnlocked: bestStreak >= 21,
      progressText: bestStreak >= 21 ? `${doneLabel} 🧠` : `${bestStreak} / 21${dayUnit} (${Math.min(100, Math.round((bestStreak / 21) * 100))}%)`,
      progressPercent: Math.min(100, Math.round((bestStreak / 21) * 100)),
      levelBadge: 'LV.3 👑',
      badgeColor: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'badge-monthly-10',
      title: language === 'en' ? 'Monthly Champ' : language === 'ja' ? '今月の継続マスター' : '이달의 성실왕',
      desc: language === 'en' ? 'Practiced for 10 or more days this month' : language === 'ja' ? '今月10日以上コツコツ実践しました' : '이번 달 10일 이상 꾸준히 실천했어요',
      icon: 'calendar_month',
      isUnlocked: monthlyActiveDays >= 10,
      progressText: monthlyActiveDays >= 10 ? `${doneLabel} 📅` : `${monthlyActiveDays} / 10${dayUnit} (${Math.min(100, Math.round((monthlyActiveDays / 10) * 100))}%)`,
      progressPercent: Math.min(100, Math.round((monthlyActiveDays / 10) * 100)),
      levelBadge: 'LV.2 🗓️',
      badgeColor: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'badge-all-clear',
      title: language === 'en' ? 'Perfect All-Clear' : language === 'ja' ? 'パーフェクト・オールクリア' : '퍼펙트 올클리어',
      desc: language === 'en' ? 'Completed 100% of all registered habits in a day' : language === 'ja' ? '一日に登録された全習慣を100%達成' : '하루 등록된 모든 습관을 100% 완주',
      icon: 'verified',
      isUnlocked: hasAllClearDay,
      progressText: hasAllClearDay ? `${doneLabel} 💯` : (language === 'en' ? 'Challenging 100%' : language === 'ja' ? '一日100%に挑戦中' : '하루 100% 도전 중'),
      progressPercent: hasAllClearDay ? 100 : averageRate,
      levelBadge: 'LV.2 💯',
      badgeColor: 'from-teal-400 to-emerald-600',
    },
    {
      id: 'badge-pomo-starter',
      title: language === 'en' ? 'First Focus Taste' : language === 'ja' ? '集中の第一歩' : '몰입의 첫맛',
      desc: language === 'en' ? 'Completed your first Pomodoro timer session' : language === 'ja' ? '最初のポモドーロ集中タイマーを完走' : '첫 뽀모도로 집중 타이머를 완주했어요',
      icon: 'timer',
      isUnlocked: pomoToday.count > 0 || pomoWeekly.totalCount > 0,
      progressText: pomoToday.count > 0 || pomoWeekly.totalCount > 0 ? `${doneLabel} 🍅` : (language === 'en' ? 'Try first Pomodoro' : language === 'ja' ? 'ポモドーロに初挑戦' : '첫 뽀모도로 도전하기'),
      progressPercent: pomoToday.count > 0 || pomoWeekly.totalCount > 0 ? 100 : 0,
      levelBadge: 'LV.1 🍅',
      badgeColor: 'from-rose-400 to-orange-500',
    },
    {
      id: 'badge-pomo-master',
      title: language === 'en' ? 'Ultra-Focus Master' : language === 'ja' ? '超集中マスター' : '초집중 마스터',
      desc: language === 'en' ? 'Completed 5+ weekly Pomodoro focus sessions' : language === 'ja' ? '週間5回以上のポモドーロ集中セッション完了' : '주간 5회 이상 뽀모도로 몰입 세션 완료',
      icon: 'bolt',
      isUnlocked: pomoWeekly.totalCount >= 5,
      progressText: pomoWeekly.totalCount >= 5 ? `${doneLabel} ⚡` : `${pomoWeekly.totalCount} / 5${language === 'en' ? ' sessions' : language === 'ja' ? '回' : '회'} (${Math.min(100, Math.round((pomoWeekly.totalCount / 5) * 100))}%)`,
      progressPercent: Math.min(100, Math.round((pomoWeekly.totalCount / 5) * 100)),
      levelBadge: 'LV.3 ⚡',
      badgeColor: 'from-amber-500 to-yellow-600',
    },
    {
      id: 'badge-routine-collector',
      title: language === 'en' ? 'Habit Architect' : language === 'ja' ? '習慣アーキテクト' : '습관 아키텍트',
      desc: language === 'en' ? 'Designed 5 or more custom habits' : language === 'ja' ? '自分だけの習慣を5個以上作成' : '나만의 맞춤 습관을 5개 이상 설계',
      icon: 'checklist',
      isUnlocked: routines.filter((r) => !r.archived).length >= 5,
      progressText: routines.filter((r) => !r.archived).length >= 5 ? `${doneLabel} 🎯` : `${routines.filter((r) => !r.archived).length} / 5${language === 'en' ? '' : language === 'ja' ? '個' : '개'}`,
      progressPercent: Math.min(100, Math.round((routines.filter((r) => !r.archived).length / 5) * 100)),
      levelBadge: 'LV.2 🎯',
      badgeColor: 'from-cyan-500 to-blue-600',
    },
  ];

  const unlockedBadgeCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="flex flex-col w-full pb-8 gap-space-lg select-none">
      {/* 1. Period Selector Segment (주간 / 월간 / 연간) */}
      <div className="pt-2">
        <div className="bg-surface-container-low p-1 rounded-xl flex items-center justify-between border border-surface-container/60">
          <button
            onClick={() => setPeriod('weekly')}
            className={`flex-1 py-2 text-center rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
              period === 'weekly'
                ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
          >
            {t.stats.periodWeekly}
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`flex-1 py-2 text-center rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
              period === 'monthly'
                ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
          >
            {t.stats.periodMonthly}
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`flex-1 py-2 text-center rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
              period === 'yearly'
                ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
          >
            {t.stats.periodYearly}
          </button>
        </div>
      </div>

      {/* 3. Conditional Period Content (주간 / 월간 / 연간) */}
      {period === 'weekly' && (
        <>
          {/* 2. Streak & Consistency Highlight Card (User Request 2: 주간에만 며칠째 유지 표시) */}
          <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-secondary text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                <span className="font-label-md text-label-md text-secondary font-bold tracking-tight">
                  {t.stats.streakTitle}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-bold bg-surface-container-low px-2 py-0.5 rounded-full">
                {streak > 0 ? t.stats.streakMaintaining : t.stats.streakStart}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-headline-lg-mobile text-[2.5rem] leading-none text-primary font-extrabold tracking-tight">
                {streak}
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {language === 'en' ? ' days streak maintained! 🔥' : language === 'ja' ? '日連続の炎を維持！🔥' : '일 연속 불꽃 유지! 🔥'}
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed break-keep">
              {t.stats.streakSubtitle.replace('{name}', userName)}
            </p>

            {/* Real Data Connected Grid: 최고 연속 기록 & 이번 달 실천 일수 */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-container/50">
              <div className="bg-surface-container-low p-2.5 rounded-xl">
                <span className="font-label-sm text-label-sm text-tertiary">{t.stats.bestStreakLabel}</span>
                <div className="font-headline-sm text-headline-sm text-primary font-bold mt-0.5">
                  {bestStreak}{language === 'en' ? ' days' : language === 'ja' ? '日' : '일'}
                </div>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl">
                <span className="font-label-sm text-label-sm text-tertiary">{t.stats.monthActiveDaysLabel}</span>
                <div className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5">
                  {monthlyActiveDays}{language === 'en' ? ' days' : language === 'ja' ? '日' : '일'}
                </div>
              </div>
            </div>
          </section>
          {/* Weekly Habit Achievements & Stamps (User Request 3: 잔디심기 대신 UI 통일성 있는 표현) */}
          <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/60 space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight flex items-center gap-1.5">
                  <span>📅</span>
                  <span>
                    {language === 'en'
                      ? 'Weekly Habit Milestones'
                      : language === 'ja'
                      ? '週間習慣達成スタンプ'
                      : '주간 습관 실천 현황'}
                  </span>
                </h3>
                <p className="font-label-sm text-label-sm text-tertiary mt-0.5">
                  {language === 'en'
                    ? 'Daily completion rates & streak stamps'
                    : language === 'ja'
                    ? '曜日別の達成率と継続スタンプ'
                    : '요일별 실천율과 연속 불꽃 스탬프'}
                </p>
              </div>
              <span className="font-label-sm text-label-sm font-bold text-primary bg-primary-fixed px-2.5 py-1 rounded-full">
                {averageRate}% {language === 'en' ? 'Avg' : language === 'ja' ? '平均' : '달성'}
              </span>
            </div>

            {/* Mon to Sun Habit Stamp Cards */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekDayStats.map((item: DayStatItem) => {
                const pct = item.percentage;
                const is100 = pct === 100;
                const isHigh = pct >= 70;
                const isMid = pct >= 40;
                const isLow = pct > 0;

                return (
                  <button
                    key={item.key}
                    onClick={() => onSelectDate && onSelectDate(item.key)}
                    className={`flex flex-col items-center py-2.5 px-1 rounded-2xl transition-all active:scale-95 cursor-pointer border ${
                      item.isToday
                        ? 'bg-primary/5 border-primary ring-2 ring-primary ring-offset-1 shadow-xs'
                        : is100
                        ? 'bg-amber-50/80 border-amber-200 shadow-2xs'
                        : isHigh
                        ? 'bg-emerald-50/80 border-emerald-200 shadow-2xs'
                        : isMid
                        ? 'bg-teal-50/60 border-teal-100'
                        : isLow
                        ? 'bg-slate-50 border-slate-200/80'
                        : 'bg-surface-container-low/60 border-transparent hover:bg-surface-container'
                    }`}
                    title={`${formatDisplayDate(item.key)}: ${pct}% ${
                      language === 'en' ? 'Completed' : language === 'ja' ? '達成' : '달성'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold mb-1.5 ${
                        item.isToday ? 'text-primary font-black' : 'text-on-surface'
                      }`}
                    >
                      {item.dayLabel}
                    </span>

                    {/* Visual Stamp Icon */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                      {is100 ? (
                        <span className="text-lg leading-none drop-shadow-xs">🔥</span>
                      ) : isHigh ? (
                        <span className="text-base leading-none">⭐</span>
                      ) : isMid ? (
                        <span className="text-base leading-none">🌱</span>
                      ) : isLow ? (
                        <span className="text-sm leading-none">💧</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>

                    <span
                      className={`text-xs font-bold mt-1.5 ${
                        item.isToday
                          ? 'text-primary font-black'
                          : is100
                          ? 'text-amber-800'
                          : pct > 0
                          ? 'text-on-surface'
                          : 'text-tertiary'
                      }`}
                    >
                      {pct > 0 ? `${pct}%` : '-'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Friendly Milestones Legend */}
            <div className="flex items-center justify-end flex-wrap gap-2.5 pt-1 text-xs text-tertiary">
              <span className="flex items-center gap-1 font-medium">
                <span>🔥</span> 100% {language === 'en' ? 'All-Clear' : language === 'ja' ? '達成' : '완벽 달성'}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span>⭐</span> 70%~
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span>🌱</span> 40%~
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span>💧</span> {language === 'en' ? 'Started' : language === 'ja' ? '実践開始' : '실천 시작'}
              </span>
            </div>
          </section>

          {/* Routine Completion Rate Bar Chart */}
          <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/60 space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                  {t.stats.dailyTrendTitle}
                </h3>
                <p className="font-label-sm text-label-sm text-tertiary mt-0.5">
                  {t.stats.weeklyAvg.replace('{rate}', String(averageRate))}
                </p>
              </div>
              <span className="material-symbols-outlined text-tertiary text-[20px]">
                query_stats
              </span>
            </div>

            {/* SVG Bar Chart */}
            <div className="relative w-full h-48 pt-4">
              {/* Target Average Dashed Guideline */}
              {averageRate > 0 && (
                <div
                  className="absolute inset-x-0 flex items-center pointer-events-none z-10"
                  style={{ bottom: `${averageRate}%` }}
                >
                  <div className="w-full border-t border-dashed border-secondary/70"></div>
                  <span className="absolute right-0 -top-3 font-label-sm text-label-sm text-secondary font-semibold bg-surface-container-lowest px-1">
                    {averageRate}%
                  </span>
                </div>
              )}

              {/* Bars Container */}
              <div className="h-40 flex items-end justify-between gap-2 px-2">
                {weekDayStats.map((item: DayStatItem) => {
                  const heightPercent = Math.max(8, item.percentage);
                  const isHigh = item.percentage >= averageRate && averageRate > 0;

                  return (
                    <div
                      key={item.key}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      onClick={() => onSelectDate && onSelectDate(item.key)}
                    >
                      <div className="font-label-sm text-label-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-semibold">
                        {item.percentage}%
                      </div>
                      <div
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                          isHigh ? 'bg-primary' : 'bg-primary-fixed-dim'
                        } ${item.isToday ? 'ring-2 ring-secondary' : ''}`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                      <span
                        className={`font-label-sm text-label-sm mt-2 font-medium ${
                          item.isToday ? 'text-primary font-bold' : 'text-on-surface-variant'
                        }`}
                      >
                        {item.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {period === 'monthly' && (
        <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/60 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container/60">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {t.stats.monthlyReportTitle}
              </h3>
              <p className="text-xs text-tertiary font-medium mt-0.5">
                {currentMonthKey.replace('-', '. ')}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-fixed text-primary">
              {t.stats.monthActiveDaysLabel} {monthlyActiveDays}{language === 'en' ? ' days' : language === 'ja' ? '日' : '일'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col">
              <span className="text-xs text-tertiary font-bold">{t.stats.monthlyTotalCompleted}</span>
              <span className="text-lg font-black text-primary mt-1">
                {monthlyLogs.length}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">completed</span>
            </div>
            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col">
              <span className="text-xs text-tertiary font-bold">{t.stats.monthlyRate}</span>
              <span className="text-lg font-black text-secondary mt-1">
                {monthlyActiveDays > 0 ? Math.min(100, Math.round((monthlyActiveDays / 30) * 100)) : 0}%
              </span>
              <span className="text-xs text-slate-500 mt-0.5">30 days</span>
            </div>
          </div>

          <div className="bg-blue-50/60 border border-blue-100/80 rounded-xl p-3.5 flex items-start gap-2.5">
            <span className="text-lg shrink-0">🌿</span>
            <div className="text-xs text-blue-900 leading-relaxed break-keep">
              {language === 'en' ? (
                <>
                  <strong>{userName}</strong>, you kept the flame bright for <strong>{monthlyActiveDays} days</strong> this month!
                  Every small daily effort builds a lasting foundation for your growth.
                </>
              ) : language === 'ja' ? (
                <>
                  <strong>{userName}</strong>様、今月合計<strong>{monthlyActiveDays}日</strong>間炎を灯しました！
                  毎日1つでも実践した成果は確実に積み重なっています。
                </>
              ) : (
                <>
                  <strong>{userName}</strong>님, 이번 달 총 <strong>{monthlyActiveDays}일</strong> 동안 불꽃을 밝혔습니다!
                  매일 1개라도 실천하며 이룬 성과는 몸과 마음에 온전히 남습니다.
                </>
              )}
            </div>
          </div>

          {/* Monthly Habit Calendar Grid (User Request 4: 월간 달력 및 실천 현황 제공) */}
          <div className="pt-2 border-t border-surface-container/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[19px] text-primary">calendar_month</span>
                {language === 'en'
                  ? 'Monthly Habit Calendar'
                  : language === 'ja'
                  ? '今月の習慣カレンダー'
                  : '이달의 습관 캘린더'}
              </span>
              <span className="text-xs text-tertiary font-medium">
                {language === 'en'
                  ? 'Tap date to inspect'
                  : language === 'ja'
                  ? '日付タップで確認'
                  : '날짜 터치 시 홈으로 이동'}
              </span>
            </div>

            {/* Day header: 월 화 수 목 금 토 일 */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {(language === 'en'
                ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                : language === 'ja'
                ? ['月', '火', '水', '木', '金', '土', '日']
                : ['월', '화', '수', '목', '금', '토', '일']
              ).map((d, i) => (
                <span
                  key={d}
                  className={`text-xs font-bold ${
                    i >= 5 ? 'text-rose-500/85' : 'text-slate-500'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: monthDays.offset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-11 rounded-xl bg-transparent" />
              ))}

              {monthDays.days.map((d) => {
                const is100 = d.percentage === 100;
                const isDone = d.percentage > 0;
                return (
                  <button
                    key={d.dateKey}
                    type="button"
                    onClick={() => onSelectDate && onSelectDate(d.dateKey)}
                    className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between transition-all cursor-pointer border ${
                      d.isToday
                        ? 'ring-2 ring-primary ring-offset-1 bg-primary/10 border-primary font-black shadow-2xs'
                        : is100
                        ? 'bg-amber-50/80 border-amber-200 shadow-2xs'
                        : isDone
                        ? 'bg-emerald-50/70 border-emerald-100'
                        : 'bg-surface-container-low/60 border-transparent hover:bg-surface-container'
                    }`}
                    title={`${d.dateKey}: ${d.percentage}%`}
                  >
                    <span
                      className={`text-xs font-bold leading-none ${
                        d.isToday ? 'text-primary font-black' : 'text-on-surface'
                      }`}
                    >
                      {d.day}
                    </span>
                    <div className="flex items-center justify-center">
                      {is100 ? (
                        <span className="text-xs leading-none">🔥</span>
                      ) : isDone ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Monthly Calendar Legend */}
            <div className="flex items-center justify-end gap-3 pt-2 text-xs text-tertiary">
              <div className="flex items-center gap-1 font-medium">
                <span>🔥</span>
                <span>
                  {language === 'en'
                    ? '100% Perfect'
                    : language === 'ja'
                    ? '100% 達成'
                    : '100% 완벽 달성'}
                </span>
              </div>
              <div className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{language === 'en' ? 'Practiced' : language === 'ja' ? '実践' : '실천'}</span>
              </div>
              <div className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>{language === 'en' ? 'None' : language === 'ja' ? '未実践' : '미실천'}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {period === 'yearly' && (
        <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/60 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container/60">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {t.stats.yearlyMilestoneTitle}
              </h3>
              <p className="text-xs text-tertiary font-medium mt-0.5">
                {currentYearKey}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              🏆
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-surface-container-low p-3 rounded-xl">
              <span className="text-xs font-bold text-tertiary">{t.stats.yearlyDays}</span>
              <div className="text-base font-black text-primary mt-1">
                {yearlyActiveDays}{language === 'en' ? ' days' : language === 'ja' ? '日' : '일'}
              </div>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl">
              <span className="text-xs font-bold text-tertiary">{t.stats.yearlyBest}</span>
              <div className="text-base font-black text-rose-500 mt-1">
                {bestStreak}{language === 'en' ? ' days' : language === 'ja' ? '日' : '일'}
              </div>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl">
              <span className="text-xs font-bold text-tertiary">{t.stats.yearlyCompleted}</span>
              <div className="text-base font-black text-emerald-600 mt-1">{yearlyLogs.length}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 flex items-center gap-3">
            <span className="text-xl">🌱</span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800">
                {language === 'en' ? 'Habits compound over time' : language === 'ja' ? '習慣は複利で成長します' : '습관은 복리로 자랍니다'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 break-keep">
                {language === 'en'
                  ? `Just 1% daily progress compounds into 37x growth after a year. Always cheering for ${userName}'s habit journey!`
                  : language === 'ja'
                  ? `毎日1%の継続が1年後に37倍の驚くべき成長をもたらします。${userName}様の習慣の旅を応援しています！`
                  : `하루 1%의 꾸준함이 1년 뒤 37배의 놀라운 성장을 선물합니다. ${userName}님의 습관 여정을 늘 응원합니다!`}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3.5. Daily Life Trackers Trends (User Request 2: 홈 기록과 실시간 연동되는 일상 변화 흐름) */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/60 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">trending_up</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
              {language === 'en'
                ? 'Daily Tracker Trends'
                : language === 'ja'
                ? 'デイリーライフ記録トレンド'
                : '일상 기록 트래커 & 변화 흐름'}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {language === 'en' ? 'Live Synced' : language === 'ja' ? 'リアルタイム連動' : '실시간 연동'}
          </span>
        </div>

        {activeTrackers.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-surface-container-low border border-dashed border-outline-variant/60">
            <span className="text-xl">📊</span>
            <p className="text-xs font-bold text-on-surface mt-2">
              {language === 'en'
                ? 'No active trackers yet'
                : language === 'ja'
                ? '連動中のトラッカーがありません'
                : '연동된 일상 트래커가 없습니다'}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              {language === 'en'
                ? 'Add trackers in Explore to monitor weight, water, mood and habits here!'
                : language === 'ja'
                ? '「探す」タブからトラッカーを追加すると、体重・水分・気分の推移がここに表示されます。'
                : '탐색 탭의 [데일리 라이프 트래커]에서 추가하면 몸무게, 물 섭취, 컨디션 변화가 매일 기록되고 이곳에 흐름으로 분석됩니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Horizontal Tracker Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {activeTrackers.map((tracker) => {
                const isSelected = tracker.id === currentTracker.id;
                return (
                  <button
                    key={tracker.id}
                    onClick={() => setSelectedTrackerId(tracker.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm shadow-primary/20 scale-[1.02]'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <span>{tracker.emoji}</span>
                    <span>
                      {trackerTitle(tracker, language)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Current Tracker Highlight & Today Value */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-surface-container-low border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-emerald-200/60 flex items-center justify-center text-lg shrink-0">
                  {currentTracker.emoji}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-on-surface truncate">
                      {trackerTitle(currentTracker, language)}
                    </span>
                    <span className="text-xs text-tertiary font-medium">({trackerUnit(currentTracker, language)})</span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">
                    {language === 'en'
                      ? currentTracker.enDescription || currentTracker.description
                      : language === 'ja'
                      ? currentTracker.jaDescription || currentTracker.description
                      : currentTracker.description}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <span className="text-xs font-bold text-tertiary block">
                  {language === 'en' ? 'Today' : language === 'ja' ? '今日' : '오늘'}
                </span>
                <span className="text-sm font-black text-primary">
                  {todayValue !== undefined && todayValue !== ''
                    ? currentTracker.inputType === 'condition'
                      ? conditionLabel(String(todayValue), language)
                      : `${todayValue} ${trackerUnit(currentTracker, language)}`
                    : language === 'en' ? 'Unrecorded' : language === 'ja' ? '未記録' : '미기록'}
                </span>
              </div>
            </div>

            {/* Period-Aware Pillar Bar Chart (User Request 4: 월간/연간 선택 시 주간이 아닌 해당 기간 흐름 표시) */}
            <div className="bg-surface-container-low/70 rounded-xl p-3 sm:p-4 border border-outline-variant/30">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-tertiary">
                <span>
                  {period === 'weekly'
                    ? (language === 'en' ? 'Weekly Flow (Mon ~ Sun)' : language === 'ja' ? '週間推移 (月〜日)' : '주간 기록 흐름 (월 ~ 일)')
                    : period === 'monthly'
                    ? (language === 'en' ? `Monthly Flow (${currentMonthKey})` : language === 'ja' ? `月間推移 (${currentMonthKey.replace('-', '.')})` : `월간 기록 흐름 (${currentMonthKey.replace('-', '. ')} 전체)`)
                    : (language === 'en' ? `Yearly Flow (${currentYearKey})` : language === 'ja' ? `年間推移 (${currentYearKey}年)` : `연간 기록 흐름 (${currentYearKey}년)`)}
                </span>
                <span>
                  {currentTracker.inputType === 'condition'
                    ? (language === 'en' ? 'Mood Score (20~100)' : language === 'ja' ? 'コンディション指数' : '기분 지수')
                    : currentTracker.defaultGoal
                    ? `${language === 'en' ? 'Goal' : language === 'ja' ? '目標' : '목표'}: ${currentTracker.defaultGoal.toLocaleString()} ${trackerUnit(currentTracker, language)}`
                    : ''}
                </span>
              </div>

              {/* Weekly Flow: 7 Days */}
              {period === 'weekly' && (
                <div className="grid grid-cols-7 gap-1 sm:gap-2 items-end h-36 pt-6 pb-2 px-1">
                  {weeklyTrackerData.map((d) => {
                    const isToday = isDateToday(d.dateKey);
                    const hasVal = d.value !== undefined && d.value !== '';
                    const displayLabel = hasVal
                      ? currentTracker.inputType === 'condition'
                        ? CONDITION_EMOJIS[String(d.value)]?.emoji || '😊'
                        : typeof d.value === 'number'
                        ? d.value > 999
                          ? `${(d.value / 1000).toFixed(1)}k`
                          : String(d.value)
                        : String(d.value).slice(0, 4)
                      : '-';

                    return (
                      <div key={d.dateKey} className="flex flex-col items-center h-full justify-end group">
                        <span
                          className={`text-xs font-bold mb-1.5 transition-colors ${
                            isToday ? 'text-primary font-black' : hasVal ? 'text-on-surface' : 'text-outline-variant'
                          }`}
                        >
                          {displayLabel}
                        </span>

                        <div className="w-full max-w-[26px] bg-slate-200/60 rounded-full h-full flex items-end p-0.5 overflow-hidden">
                          <div
                            style={{ height: `${hasVal ? Math.max(d.percentHeight, 14) : 6}%` }}
                            className={`w-full rounded-full transition-all duration-500 ${
                              isToday
                                ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm shadow-emerald-500/30'
                                : hasVal
                                ? 'bg-gradient-to-t from-emerald-500/80 to-teal-400/80'
                                : 'bg-transparent'
                            }`}
                          />
                        </div>

                        <div className="mt-2 flex flex-col items-center">
                          <span
                            className={`text-xs font-bold ${
                              isToday ? 'text-primary font-black' : 'text-on-surface-variant'
                            }`}
                          >
                            {d.dayLabel}
                          </span>
                          {isToday && (
                            <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Monthly Flow: Days of Month (1~31) */}
              {period === 'monthly' && (
                <div className="flex items-end gap-1 overflow-x-auto no-scrollbar h-36 pt-6 pb-2 px-1">
                  {monthlyTrackerData.map((d) => {
                    const isToday = isDateToday(d.dateKey);
                    const hasVal = d.value !== undefined && d.value !== '';
                    const displayLabel = hasVal
                      ? currentTracker.inputType === 'condition'
                        ? CONDITION_EMOJIS[String(d.value)]?.emoji || '😊'
                        : typeof d.value === 'number'
                        ? d.value > 999
                          ? `${(d.value / 1000).toFixed(1)}k`
                          : String(d.value)
                        : String(d.value).slice(0, 3)
                      : '';

                    return (
                      <div
                        key={d.dateKey}
                        className="flex flex-col items-center h-full justify-end min-w-[20px] flex-1 group"
                        title={`${d.dateKey}: ${hasVal ? d.value : '미기록'}`}
                      >
                        <span
                          className={`text-xs font-bold mb-1 transition-colors truncate max-w-full ${
                            isToday ? 'text-primary font-black' : hasVal ? 'text-on-surface' : 'text-transparent'
                          }`}
                        >
                          {displayLabel || '·'}
                        </span>

                        <div className="w-full max-w-[15px] bg-slate-200/60 rounded-full h-full flex items-end p-0.5 overflow-hidden">
                          <div
                            style={{ height: `${hasVal ? Math.max(d.percentHeight, 14) : 6}%` }}
                            className={`w-full rounded-full transition-all duration-500 ${
                              isToday
                                ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm shadow-emerald-500/30'
                                : hasVal
                                ? 'bg-gradient-to-t from-emerald-500/80 to-teal-400/80'
                                : 'bg-transparent'
                            }`}
                          />
                        </div>

                        <div className="mt-2 flex flex-col items-center">
                          <span
                            className={`text-xs font-bold ${
                              isToday ? 'text-primary font-black' : 'text-on-surface-variant'
                            }`}
                          >
                            {d.dayNumber}
                          </span>
                          {isToday && (
                            <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Yearly Flow: 12 Months */}
              {period === 'yearly' && (
                <div className="grid grid-cols-12 gap-1 items-end h-36 pt-6 pb-2 px-1">
                  {yearlyTrackerData.map((d) => {
                    const hasVal = d.count > 0;
                    return (
                      <div key={d.monthLabel} className="flex flex-col items-center h-full justify-end group">
                        <span className="text-xs font-bold mb-1 text-on-surface truncate">
                          {hasVal ? d.avg : '-'}
                        </span>
                        <div className="w-full max-w-[16px] bg-slate-200/60 rounded-full h-full flex items-end p-0.5 overflow-hidden">
                          <div
                            style={{ height: `${hasVal ? Math.max(d.percentHeight, 14) : 6}%` }}
                            className={`w-full rounded-full transition-all duration-500 ${
                              hasVal ? 'bg-gradient-to-t from-emerald-500/80 to-teal-400/80' : 'bg-transparent'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-bold mt-2 text-on-surface-variant">
                          {d.monthLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3 Metric Summary Cards (Dynamic by Period) */}
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <div className="bg-surface-container-low p-2.5 sm:p-3 rounded-xl text-center">
                <span className="text-xs font-bold text-tertiary block">
                  {period === 'weekly'
                    ? (language === 'en' ? 'Weekly Avg' : language === 'ja' ? '週間平均' : '주간 평균')
                    : period === 'monthly'
                    ? (language === 'en' ? 'Monthly Avg' : language === 'ja' ? '月間平均' : '이달 평균')
                    : (language === 'en' ? 'Yearly Avg' : language === 'ja' ? '年間平均' : '연간 평균')}
                </span>
                <span className="text-sm sm:text-sm font-black text-on-surface mt-0.5 block truncate">
                  {period === 'weekly'
                    ? trackerSummary.avg
                    : period === 'monthly'
                    ? monthlyTrackerSummary.avg
                    : yearlyTrackerSummary.avg}
                </span>
              </div>
              <div className="bg-surface-container-low p-2.5 sm:p-3 rounded-xl text-center">
                <span className="text-xs font-bold text-tertiary block">
                  {period === 'weekly'
                    ? (language === 'en' ? 'Peak / Best' : language === 'ja' ? '最高 / 最新' : '최고 기록')
                    : period === 'monthly'
                    ? (language === 'en' ? 'Month Peak' : language === 'ja' ? '今月最高' : '이달 최고')
                    : (language === 'en' ? 'Year Peak' : language === 'ja' ? '年間最高' : '연간 최고')}
                </span>
                <span className="text-sm sm:text-sm font-black text-emerald-600 mt-0.5 block truncate">
                  {period === 'weekly'
                    ? trackerSummary.max
                    : period === 'monthly'
                    ? monthlyTrackerSummary.max
                    : yearlyTrackerSummary.max}
                </span>
              </div>
              <div className="bg-surface-container-low p-2.5 sm:p-3 rounded-xl text-center">
                <span className="text-xs font-bold text-tertiary block">
                  {period === 'weekly'
                    ? (language === 'en' ? 'Logged Days' : language === 'ja' ? '記録日数' : '기록 일수')
                    : period === 'monthly'
                    ? (language === 'en' ? 'Active Days' : language === 'ja' ? '記録日数' : '이달 기록 일수')
                    : (language === 'en' ? 'Total Logs' : language === 'ja' ? '総記録数' : '총 기록 횟수')}
                </span>
                <span className="text-sm sm:text-sm font-black text-primary mt-0.5 block">
                  {period === 'weekly' ? (
                    <>
                      {trackerSummary.loggedDays}/7<span className="text-xs font-normal text-tertiary">일</span>
                    </>
                  ) : period === 'monthly' ? (
                    <>
                      {monthlyTrackerSummary.loggedDays}/{monthlyTrackerSummary.totalDays}<span className="text-xs font-normal text-tertiary">일</span>
                    </>
                  ) : (
                    <>
                      {yearlyTrackerSummary.loggedDays}<span className="text-xs font-normal text-tertiary">회</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Category Breakdown */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/60 space-y-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
            {t.stats.categoryDistTitle}
          </h3>
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
            pie_chart
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 w-full">
          {/* Donut Chart */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#ddece5"
                strokeWidth="12"
              ></circle>
              {categoryBreakdown.map((cat, i) => {
                const segLength = (circumference * cat.percent) / 100;
                const offset = -(circumference * accumulatedPercent) / 100;
                accumulatedPercent += cat.percent;

                return (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke={cat.color}
                    strokeDasharray={`${segLength} ${circumference}`}
                    strokeDashoffset={offset}
                    strokeWidth="12"
                    strokeLinecap="round"
                  ></circle>
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm sm:text-base font-black text-primary">
                {routines.length}{language === 'en' ? '' : language === 'ja' ? '個' : '개'}
              </span>
              <span className="text-xs sm:text-xs font-medium text-slate-400">
                {language === 'en' ? 'All Habits' : language === 'ja' ? '全習慣' : '전체 습관'}
              </span>
            </div>
          </div>

          {/* Breakdown Legend Bars */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center justify-between text-xs gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    ></span>
                    <span className="truncate text-xs sm:text-xs font-bold text-slate-800">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-xs sm:text-xs text-slate-500 font-extrabold shrink-0">
                    {cat.percent}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: cat.color,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pomodoro Focus Analytics Card (Moved to bottom as requested) */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/60 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container/60 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-lg shrink-0">🍅</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-extrabold text-on-surface tracking-tight truncate">
                {t.stats.pomodoroTitle}
              </h3>
              <p className="text-xs text-tertiary font-medium truncate">
                {t.stats.pomodoroSub}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-fixed text-primary shrink-0 whitespace-nowrap">
            {t.stats.weeklyFocusMinutes.replace('{min}', String(pomoWeekly.totalMinutes))}
          </span>
        </div>

        {/* 2x2 Stats Grid with Real Pomodoro Counts */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
            <span className="text-xs text-tertiary font-bold">{t.stats.todayFocusSession}</span>
            <span className="text-base font-black text-primary mt-0.5">
              {pomoToday.count}
            </span>
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
            <span className="text-xs text-tertiary font-bold">{t.stats.todayFocusTime}</span>
            <span className="text-base font-black text-secondary mt-0.5">
              {pomoToday.totalMinutes}m
            </span>
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
            <span className="text-xs text-tertiary font-bold">{t.stats.weeklyFocusSession}</span>
            <span className="text-base font-black text-on-surface mt-0.5">
              {pomoWeekly.totalCount}
            </span>
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
            <span className="text-xs text-tertiary font-bold">{t.stats.totalEarnedXp}</span>
            <span className="text-base font-black text-primary mt-0.5">
              +{pomoWeekly.totalCount * 50} XP
            </span>
          </div>
        </div>
      </section>

      {/* 6. Achievement Badges Grid (10 Diverse, Dynamically Connected Badges) */}
      <section className="w-full space-y-space-sm pb-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
              {t.stats.badgesTitle}
            </h3>
            <span className="font-label-md text-label-md text-primary font-bold">
              {unlockedBadgeCount} / {badges.length}
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-tertiary">
            {t.stats.badgeAutoSync}
          </span>
        </div>

        {/* Badge Grid: 2 columns */}
        <div className="grid grid-cols-2 gap-2.5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3.5 rounded-2xl border flex flex-col items-center text-center transition-all ${
                badge.isUnlocked
                  ? 'bg-surface-container-lowest border-primary/30 shadow-[0_4px_16px_-2px_rgba(29,78,216,0.08)]'
                  : 'bg-surface-container-low/60 border-slate-200/80 opacity-70'
              }`}
            >
              {/* Badge Icon Bubble */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                  badge.isUnlocked
                    ? `bg-gradient-to-tr ${badge.badgeColor}`
                    : 'bg-slate-300 text-slate-500'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: badge.isUnlocked ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {badge.icon}
                </span>
              </div>

              {/* Title & Level */}
              <h4 className="text-sm font-black text-on-surface mt-2 leading-tight">
                {badge.title}
              </h4>
              <p className="text-xs text-tertiary mt-0.5 leading-snug line-clamp-2 break-keep">
                {badge.desc}
              </p>

              {/* Status pill & Progress Bar */}
              <div className="w-full mt-2.5 flex flex-col gap-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold mx-auto ${
                    badge.isUnlocked
                      ? 'bg-primary-fixed text-primary'
                      : 'bg-surface-container text-tertiary'
                  }`}
                >
                  {badge.progressText}
                </span>

                {!badge.isUnlocked && (
                  <div className="w-full h-1 rounded-full bg-slate-200 overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${badge.progressPercent}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
