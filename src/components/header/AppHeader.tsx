import React from 'react';
import type { ActiveTab } from '../../types/routine';
import { useLanguage, formatHeaderDate } from '../../utils/i18n';

interface AppHeaderProps {
  activeTab: ActiveTab;
  streakCount: number;
  onNavigateToProfile: () => void;
  onOpenStreakModal?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  streakCount,
  onNavigateToProfile,
  onOpenStreakModal,
}) => {
  const { language, t } = useLanguage();
  const formattedToday = formatHeaderDate(new Date(), language);

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 pt-safe bg-[#f4f7fc]/95 backdrop-blur-xl border-b border-blue-100/70 shadow-[0_1px_8px_rgba(29,78,216,0.03)]">
      <div className="h-16 px-margin flex items-center justify-between gap-space-sm max-w-md mx-auto">
        {/* Left: Today's Date */}
        <div className="flex items-center min-w-0">
          <span className="text-lg font-black text-[#0f2e7a] tracking-tight leading-none truncate">
            {formattedToday}
          </span>
        </div>

        {/* Right: Flame Streak Button (Click to open Streak Rule Celebration Modal) */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => {
              if (onOpenStreakModal) {
                onOpenStreakModal();
              } else {
                onNavigateToProfile();
              }
            }}
            className="h-10 px-3.5 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center gap-1.5 select-none active:scale-95 transition-all hover:bg-slate-50 cursor-pointer"
            title={t.header.streakDays.replace('{n}', String(streakCount))}
            aria-label={t.header.streakAria}
          >
            <span className="text-lg leading-none select-none">🔥</span>
            <span className="text-base font-black text-[#0f2e7a] leading-none tabular-nums">
              {streakCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
