import React from 'react';
import type { ActiveTab, Routine, RoutineLog } from '../../types/routine';
import { formatDisplayDate, toDateKey } from '../../utils/dateUtils';
import { getDailyStats } from '../../utils/routineUtils';

interface DesktopHeaderProps {
  activeTab: ActiveTab;
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  viewMode: 'desktop' | 'mobile';
  onChangeViewMode: (mode: 'desktop' | 'mobile') => void;
  routines: Routine[];
  logs: RoutineLog[];
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  activeTab,
  selectedDateKey,
  onSelectDate,
  onOpenAddModal,
  onOpenSettingsModal,
  viewMode,
  onChangeViewMode,
  routines,
  logs,
}) => {
  const todayKey = toDateKey();
  const isToday = selectedDateKey === todayKey;
  const stats = getDailyStats(routines, logs, selectedDateKey);

  // Navigate date by offset
  const handleOffsetDate = (offsetDays: number) => {
    const current = new Date(selectedDateKey);
    current.setDate(current.getDate() + offsetDays);
    onSelectDate(toDateKey(current));
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'today':
        return '오늘의 루틴';
      case 'explore':
        return '루틴 탐색 & 추천 팩';
      case 'stats':
        return '성장 통계 & 스트릭 분석';
      case 'focus':
        return '몰입 포커스 스튜디오';
      default:
        return 'Routiny';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/90 backdrop-blur-xl border-b border-surface-container/70 shadow-[0_1px_12px_rgba(46,107,86,0.03)] px-8 py-3.5 flex items-center justify-between select-none">
      {/* Left: Tab Title & Date Status */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-xl text-on-surface tracking-tight">
              {getTabTitle()}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">
              SJ Dashboard
            </span>
          </div>
          <p className="text-xs text-tertiary font-medium mt-0.5">
            {formatDisplayDate(selectedDateKey)} {isToday && '• 오늘'}
          </p>
        </div>

        {/* Date Stepper Buttons */}
        <div className="hidden sm:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container/60 ml-2">
          <button
            onClick={() => handleOffsetDate(-1)}
            className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
            title="이전 날짜"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <button
            onClick={() => onSelectDate(todayKey)}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              isToday
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => handleOffsetDate(1)}
            className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
            title="다음 날짜"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Right: Actions, Stats Pill & View Mode Switcher */}
      <div className="flex items-center gap-3">
        {/* Daily Completion Pill */}
        {stats.totalRoutines > 0 && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest border border-surface-container/80 shadow-2xs">
            <div
              className={`w-2 h-2 rounded-full ${
                stats.percentage === 100 ? 'bg-primary animate-ping' : 'bg-primary'
              }`}
            ></div>
            <span className="text-xs font-bold text-primary">
              {stats.completedRoutines}/{stats.totalRoutines} 완료 ({stats.percentage}%)
            </span>
          </div>
        )}

        {/* Quick Add Routine Button */}
        <button
          onClick={onOpenAddModal}
          className="h-9 px-3.5 rounded-xl bg-primary hover:bg-[#186f55] text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(16,83,63,0.25)] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>루틴 추가</span>
        </button>

        {/* View Mode Toggle Button */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-surface-container/60">
          <button
            onClick={() => onChangeViewMode('desktop')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              viewMode === 'desktop'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="PC 데스크톱 와이드 뷰"
          >
            <span className="material-symbols-outlined text-[15px]">desktop_windows</span>
            <span className="hidden xl:inline">PC 모드</span>
          </button>
          <button
            onClick={() => onChangeViewMode('mobile')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              viewMode === 'mobile'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="모바일 미리보기 프레임"
          >
            <span className="material-symbols-outlined text-[15px]">smartphone</span>
            <span className="hidden xl:inline">모바일</span>
          </button>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettingsModal}
          className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container/80 hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors shadow-2xs"
          title="설정 및 데이터 관리"
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs border border-primary/20">
          SJ
        </div>
      </div>
    </header>
  );
};
