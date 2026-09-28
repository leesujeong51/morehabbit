import React from 'react';
import type { ActiveTab, Routine, RoutineLog, SleepLog } from '../../types/routine';
import { toDateKey } from '../../utils/dateUtils';

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenSleepModal: () => void;
  viewMode: 'desktop' | 'mobile';
  onChangeViewMode: (mode: 'desktop' | 'mobile') => void;
  streakCount: number;
  routines: Routine[];
  logs: RoutineLog[];
  todaySleepLog?: SleepLog;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenSleepModal,
  viewMode,
  onChangeViewMode,
  streakCount,
  routines,
  logs,
  todaySleepLog,
}) => {
  const todayKey = toDateKey();
  const activeRoutines = routines.filter((r) => !r.archived);
  const completedTodayCount = activeRoutines.filter((r) =>
    logs.some((l) => l.routineId === r.id && l.date === todayKey && l.completed)
  ).length;
  const remainingCount = Math.max(0, activeRoutines.length - completedTodayCount);

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    subLabel: string;
    icon: string;
    badge?: string;
  }> = [
    {
      id: 'today',
      label: '오늘의 루틴',
      subLabel: 'Today Dashboard',
      icon: 'cottage',
      badge: remainingCount > 0 ? `${remainingCount}개 남음` : '완료 🎉',
    },
    {
      id: 'explore',
      label: '루틴 탐색',
      subLabel: 'Explore & Templates',
      icon: 'explore',
      badge: '추천',
    },
    {
      id: 'stats',
      label: '통계 & 성장',
      subLabel: 'Stats & Streak',
      icon: 'bar_chart',
      badge: `${streakCount}일 연속`,
    },
    {
      id: 'focus',
      label: '포커스 타이머',
      subLabel: 'Focus Timer',
      icon: 'timer',
      badge: '20분',
    },
  ];

  return (
    <aside className="w-64 fixed left-0 top-0 bottom-0 bg-surface-container-lowest border-r border-surface-container/70 shadow-[2px_0_16px_rgba(46,107,86,0.04)] z-40 flex flex-col justify-between p-5 select-none overflow-y-auto no-scrollbar">
      {/* Top Branding & Main Navigation */}
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-10 h-10 rounded-2xl bg-[#10533f] flex items-center justify-center text-white font-black text-base shadow-[0_4px_12px_rgba(16,83,63,0.3)]">
            🌿
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-primary tracking-tight">SJ</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-[#002116]">
                Routiny
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium mt-0.5">
              PC 대시보드 스튜디오
            </span>
          </div>
        </div>

        {/* Quick Add Routine Primary CTA */}
        <button
          onClick={onOpenAddModal}
          className="w-full h-11 rounded-xl bg-primary hover:bg-[#186f55] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_6px_20px_-2px_rgba(16,83,63,0.35)] active:scale-[0.98] transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[20px] font-bold">add</span>
          <span>새 루틴 등록</span>
        </button>

        {/* Navigation Menu Links */}
        <nav className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-tertiary px-2 uppercase tracking-wider mb-1">
            메뉴
          </span>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'text-on-surface hover:bg-surface-container-low font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-container text-primary group-hover:bg-primary-fixed'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm leading-tight">{item.label}</span>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        isActive ? 'text-white/80' : 'text-on-surface-variant'
                      }`}
                    >
                      {item.subLabel}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : item.badge.includes('남음')
                        ? 'bg-secondary-fixed text-secondary'
                        : 'bg-primary-fixed text-primary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Mini Widget: Streak & Sleep Quick Glance */}
        <div className="flex flex-col gap-2.5 pt-2">
          {/* Streak Card */}
          <div className="bg-surface-container-low/70 rounded-xl p-3 border border-surface-container/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔥</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">
                  {streakCount > 0 ? `${streakCount}일 연속 달성` : '오늘부터 1일!'}
                </span>
                <span className="text-[10px] text-tertiary">
                  {remainingCount === 0 ? '오늘 모든 루틴 완료!' : `${remainingCount}개 루틴 진행 중`}
                </span>
              </div>
            </div>
            <span className="text-xs font-extrabold text-secondary">
              +{completedTodayCount * 40}XP
            </span>
          </div>

          {/* Sleep Record Quick Glance */}
          <button
            onClick={onOpenSleepModal}
            className="w-full bg-slate-900/90 hover:bg-slate-900 text-white rounded-xl p-3 text-left transition-colors flex items-center justify-between shadow-xs group"
            title="수면 패턴 수정 및 기록"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🌙</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white group-hover:text-primary-fixed transition-colors">
                  {todaySleepLog
                    ? `${Math.floor(todaySleepLog.durationMinutes / 60)}시간 ${todaySleepLog.durationMinutes % 60}분 수면`
                    : '수면 기록하기'}
                </span>
                <span className="text-[10px] text-slate-300">
                  {todaySleepLog
                    ? `${todaySleepLog.bedtime} ~ ${todaySleepLog.wakeTime}`
                    : '취침/기상 시간 입력'}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-white transition-colors">
              edit
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Area: View Mode Switcher & User Profile */}
      <div className="flex flex-col gap-3 pt-4 border-t border-surface-container/70">
        {/* Device View Mode Switcher */}
        <div className="bg-surface-container-low p-1 rounded-xl flex items-center justify-between border border-surface-container/60">
          <button
            onClick={() => onChangeViewMode('desktop')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'desktop'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="PC 모니터에 최적화된 와이드 대시보드 뷰"
          >
            <span className="material-symbols-outlined text-[15px]">desktop_windows</span>
            <span>PC 와이드</span>
          </button>

          <button
            onClick={() => onChangeViewMode('mobile')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'mobile'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="모바일 스마트폰 화면 미리보기"
          >
            <span className="material-symbols-outlined text-[15px]">smartphone</span>
            <span>모바일 뷰</span>
          </button>
        </div>

        {/* User Profile & Data Settings Trigger */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs border border-primary/20 shrink-0">
              SJ
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface truncate">SJ님</span>
              <span className="text-[10px] text-tertiary">로컬 데이터 저장됨</span>
            </div>
          </div>

          <button
            onClick={onOpenSettingsModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            title="데이터 백업 및 설정"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
