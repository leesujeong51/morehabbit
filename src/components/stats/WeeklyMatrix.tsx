import React, { useState } from 'react';
import type { Routine, RoutineLog } from '../../types/routine';
import { toDateKey, getWeekDays, isDateToday } from '../../utils/dateUtils';
import { isRoutineScheduledForDate } from '../../utils/routineUtils';
import { format, subDays, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface WeeklyMatrixProps {
  routines: Routine[];
  logs: RoutineLog[];
  onToggleComplete: (routineId: string, dateKey: string) => void;
  onSelectDate: (dateKey: string) => void;
}

export const WeeklyMatrix: React.FC<WeeklyMatrixProps> = ({
  routines,
  logs,
  onToggleComplete,
  onSelectDate,
}) => {

  const [centerDate, setCenterDate] = useState<Date>(new Date());
  const weekDays = getWeekDays(centerDate);

  const getLog = (routineId: string, dateKey: string) =>
    logs.find((l) => l.routineId === routineId && l.date === dateKey);

  const handlePrevWeek = () => setCenterDate(subDays(centerDate, 7));
  const handleNextWeek = () => setCenterDate(addDays(centerDate, 7));
  const handleCurrentWeek = () => setCenterDate(new Date());

  const activeRoutines = routines.filter((r) => !r.archived);

  return (
    <div className="bg-[#FBF2ED] rounded-3xl p-4.5 shadow-2xs border border-[#E9E1DC] overflow-hidden">
      {/* Matrix Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-serif font-bold text-base text-[#1E1B18] tracking-tight">
              주간 신호등 매트릭스
            </h3>
            <span className="text-[10px] bg-[#EBF2E4] text-[#2E3A24] px-2 py-0.5 rounded-full font-bold">
              마이루틴 시그니처
            </span>
          </div>
          <p className="text-[11px] text-[#75786F] mt-0.5">
            {format(weekDays[0], 'M.d')} ~ {format(weekDays[6], 'M.d (yyyy)')}
          </p>
        </div>


        <div className="flex items-center gap-1">
          <button
            onClick={handleCurrentWeek}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition"
          >
            이번 주
          </button>
          <button
            onClick={handlePrevWeek}
            className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-100 transition"
            aria-label="이전 주"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-100 transition"
            aria-label="다음 주"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto pb-2">
        <table className="w-full min-w-[420px] text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="py-2.5 px-2 text-left font-bold text-neutral-400 uppercase text-[10px] w-40">
                루틴 목록
              </th>
              {weekDays.map((day) => {
                const dateKey = toDateKey(day);
                const isToday = isDateToday(dateKey);
                return (
                  <th
                    key={dateKey}
                    onClick={() => onSelectDate(dateKey)}
                    title={`${dateKey} 루틴 보기`}
                    className={`py-2 px-1 text-center font-semibold text-[11px] transition cursor-pointer hover:bg-neutral-100/80 rounded-lg ${
                      isToday ? 'bg-emerald-50/70 text-emerald-800 rounded-t-lg' : 'text-neutral-500'
                    }`}
                  >
                    <div>{format(day, 'E', { locale: ko })}</div>
                    <div className="text-[10px] opacity-75">{format(day, 'd')}</div>
                  </th>

                );
              })}
              <th className="py-2 px-1 text-center font-bold text-neutral-400 text-[10px]">
                달성률
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {activeRoutines.map((routine) => {
              // Calculate weekly completion rate for this routine
              let scheduledDaysCount = 0;
              let completedDaysCount = 0;

              weekDays.forEach((day) => {
                const dateKey = toDateKey(day);
                if (isRoutineScheduledForDate(routine, dateKey)) {
                  scheduledDaysCount++;
                  if (getLog(routine.id, dateKey)?.completed) {
                    completedDaysCount++;
                  }
                }
              });

              const routineWeekRate =
                scheduledDaysCount > 0
                  ? Math.round((completedDaysCount / scheduledDaysCount) * 100)
                  : 0;

              return (
                <tr key={routine.id} className="hover:bg-neutral-50/70 transition">
                  {/* Routine title & emoji */}
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base shrink-0">{routine.emoji}</span>
                      <span className="font-semibold text-neutral-800 truncate max-w-[120px] sm:max-w-[150px]">
                        {routine.title}
                      </span>
                    </div>
                  </td>

                  {/* 7 Days Traffic Light Cells */}
                  {weekDays.map((day) => {
                    const dateKey = toDateKey(day);
                    const isToday = isDateToday(dateKey);
                    const isScheduled = isRoutineScheduledForDate(routine, dateKey);
                    const log = getLog(routine.id, dateKey);
                    const isCompleted = log?.completed === true;

                    return (
                      <td
                        key={dateKey}
                        className={`py-2 px-1 text-center ${
                          isToday ? 'bg-[#EBF2E4]/60' : ''
                        }`}
                      >
                        {isScheduled ? (
                          <button
                            onClick={() => onToggleComplete(routine.id, dateKey)}
                            title={`${dateKey} - ${routine.title} (${
                              isCompleted ? '완료' : '미완료'
                            })`}
                            className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center transition active:scale-80 ${
                              isCompleted
                                ? 'bg-[#455538] text-white shadow-2xs hover:bg-[#38462D]'
                                : 'bg-white hover:bg-[#E9E1DC] text-[#75786F] border border-[#E9E1DC]'
                            }`}
                          >
                            {isCompleted ? (
                              <Check size={14} strokeWidth={3} />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#C5C8BC]" />
                            )}
                          </button>
                        ) : (
                          <div className="w-7 h-7 mx-auto flex items-center justify-center text-[#C5C8BC]">
                            –
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Routine weekly rate */}
                  <td className="py-2 px-1 text-center font-mono font-bold text-[#45483F] text-[11px]">
                    <span
                      className={`px-1.5 py-0.5 rounded-md ${
                        routineWeekRate === 100
                          ? 'bg-[#DCEEC7] text-[#2E3A24]'
                          : routineWeekRate >= 50
                          ? 'bg-white border border-[#E9E1DC] text-[#45483F]'
                          : 'text-[#75786F]'
                      }`}
                    >
                      {routineWeekRate}%
                    </span>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-end gap-3 text-[11px] text-neutral-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          완료 (클릭하여 토글)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-neutral-200 inline-block" />
          미완료
        </span>
        <span className="flex items-center gap-1">
          <span className="text-neutral-400">–</span>
          루틴 없음
        </span>
      </div>
    </div>
  );
};
