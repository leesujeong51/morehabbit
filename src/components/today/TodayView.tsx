import React, { useState, useMemo } from 'react';
import type { Routine, RoutineLog, Category, TimeOfDay } from '../../types/routine';
import {
  getWeekDates,
  formatDisplayDate,
  isDateToday,
} from '../../utils/dateUtils';
import type { WeekDateItem } from '../../utils/dateUtils';
import { getDailyStats } from '../../utils/routineUtils';
import { MobitKoala, MobitAllDoneModal } from '../character/MobitCharacter';

interface TodayViewProps {
  routines: Routine[];
  logs: RoutineLog[];
  categories: Category[];
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  onToggleComplete: (routineId: string, targetDateKey?: string) => void;
  onOpenMemo: (routineId: string) => void;
  onOpenAddModal: (defaultTimeOfDay?: TimeOfDay) => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onStartFocus?: (routine: Routine) => void;
  streakCount: number;
}

export const TodayView: React.FC<TodayViewProps> = ({
  routines = [],
  logs = [],
  categories = [],
  selectedDateKey,
  onSelectDate,
  onToggleComplete,
  onOpenMemo,
  onOpenAddModal,
  onEditRoutine,
  onDeleteRoutine,
  streakCount,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');
  const [isAllDoneModalOpen, setIsAllDoneModalOpen] = useState(false);
  const [menuOpenRoutineId, setMenuOpenRoutineId] = useState<string | null>(null);

  // Compute 7-day strip based on current date
  const weekDates = useMemo(() => {
    return getWeekDates(new Date());
  }, []);

  const stats = useMemo(() => {
    return getDailyStats(routines || [], logs || [], selectedDateKey);
  }, [routines, logs, selectedDateKey]);

  // Calculate XP earned
  const totalXpEarned = useMemo(() => {
    return routines.reduce((sum, r) => {
      const isDone = logs.some((l) => l.routineId === r.id && l.date === selectedDateKey && l.completed);
      return isDone ? sum + (r.xp || 40) : sum;
    }, 0);
  }, [routines, logs, selectedDateKey]);

  // Partition routines by time of day
  const morningRoutines = useMemo(() => {
    return routines.filter((r) => !r.archived && r.timeOfDay === 'morning');
  }, [routines]);

  const afternoonRoutines = useMemo(() => {
    return routines.filter((r) => !r.archived && r.timeOfDay === 'afternoon');
  }, [routines]);

  const nightRoutines = useMemo(() => {
    return routines.filter((r) => !r.archived && (r.timeOfDay === 'night' || r.timeOfDay === 'evening'));
  }, [routines]);

  const anytimeRoutines = useMemo(() => {
    return routines.filter((r) => !r.archived && r.timeOfDay === 'anytime');
  }, [routines]);

  // Radial calculation (Circumference = 2 * PI * 40 = ~251.32)
  const circumference = 251.32;
  const strokeDashoffset = circumference - (circumference * stats.percentage) / 100;

  const dayLabels: { [key: number]: string } = {
    0: '일',
    1: '월',
    2: '화',
    3: '수',
    4: '목',
    5: '금',
    6: '토',
  };

  const isToday = isDateToday(selectedDateKey);

  // Checkbox toggle with 100% all habits completed celebration
  const handleCheckboxClick = (routineId: string) => {
    const isCurrentlyDone = logs.some(
      (l) => l.date === selectedDateKey && l.routineId === routineId && l.completed
    );
    const activeRoutines = routines.filter((r) => !r.archived);
    const completedCount = activeRoutines.filter((r) =>
      logs.some((l) => l.routineId === r.id && l.date === selectedDateKey && l.completed)
    ).length;

    if (!isCurrentlyDone && completedCount + 1 >= activeRoutines.length && activeRoutines.length > 0) {
      setIsAllDoneModalOpen(true);
    }
    onToggleComplete(routineId, selectedDateKey);
  };

  // Helper to render routine item (NO play button, enhanced font sizes)
  const renderRoutineCard = (routine: Routine) => {
    const log = logs.find((l) => l.routineId === routine.id && l.date === selectedDateKey);
    const isCompleted = Boolean(log?.completed);
    const category = categories.find((c) => c.id === routine.categoryId);
    const isMenuOpen = menuOpenRoutineId === routine.id;

    return (
      <article
        key={routine.id}
        className={`w-full rounded-2xl p-4 flex items-center justify-between gap-3 transition-all relative ${
          isCompleted
            ? 'bg-surface-container-low/70 border border-surface-container/60 hover:bg-surface-container-low'
            : 'bg-surface-container-lowest border-l-4 border-l-primary border border-surface-container/80 shadow-[0_3px_16px_-2px_rgba(29,78,216,0.06)]'
        }`}
      >
        {/* Left Emoji Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 select-none ${
            isCompleted
              ? 'bg-surface-container-highest text-primary/70'
              : 'bg-primary-fixed/60 text-primary'
          }`}
        >
          {routine.emoji || '✨'}
        </div>

        {/* Center Text Container: larger readable typography */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 flex-wrap">
            {routine.reminderTime && (
              <span className="text-[12px] text-tertiary font-semibold">
                {routine.reminderTime}
              </span>
            )}
            <span
              className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                isCompleted
                  ? 'bg-surface-container-high text-primary'
                  : 'bg-surface-container-low text-primary'
              }`}
            >
              {routine.tag || category?.name || '루틴'}
            </span>
            <span className="text-[12px] text-secondary font-bold">
              +{routine.xp || 40}XP
            </span>
          </div>

          <h3
            className={`font-bold text-[16px] mt-1 break-keep leading-snug ${
              isCompleted ? 'line-through text-outline' : 'text-on-surface'
            }`}
          >
            {routine.title}
          </h3>

          {log?.note && (
            <p className="text-[13px] text-tertiary mt-1 italic line-clamp-1 flex items-center gap-1">
              <span>💬</span>
              <span>"{log.note}"</span>
            </p>
          )}
        </div>

        {/* Right Action Cluster (Options Menu & Complete Checkbox - NO PLAY BUTTON) */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* Action Menu (Memo, Edit, Delete) */}
          <div className="relative">
            <button
              onClick={() => setMenuOpenRoutineId(isMenuOpen ? null : routine.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                log?.note
                  ? 'bg-secondary-fixed text-secondary'
                  : 'bg-surface-container-low hover:bg-surface-container text-tertiary'
              }`}
              title="옵션 메뉴 (메모/수정/삭제)"
            >
              <span className="material-symbols-outlined text-[18px]">
                {log?.note ? 'edit_note' : 'more_vert'}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-10 z-50 w-36 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container p-1 flex flex-col gap-0.5">
                <button
                  onClick={() => {
                    setMenuOpenRoutineId(null);
                    onOpenMemo(routine.id);
                  }}
                  className="w-full px-3 py-2 text-left text-[13px] font-semibold text-on-surface hover:bg-surface-container-low rounded-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px] text-tertiary">
                    edit_note
                  </span>
                  <span>회고 메모</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpenRoutineId(null);
                    onEditRoutine(routine);
                  }}
                  className="w-full px-3 py-2 text-left text-[13px] font-semibold text-on-surface hover:bg-surface-container-low rounded-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    edit
                  </span>
                  <span>루틴 수정</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpenRoutineId(null);
                    if (confirm(`'${routine.title}' 루틴을 정말 삭제하시겠습니까?`)) {
                      onDeleteRoutine(routine.id);
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-[13px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px] text-rose-600">
                    delete
                  </span>
                  <span>루틴 삭제</span>
                </button>
              </div>
            )}
          </div>

          {/* Toggle Complete Checkbox */}
          <button
            onClick={() => handleCheckboxClick(routine.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isCompleted
                ? 'bg-primary text-white shadow-xs'
                : 'border-2 border-outline-variant hover:border-primary hover:bg-primary-fixed/20 text-transparent'
            }`}
            title={isCompleted ? '완료 취소' : '완료 체크'}
          >
            <span
              className={`material-symbols-outlined text-[22px] font-bold ${
                isCompleted ? 'text-white' : 'opacity-0 hover:opacity-40 text-primary'
              }`}
            >
              check
            </span>
          </button>
        </div>
      </article>
    );
  };

  // Helper to render a partitioned time block
  const renderTimeBlock = (
    title: string,
    timeRange: string,
    timeOfDayKey: TimeOfDay,
    blockRoutines: Routine[]
  ) => {
    const completedCount = blockRoutines.filter((r) =>
      logs.some((l) => l.routineId === r.id && l.date === selectedDateKey && l.completed)
    ).length;
    const totalCount = blockRoutines.length;
    const isAllDone = totalCount > 0 && completedCount === totalCount;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <section className="bg-surface-container-lowest/90 rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.05)] border border-surface-container/70 flex flex-col gap-3">
        {/* Block Header: Title on top, Time placed underneath, No Emojis */}
        <div className="flex items-center justify-between pb-2.5 border-b border-surface-container/50">
          <div className="flex flex-col">
            <h3 className="font-extrabold text-[18px] text-on-surface tracking-tight">
              {title}
            </h3>
            <span className="text-[13px] text-tertiary font-semibold mt-0.5">
              {timeRange}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {totalCount > 0 ? (
              <span
                className={`text-[13px] font-bold px-3 py-1 rounded-full ${
                  isAllDone
                    ? 'bg-primary text-white shadow-2xs'
                    : completedCount > 0
                    ? 'bg-primary-fixed text-primary'
                    : 'bg-surface-container text-tertiary'
                }`}
              >
                {isAllDone ? '전체 완료' : `${completedCount}/${totalCount} 완료`}
              </span>
            ) : null}

            <button
              onClick={() => onOpenAddModal(timeOfDayKey)}
              className="text-xs text-primary hover:text-primary-container font-semibold p-1.5 hover:bg-surface-container-low rounded-lg transition"
              title={`${title} 추가`}
            >
              <span className="material-symbols-outlined text-[19px]">add</span>
            </button>
          </div>
        </div>

        {/* Mini progress bar if routines exist */}
        {totalCount > 0 && (
          <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        )}

        {/* Routine Cards inside Block */}
        {totalCount === 0 ? (
          <button
            onClick={() => onOpenAddModal(timeOfDayKey)}
            className="w-full py-3.5 border border-dashed border-outline-variant hover:border-primary rounded-xl flex items-center justify-center gap-1.5 text-[14px] text-tertiary hover:text-primary transition-colors bg-surface-container-low/30 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ {title} 추가하기</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2.5">
            {blockRoutines.map((routine) => renderRoutineCard(routine))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="flex flex-col w-full pb-8 gap-space-lg select-none">
      {/* Top Greeting & Motivation Banner */}
      <section className="flex flex-col gap-space-sm pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary border border-blue-100/90 shadow-2xs">
            <span className="text-[16px] leading-none select-none">🔥</span>
            <span className="text-[13px] font-bold tracking-tight text-[#0f2e7a]">
              {streakCount}일째 꾸준함 유지 중
            </span>
          </div>
          <span className="text-[13px] text-tertiary font-semibold">
            {formatDisplayDate(selectedDateKey)}
          </span>
        </div>

        <div className="flex flex-col">
          <h1 className="text-[21px] text-on-surface font-extrabold tracking-tight">
            안녕하세요, SJ님 ✨
          </h1>
          <p className="text-[14px] text-tertiary mt-0.5">
            {isToday ? '오늘의 모어해빗 루틴을' : '선택한 날짜의 루틴을'}{' '}
            <span className="font-bold text-primary">{stats.percentage}%</span> 달성했어요!
          </p>
        </div>

        {/* Weekly Streak Strip */}
        <div className="flex items-center justify-between gap-1.5 pt-2 overflow-x-auto no-scrollbar">
          {weekDates.map((item: WeekDateItem) => {
            const dateObj = new Date(item.date);
            const dayOfWeek = dateObj.getDay();
            const label = dayLabels[dayOfWeek];
            const isSelected = item.key === selectedDateKey;
            const isCurrentToday = isDateToday(item.key);

            const dayStats = getDailyStats(routines, logs, item.key);
            const isAllDone = dayStats.totalRoutines > 0 && dayStats.percentage === 100;
            const isPartDone = dayStats.percentage > 0;

            return (
              <button
                key={item.key}
                onClick={() => onSelectDate(item.key)}
                className={`flex flex-col items-center justify-center flex-1 py-2.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-[0_6px_18px_-2px_rgba(29,78,216,0.35)] scale-105'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span
                  className={`text-[12px] font-bold mb-1 ${
                    isSelected ? 'text-[#bfdbfe]' : 'text-on-surface-variant'
                  }`}
                >
                  {isCurrentToday ? '오늘' : label}
                </span>

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-white text-primary font-bold shadow-2xs'
                      : isAllDone
                      ? 'bg-primary text-white'
                      : isPartDone
                      ? 'bg-primary-fixed text-primary'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {isAllDone ? (
                    <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                  ) : isPartDone ? (
                    <span className="text-[11px] font-bold">{dayStats.completedRoutines}</span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                  )}
                </div>

                <span
                  className={`text-[11px] mt-1 font-bold ${
                    isSelected ? 'text-white' : 'text-on-surface-variant'
                  }`}
                >
                  {item.day}
                </span>
              </button>
            );
          })}
        </div>
      </section>


      {/* Daily Progress Summary Bento Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] flex flex-col gap-space-md border border-surface-container/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[15px] text-on-surface font-extrabold tracking-tight">
              오늘의 달성률 현황
            </span>
          </div>
          <span className="text-[12px] text-primary font-bold bg-surface-container-low px-2.5 py-0.5 rounded-full">
            {stats.percentage >= 100
              ? '완벽 달성! 🎉'
              : stats.percentage >= 70
              ? '순항 중 ✨'
              : stats.percentage > 0
              ? '시작이 반 🌱'
              : '준비 중 🚀'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-space-md">
          {/* Radial Meter (SVG) */}
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-surface-container"
                cx="50"
                cy="50"
                fill="none"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
              ></circle>
              <circle
                className="transition-all duration-700 ease-out"
                cx="50"
                cy="50"
                fill="none"
                r="40"
                stroke="url(#routineBlueGrad)"
                strokeDasharray="251.32"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="8"
              ></circle>
              <defs>
                <linearGradient id="routineBlueGrad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#1d4ed8"></stop>
                  <stop offset="100%" stopColor="#3b82f6"></stop>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="flex items-baseline justify-center leading-none text-primary">
                <span className="text-[21px] font-black tracking-tight tabular-nums">
                  {stats.percentage}
                </span>
                <span className="text-[13px] font-black ml-0.5">
                  %
                </span>
              </div>
              <span className="text-[11px] text-tertiary font-semibold mt-1">
                목표 달성
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col justify-between">
              <span className="text-[12px] text-tertiary font-semibold">완료 루틴</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[18px] font-extrabold text-primary">
                  {stats.completedRoutines}
                </span>
                <span className="text-[12px] text-on-surface-variant font-medium">
                  / {stats.totalRoutines}개
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col justify-between">
              <span className="text-[12px] text-tertiary font-semibold">남은 루틴</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[18px] font-extrabold text-secondary">
                  {Math.max(0, stats.totalRoutines - stats.completedRoutines)}
                </span>
                <span className="text-[12px] text-on-surface-variant font-medium">
                  개
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col justify-between">
              <span className="text-[12px] text-tertiary font-semibold">총 몰입 시간</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[18px] font-extrabold text-on-surface">
                  {stats.completedRoutines * 15}
                </span>
                <span className="text-[12px] text-on-surface-variant font-medium">
                  분
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col justify-between">
              <span className="text-[12px] text-tertiary font-semibold">획득 경험치</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[18px] font-extrabold text-secondary">
                  +{totalXpEarned}
                </span>
                <span className="text-[12px] text-secondary font-bold">
                  XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 100% All Habits Completed - Mobit Special Praise Card */}
      {stats.totalRoutines > 0 && stats.percentage === 100 && (
        <section
          onClick={() => setIsAllDoneModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-4 shadow-[0_8px_24px_-4px_rgba(29,78,216,0.3)] flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25">
              <MobitKoala mood="proud" className="w-12 h-12" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                  100% ALL CLEAR 🏆
                </span>
                <span className="text-[11px] text-blue-100 font-bold">오늘 습관 완벽 달성</span>
              </div>
              <h3 className="text-[15px] font-black text-white mt-1.5 leading-snug break-keep">
                "모빗이가 격하게 칭찬해요!<br />
                오늘 모든 습관을 다 해냈어요!"
              </h3>
            </div>
          </div>
          <span className="material-symbols-outlined text-white/80 text-[24px] shrink-0">
            chevron_right
          </span>
        </section>
      )}

      {/* Routine Category Filter Tabs */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-full text-[14.5px] transition-all flex items-center gap-1.5 shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-primary text-white font-extrabold shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface font-bold'
            }`}
          >
            <span>전체</span>
            <span
              className={`w-4 h-4 rounded-full text-[11px] flex items-center justify-center font-bold ${
                selectedFilter === 'all'
                  ? 'bg-white text-primary'
                  : 'bg-surface-container text-tertiary'
              }`}
            >
              {routines.filter((r) => !r.archived).length}
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('morning')}
            className={`px-4 py-2 rounded-full text-[14.5px] transition-all flex items-center gap-1.5 shrink-0 ${
              selectedFilter === 'morning'
                ? 'bg-primary text-white font-extrabold shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface font-bold'
            }`}
          >
            <span>오전 루틴</span>
            <span className="text-tertiary text-[12px] font-bold">{morningRoutines.length}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('afternoon')}
            className={`px-4 py-2 rounded-full text-[14.5px] transition-all flex items-center gap-1.5 shrink-0 ${
              selectedFilter === 'afternoon'
                ? 'bg-primary text-white font-extrabold shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface font-bold'
            }`}
          >
            <span>낮 루틴</span>
            <span className="text-tertiary text-[12px] font-bold">{afternoonRoutines.length}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('night')}
            className={`px-4 py-2 rounded-full text-[14.5px] transition-all flex items-center gap-1.5 shrink-0 ${
              selectedFilter === 'night'
                ? 'bg-primary text-white font-extrabold shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface font-bold'
            }`}
          >
            <span>저녁 루틴</span>
            <span className="text-tertiary text-[12px] font-bold">{nightRoutines.length}</span>
          </button>
        </div>
      </section>

      {/* Routine Feed Partitioned by Time Blocks: Pure Mobile Single-Column Feed */}
      <div className="flex flex-col gap-4">
        {/* Morning Block */}
        {(selectedFilter === 'all' || selectedFilter === 'morning') &&
          renderTimeBlock('오전 루틴', '06:00 ~ 12:00', 'morning', morningRoutines)}

        {/* Afternoon Block */}
        {(selectedFilter === 'all' || selectedFilter === 'afternoon') &&
          renderTimeBlock('낮 루틴', '12:00 ~ 18:00', 'afternoon', afternoonRoutines)}

        {/* Evening / Night Block */}
        {(selectedFilter === 'all' || selectedFilter === 'night') &&
          renderTimeBlock('저녁 루틴', '18:00 ~ 24:00', 'night', nightRoutines)}

        {/* Anytime Block if any */}
        {selectedFilter === 'all' && anytimeRoutines.length > 0 &&
          renderTimeBlock('상시 루틴', '하루 중 언제나', 'anytime', anytimeRoutines)}
      </div>

      {/* Ambient Micro Habit Inspiration Widget */}
      <section className="bg-surface-container-low/60 rounded-xl p-space-md flex items-center gap-space-md mt-1 border border-surface-container/60">
        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[20px]">spa</span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[12px] text-tertiary font-bold tracking-tight">
            오늘의 모어해빗 한 줄
          </span>
          <p className="text-[14px] text-on-surface italic mt-0.5 line-clamp-1 font-medium">
            "완벽하지 않아도 괜찮아요, 작은 걸음도 나아감입니다."
          </p>
        </div>
      </section>

      {/* Floating Action Button for Adding Routine - Pure White '+' and Royal Blue background */}
      <div className="fixed bottom-24 right-5 z-40">
        <button
          onClick={() => onOpenAddModal()}
          className="w-14 h-14 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] flex items-center justify-center shadow-[0_12px_28px_-4px_rgba(29,78,216,0.45)] active:scale-95 transition-all duration-200 border border-[#3b82f6]"
          style={{ color: '#ffffff' }}
          aria-label="루틴 추가"
        >
          <span
            className="material-symbols-outlined text-[28px] font-bold text-white"
            style={{ color: '#ffffff', fontVariationSettings: "'wght' 700" }}
          >
            add
          </span>
        </button>
      </div>


      {/* 100% All Habits Completed Celebration Modal (모빗의 올클리어 칭찬) */}
      <MobitAllDoneModal
        isOpen={isAllDoneModalOpen}
        onClose={() => setIsAllDoneModalOpen(false)}
        totalRoutines={stats.totalRoutines}
      />
    </div>
  );
};
