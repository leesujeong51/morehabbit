import React from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toDateKey, parseDateKey, isDateToday, getWeekDays } from '../../utils/dateUtils';
import { ProgressRing } from '../common/ProgressRing';
import type { Routine, RoutineLog } from '../../types/routine';
import { getDailyStats } from '../../utils/routineUtils';


interface DateStripProps {
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  routines: Routine[];
  logs: RoutineLog[];
}

export const DateStrip: React.FC<DateStripProps> = ({
  selectedDateKey,
  onSelectDate,
  routines,
  logs,
}) => {
  const selectedDate = parseDateKey(selectedDateKey);
  const weekDays = getWeekDays(selectedDate);

  const handlePrevWeek = () => {
    onSelectDate(toDateKey(subDays(selectedDate, 7)));
  };

  const handleNextWeek = () => {
    onSelectDate(toDateKey(addDays(selectedDate, 7)));
  };

  const currentMonthYear = format(selectedDate, 'yyyy년 M월', { locale: ko });

  return (
    <div className="bg-[#FFF8F5] border-b border-[#E9E1DC] pt-3 pb-3 px-3 shadow-2xs">
      <div className="max-w-xl mx-auto">
        {/* Month selector & Navigation */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-base font-bold text-[#1E1B18] tracking-tight">
              {currentMonthYear}
            </h2>
            <span className="text-[11px] text-[#75786F] font-medium">
              {format(selectedDate, 'M월 d일 EEEE', { locale: ko })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              className="p-1 rounded-full text-[#75786F] hover:text-[#1E1B18] hover:bg-[#FBF2ED] transition"
              aria-label="이전 주"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1 rounded-full text-[#75786F] hover:text-[#1E1B18] hover:bg-[#FBF2ED] transition"
              aria-label="다음 주"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 7 Days Strip */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const dateKey = toDateKey(day);
            const isSelected = dateKey === selectedDateKey;
            const isToday = isDateToday(dateKey);
            const dayOfWeek = day.getDay(); // 0 is Sun, 6 is Sat
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            const stats = getDailyStats(routines, logs, dateKey);
            const hasRoutines = stats.totalRoutines > 0;

            return (
              <button
                key={dateKey}
                onClick={() => onSelectDate(dateKey)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all relative ${
                  isSelected
                    ? 'bg-[#455538] text-white shadow-md shadow-[#455538]/20 scale-[1.03]'
                    : isToday
                    ? 'bg-[#EBF2E4] text-[#1E1B18] hover:bg-[#DCEEC7]'
                    : 'bg-[#FBF2ED]/60 text-[#45483F] hover:bg-[#FBF2ED]'
                }`}
              >
                {/* Day of Week Label */}
                <span
                  className={`text-[11px] font-bold mb-1 ${
                    isSelected
                      ? 'text-[#DCEEC7]'
                      : isWeekend
                      ? dayOfWeek === 0
                        ? 'text-[#BA1A1A]'
                        : 'text-[#455538]'
                      : 'text-[#75786F]'
                  }`}
                >
                  {format(day, 'E', { locale: ko })}
                </span>

                {/* Day Number */}
                <span
                  className={`text-sm font-bold leading-none mb-1.5 ${
                    isSelected ? 'text-white' : 'text-[#1E1B18]'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Mini Completion Indicator */}
                <div className="mt-0.5">
                  {hasRoutines ? (
                    isSelected ? (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#DCEEC7] text-[#2E3A24]">
                        {stats.percentage === 100 ? '✓' : `${stats.percentage}%`}
                      </div>
                    ) : (
                      <ProgressRing
                        progress={stats.percentage}
                        size={20}
                        strokeWidth={2.5}
                        showText={false}
                        color={stats.percentage === 100 ? '#455538' : '#795336'}
                        trackColor="#E9E1DC"
                      />
                    )
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E9E1DC] my-1.5" />
                  )}
                </div>

                {/* Small indicator dot for Today */}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#455538]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>

  );
};
