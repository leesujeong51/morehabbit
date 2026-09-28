import React from 'react';
import type { ActiveTab } from '../../types/routine';

interface AppHeaderProps {
  activeTab: ActiveTab;
  streakCount: number;
  onNavigateToProfile: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  streakCount,
  onNavigateToProfile,
}) => {
  // Format today's date in Korean (e.g., "9월 28일 (월)")
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[today.getDay()];
  const formattedToday = `${month}월 ${date}일 (${dayName})`;

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 pt-safe bg-[#f4f7fc]/95 backdrop-blur-xl border-b border-blue-100/70 shadow-[0_1px_8px_rgba(29,78,216,0.03)]">
      <div className="h-16 px-margin flex items-center justify-between gap-space-sm max-w-md mx-auto">
        {/* Left: mh Glyph Logo & Today's Date */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 flex items-center justify-center shrink-0" title="morehabbit">
            <svg
              className="w-7 h-7 text-primary"
              viewBox="0 0 36 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Lowercase 'm' */}
              <path
                d="M4 22V11C4 8.5 5.8 7 8 7C10.2 7 12 8.5 12 11V22"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 11C12 8.5 13.8 7 16 7C18.2 7 20 8.5 20 11V22"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Lowercase 'h' */}
              <path
                d="M25 4V22"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M25 11.5C25 8.8 26.8 7 29.2 7C31.5 7 33 8.8 33 11.5V22"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[17px] font-extrabold text-[#0f2e7a] tracking-tight leading-none truncate">
            {formattedToday}
          </span>
        </div>

        {/* Right: Flame Streak Button (Click to navigate to My Profile, Blue SJ removed) */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onNavigateToProfile}
            className="h-9 px-3 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center gap-1.5 select-none active:scale-95 transition-all hover:bg-slate-50 cursor-pointer"
            title={`연속 실천 ${streakCount}일째 (터치 시 내 정보로 이동)`}
            aria-label="내 정보 이동"
          >
            <span className="text-[17px] leading-none select-none">🔥</span>
            <span className="text-[15px] font-black text-[#0f2e7a] leading-none tabular-nums">
              {streakCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
