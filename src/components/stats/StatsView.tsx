import React, { useState, useMemo } from 'react';
import type { Routine, RoutineLog, DailyReview, Category } from '../../types/routine';
import { getDailyStats, calculateOverallStreak } from '../../utils/routineUtils';
import { getWeekDates, isDateToday, formatDisplayDate } from '../../utils/dateUtils';
import type { WeekDateItem } from '../../utils/dateUtils';
import { getTodayPomodoroStats, getWeeklyPomodoroStats } from '../../utils/pomodoroStorage';

interface StatsViewProps {
  routines: Routine[];
  logs: RoutineLog[];
  reviews: DailyReview[];
  categories: Category[];
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
  onSelectDate,
}) => {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const streak = useMemo(() => {
    return calculateOverallStreak(routines, logs);
  }, [routines, logs]);

  // Compute 7 days of the current week
  const weekDates = useMemo(() => {
    return getWeekDates(new Date());
  }, []);

  const weekDayStats: DayStatItem[] = useMemo(() => {
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    return weekDates.map((item: WeekDateItem, idx: number) => {
      const stats = getDailyStats(routines, logs, item.key);
      const isToday = isDateToday(item.key);
      return {
        key: item.key,
        dayLabel: days[idx] || item.day,
        dateNumber: item.day,
        percentage: stats.totalRoutines > 0 ? stats.percentage : 0,
        completed: stats.completedRoutines,
        total: stats.totalRoutines,
        isToday,
      };
    });
  }, [weekDates, routines, logs]);

  const pomoToday = useMemo(() => getTodayPomodoroStats(), []);
  const pomoWeekly = useMemo(() => getWeeklyPomodoroStats(), []);

  // Average weekly rate
  const averageRate = useMemo(() => {
    const valid = weekDayStats.filter((d: DayStatItem) => d.total > 0);
    if (valid.length === 0) return 82;
    const sum = valid.reduce((acc: number, curr: DayStatItem) => acc + curr.percentage, 0);
    return Math.round(sum / valid.length);
  }, [weekDayStats]);

  // Category breakdown calculation
  const categoryBreakdown = useMemo(() => {
    const counts: { [key: string]: number } = {};
    let totalCount = 0;

    routines.forEach((r) => {
      const catId = r.categoryId || 'other';
      counts[catId] = (counts[catId] || 0) + 1;
      totalCount++;
    });

    if (totalCount === 0) {
      return [
        { name: '건강 & 운동', percent: 40, color: '#10533f' },
        { name: '마음챙김', percent: 25, color: '#2e6b56' },
        { name: '생산성 & 공부', percent: 20, color: '#fc934f' },
        { name: '생활 습관', percent: 15, color: '#95d3ba' },
      ];
    }

    const defaultColors = ['#10533f', '#2e6b56', '#fc934f', '#95d3ba', '#994703', '#374e44'];

    return Object.entries(counts).map(([catId, count], idx) => {
      const cat = categories.find((c) => c.id === catId);
      const percent = Math.round((count / totalCount) * 100);
      return {
        name: cat ? `${cat.emoji} ${cat.name}` : '기타 습관',
        percent,
        color: cat?.color || defaultColors[idx % defaultColors.length],
      };
    });
  }, [routines, categories]);

  // Donut circumference = 2 * PI * 40 = 251.32
  const circumference = 251.32;
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col w-full pb-8 gap-space-lg select-none">
      {/* Period Selector Segment */}
      <div className="pt-2">
        <div className="bg-surface-container-low p-1 rounded-xl flex items-center justify-between border border-surface-container/60">
          <button
            onClick={() => setPeriod('weekly')}
            className={`flex-1 py-2 text-center rounded-lg font-label-md text-label-md transition-all ${
              period === 'weekly'
                ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`flex-1 py-2 text-center rounded-lg font-label-md text-label-md transition-all ${
              period === 'monthly'
                ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
          >
            월간
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`flex-1 py-2 text-center rounded-lg font-label-md text-label-md transition-all ${
              period === 'yearly'
                ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
          >
            연간
          </button>
        </div>
      </div>

      {/* Streak & Consistency Highlight Card */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_24px_-4px_rgba(46,107,86,0.06)] border border-surface-container/60 flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-secondary text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="font-label-md text-label-md text-secondary font-bold tracking-tight">
              연속 달성 스트릭
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-primary font-bold bg-surface-container-low px-2 py-0.5 rounded-full">
            성장 모멘텀 +18%
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-headline-lg-mobile text-[2.5rem] leading-none text-primary font-extrabold tracking-tight">
            {streak > 0 ? streak : 14}
          </span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
            일 연속 달성 중
          </span>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant">
          SJ님, 이번 주 목표 루틴 실천율이 지난주보다 18% 증가했습니다. 꾸준함이 습관을 만들고 있어요!
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-container/50">
          <div className="bg-surface-container-low p-2.5 rounded-xl">
            <span className="font-label-sm text-label-sm text-tertiary">최고 연속 기록</span>
            <div className="font-headline-sm text-headline-sm text-primary font-bold mt-0.5">
              28일
            </div>
          </div>
          <div className="bg-surface-container-low p-2.5 rounded-xl">
            <span className="font-label-sm text-label-sm text-tertiary">이번 달 실천 일수</span>
            <div className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5">
              24일
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Activity Grass / Heatmap Calendar */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_20px_-2px_rgba(46,107,86,0.05)] border border-surface-container/60 space-y-space-md">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
            주간 잔디 심기
          </h3>
          <span className="font-label-sm text-label-sm text-tertiary">이번 주 기록 현황</span>
        </div>

        {/* Mon to Sun Grass Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDayStats.map((item: DayStatItem) => {
            const pct = item.percentage;
            let bgClass = 'bg-surface-container-high/60 text-on-surface-variant';
            let leafFill = 0;

            if (pct >= 90) {
              bgClass = 'bg-primary text-on-primary shadow-xs';
              leafFill = 1;
            } else if (pct >= 70) {
              bgClass = 'bg-primary-container text-on-primary';
              leafFill = 1;
            } else if (pct >= 40) {
              bgClass = 'bg-primary-fixed text-primary';
              leafFill = 1;
            } else if (pct > 0) {
              bgClass = 'bg-surface-container-highest text-tertiary';
            }

            return (
              <button
                key={item.key}
                onClick={() => onSelectDate && onSelectDate(item.key)}
                className={`flex flex-col items-center py-2.5 rounded-xl transition-all active:scale-95 ${bgClass} ${
                  item.isToday ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
                title={`${formatDisplayDate(item.key)}: ${pct}% 달성`}
              >
                <span className="font-label-sm text-label-sm font-semibold mb-1 opacity-90">
                  {item.dayLabel}
                </span>
                <span
                  className="material-symbols-outlined text-[18px] mb-1"
                  style={{ fontVariationSettings: `'FILL' ${leafFill}` }}
                >
                  eco
                </span>
                <span className="text-[10px] font-bold">
                  {pct > 0 ? `${pct}%` : '-'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grass Intensity Legend */}
        <div className="flex items-center justify-end gap-1.5 pt-1 text-[11px] text-tertiary">
          <span>낮음</span>
          <div className="w-3 h-3 rounded-xs bg-surface-container-high"></div>
          <div className="w-3 h-3 rounded-xs bg-primary-fixed"></div>
          <div className="w-3 h-3 rounded-xs bg-primary-container"></div>
          <div className="w-3 h-3 rounded-xs bg-primary"></div>
          <span>높음</span>
        </div>
      </section>

      {/* Pomodoro Focus Analytics Card */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/60 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍅</span>
            <div>
              <h3 className="text-[15px] font-extrabold text-on-surface tracking-tight">
                뽀모도로 몰입 리포트
              </h3>
              <p className="text-[12px] text-tertiary font-medium">
                일간 및 주간 집중 세션 분석
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-fixed text-primary">
            주간 총 {pomoWeekly.totalMinutes}분 몰입
          </span>
        </div>

        {/* 2x2 Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
            <span className="text-[11px] text-tertiary font-bold">오늘 완주 세션</span>
            <span className="text-[18px] font-black text-primary mt-0.5">
              {pomoToday.count}회
            </span>
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
            <span className="text-[11px] text-tertiary font-bold">오늘 집중 시간</span>
            <span className="text-[18px] font-black text-secondary mt-0.5">
              {pomoToday.totalMinutes}분
            </span>
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
            <span className="text-[11px] text-tertiary font-bold">주간 완주 세션</span>
            <span className="text-[18px] font-black text-on-surface mt-0.5">
              {pomoWeekly.totalCount}회
            </span>
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
            <span className="text-[11px] text-tertiary font-bold">누적 획득 경험치</span>
            <span className="text-[18px] font-black text-primary mt-0.5">
              +{pomoWeekly.totalCount * 50} XP
            </span>
          </div>
        </div>
      </section>

      {/* Routine Completion Rate Bar Chart */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_20px_-2px_rgba(46,107,86,0.05)] border border-surface-container/60 space-y-space-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
              일별 달성률 추이
            </h3>
            <p className="font-label-sm text-label-sm text-tertiary mt-0.5">
              주간 평균 달성률 {averageRate}%
            </p>
          </div>
          <span className="material-symbols-outlined text-tertiary text-[20px]">
            query_stats
          </span>
        </div>

        {/* SVG Bar Chart */}
        <div className="relative w-full h-48 pt-4">
          {/* Target Average Dashed Guideline (82% height) */}
          <div
            className="absolute inset-x-0 flex items-center pointer-events-none z-10"
            style={{ bottom: `${averageRate}%` }}
          >
            <div className="w-full border-t border-dashed border-secondary/70"></div>
            <span className="absolute right-0 -top-3 font-label-sm text-label-sm text-secondary font-semibold bg-surface-container-lowest px-1">
              목표 {averageRate}%
            </span>
          </div>

          {/* Bars Container */}
          <div className="h-40 flex items-end justify-between gap-2 px-2">
            {weekDayStats.map((item: DayStatItem) => {
              const heightPercent = Math.max(8, item.percentage);
              const isHigh = item.percentage >= averageRate;

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

      {/* Category Breakdown */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_20px_-2px_rgba(46,107,86,0.05)] border border-surface-container/60 space-y-space-md">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
            영역별 루틴 분포
          </h3>
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
            pie_chart
          </span>
        </div>

        <div className="flex items-center gap-space-lg">
          {/* Donut Chart */}
          <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
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
              <span className="font-headline-sm text-headline-sm font-bold text-primary">
                {routines.length}개
              </span>
              <span className="font-label-sm text-label-sm text-tertiary">전체 루틴</span>
            </div>
          </div>

          {/* Breakdown Legend Bars */}
          <div className="flex-1 flex flex-col gap-2">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    ></span>
                    {cat.name}
                  </span>
                  <span className="font-label-sm text-label-sm text-tertiary font-bold">
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

      {/* Achievement Badges Carousel / Grid */}
      <section className="w-full space-y-space-sm pb-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
              달성한 뱃지
            </h3>
            <span className="font-label-md text-label-md text-primary font-semibold">
              3 / 4 달성
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center">
            전체보기 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </span>
        </div>

        {/* Badge Grid / Cards */}
        <div className="grid grid-cols-2 gap-space-sm">
          {/* Badge 1: 아침형 인간 */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_4px_20px_-2px_rgba(46,107,86,0.05)] border border-surface-container/60 flex flex-col items-center text-center space-y-2 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center shadow-inner text-secondary">
              <span
                className="material-symbols-outlined text-[30px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
            </div>
            <div>
              <h4 className="font-headline-sm text-[1rem] leading-tight text-on-surface font-bold">
                아침형 인간
              </h4>
              <p className="font-label-sm text-label-sm text-tertiary mt-0.5">
                7일 연속 아침 루틴 완주
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[11px] font-bold">
              LV.2 달성 🌟
            </span>
          </div>

          {/* Badge 2: 수분 충전 요정 */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_4px_20px_-2px_rgba(46,107,86,0.05)] border border-surface-container/60 flex flex-col items-center text-center space-y-2 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center shadow-inner text-primary">
              <span
                className="material-symbols-outlined text-[30px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                water_drop
              </span>
            </div>
            <div>
              <h4 className="font-headline-sm text-[1rem] leading-tight text-on-surface font-bold">
                수분 충전 요정
              </h4>
              <p className="font-label-sm text-label-sm text-tertiary mt-0.5">
                30일간 물 마시기 달성
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-[11px] font-bold">
              LV.3 달성 💧
            </span>
          </div>

          {/* Badge 3: 불굴의 의지 */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_4px_20px_-2px_rgba(46,107,86,0.05)] border border-surface-container/60 flex flex-col items-center text-center space-y-2 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center shadow-inner text-tertiary">
              <span
                className="material-symbols-outlined text-[30px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                military_tech
              </span>
            </div>
            <div>
              <h4 className="font-headline-sm text-[1rem] leading-tight text-on-surface font-bold">
                불굴의 의지
              </h4>
              <p className="font-label-sm text-label-sm text-tertiary mt-0.5">
                주 5일 이상 목표 달성
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-tertiary font-label-sm text-[11px] font-bold">
              LV.1 달성 🛡️
            </span>
          </div>

          {/* Badge 4: 책벌레의 시작 (Locked) */}
          <div className="bg-surface-container-low/70 p-4 rounded-xl border border-dashed border-outline-variant flex flex-col items-center text-center space-y-2 relative opacity-75">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline">
              <span className="material-symbols-outlined text-[30px]">lock</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-[1rem] leading-tight text-on-surface-variant font-bold">
                책벌레의 시작
              </h4>
              <p className="font-label-sm text-label-sm text-outline mt-0.5">
                독서 루틴 20회 완료하기
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-tertiary font-label-sm text-[11px] font-medium">
              진행 중 (65%)
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
