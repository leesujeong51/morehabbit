import React from 'react';
import type { ActiveTab } from '../../types/routine';
import { useLanguage } from '../../utils/i18n';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const { t } = useLanguage();

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: string;
    isCenter?: boolean;
  }> = [
    { id: 'explore', label: t.nav.explore, icon: 'explore' },
    { id: 'pomodoro', label: t.nav.pomodoro, icon: 'timer' },
    { id: 'today', label: t.nav.today, icon: 'home', isCenter: true },
    { id: 'stats', label: t.nav.stats, icon: 'bar_chart' },
    { id: 'profile', label: t.nav.profile, icon: 'person' },
  ];

  return (
    /* 바닥 고정 하단 네비게이션 바 (가운데 홈 버튼 눈에 띄게 대폭 확대) */
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-3px_16px_rgba(15,23,42,0.06)] pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive =
            activeTab === item.id || (item.id === 'pomodoro' && activeTab === 'focus');
          const isCenter = Boolean(item.isCenter);

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 h-full flex flex-col items-center justify-center transition-all duration-150 active:scale-95 group select-none cursor-pointer ${
                isCenter ? 'relative' : ''
              }`}
            >
              {/* Icon Container - Center Home Button is noticeably larger & commanding (Request 6 & Image 3) */}
              <div
                className={`flex items-center justify-center transition-all duration-150 ${
                  isCenter
                    ? isActive
                      ? 'w-14 h-9 rounded-full bg-primary text-white shadow-md shadow-blue-500/25 scale-105'
                      : 'w-14 h-9 rounded-full bg-blue-50/70 text-primary border border-blue-200/80 group-hover:bg-blue-100'
                    : isActive
                    ? 'w-10 h-7 rounded-full bg-blue-100/90 text-primary'
                    : 'w-10 h-7 rounded-full text-slate-500 group-hover:bg-slate-100/70 group-hover:text-slate-800'
                }`}
              >
                <span
                  className={`material-symbols-outlined transition-transform duration-150 ${
                    isCenter ? 'text-xl' : 'text-lg'
                  }`}
                  style={{
                    fontVariationSettings: isActive
                      ? "'FILL' 1, 'wght' 700"
                      : isCenter
                      ? "'FILL' 1, 'wght' 600"
                      : "'FILL' 0, 'wght' 400",
                  }}
                >
                  {item.icon}
                </span>
              </div>

              {/* Label */}
              <span
                className={`mt-1 leading-none tracking-tight whitespace-nowrap break-keep ${
                  isCenter
                    ? isActive
                      ? 'text-primary font-black text-xs'
                      : 'text-primary font-bold text-xs'
                    : isActive
                    ? 'text-primary font-black text-xs'
                    : 'text-slate-500 group-hover:text-slate-800 font-bold text-xs'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
