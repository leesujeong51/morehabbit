import React, { useState } from 'react';
import type { Routine, RoutineLog, DailyReview } from '../../types/routine';
import { toDateKey, isDateToday, KOREAN_DAY_NAMES } from '../../utils/dateUtils';
import { getDailyStats } from '../../utils/routineUtils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  subMonths,
  addMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';


interface MonthlyCalendarProps {
  routines: Routine[];
  logs: RoutineLog[];
  reviews: DailyReview[];
  onSelectDate: (dateKey: string) => void;
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  routines,
  logs,
  reviews,
  onSelectDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleCurrentMonth = () => setCurrentMonth(new Date());

  // Calculate monthly overall stats
  const currentMonthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  let totalActiveDays = 0;
  let totalCompletionSum = 0;

  currentMonthDays.forEach((day) => {
    const key = toDateKey(day);
    const stats = getDailyStats(routines, logs, key);
    if (stats.totalRoutines > 0) {
      totalActiveDays++;
      totalCompletionSum += stats.percentage;
    }
  });

  const monthlyAverageRate =
    totalActiveDays > 0 ? Math.round(totalCompletionSum / totalActiveDays) : 0;

  const getColorClass = (percentage: number, hasRoutines: boolean, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'text-[#C5C8BC] bg-transparent';
    if (!hasRoutines) return 'text-[#75786F] bg-[#F5ECE7]/60';
    if (percentage === 100) return 'bg-[#455538] text-white font-bold shadow-2xs';
    if (percentage >= 70) return 'bg-[#5D6D4E] text-white font-semibold';
    if (percentage >= 40) return 'bg-[#829972] text-white font-medium';
    if (percentage > 0) return 'bg-[#DCEEC7] text-[#2E3A24]';
    return 'bg-[#E9E1DC] text-[#75786F]';
  };

  return (
    <div className="bg-[#FBF2ED] rounded-3xl p-4.5 shadow-2xs border border-[#E9E1DC]">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif font-bold text-base text-[#1E1B18] tracking-tight">
            {format(currentMonth, 'yyyy년 M월')} 달성 잔디
          </h3>
          <p className="text-[11px] text-[#75786F] mt-0.5">
            이번 달 평균 달성률 <strong className="text-[#455538] font-bold">{monthlyAverageRate}%</strong>
          </p>
        </div>

        <div className="flex items-center gap-1">

          <button
            onClick={handleCurrentMonth}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition"
          >
            이번 달
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-100 transition"
            aria-label="이전 달"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-100 transition"
            aria-label="다음 달"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {KOREAN_DAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={`text-[11px] font-bold py-1 ${
              i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-neutral-400'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((day) => {
          const dateKey = toDateKey(day);
          const isCurrMonth = isSameMonth(day, currentMonth);
          const isToday = isDateToday(dateKey);
          const stats = getDailyStats(routines, logs, dateKey);
          const hasRoutines = stats.totalRoutines > 0;
          const review = reviews.find((r) => r.date === dateKey);

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              disabled={!isCurrMonth}
              title={`${dateKey}: 달성률 ${stats.percentage}% (${stats.completedRoutines}/${stats.totalRoutines})`}
              className={`h-11 rounded-xl flex flex-col items-center justify-center p-0.5 relative transition active:scale-95 ${getColorClass(
                stats.percentage,
                hasRoutines,
                isCurrMonth
              )} ${isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}
            >
              <span className="text-xs leading-none">{format(day, 'd')}</span>

              {/* Mini mood or percentage indicator */}
              {isCurrMonth && hasRoutines && (
                <span className="text-[9px] mt-0.5 opacity-90 leading-none">
                  {review?.mood ? (
                    review.mood === 'great' ? '🥰' : review.mood === 'good' ? '😊' : '🌱'
                  ) : (
                    `${stats.percentage}%`
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grass level legend */}
      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
        <span>적음</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-neutral-100 inline-block" title="0%" />
          <span className="w-3.5 h-3.5 rounded bg-emerald-100 inline-block" title="1~39%" />
          <span className="w-3.5 h-3.5 rounded bg-emerald-200 inline-block" title="40~69%" />
          <span className="w-3.5 h-3.5 rounded bg-emerald-400 inline-block" title="70~99%" />
          <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" title="100%" />
        </div>
        <span>많음</span>
      </div>
    </div>
  );
};
