import React from 'react';
import type { ActiveTab } from '../../types/routine';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: string;
    isCenter?: boolean;
  }> = [
    { id: 'explore', label: '탐색', icon: 'explore' },
    { id: 'pomodoro', label: '뽀모도로', icon: 'timer' },
    { id: 'today', label: '홈', icon: 'cottage', isCenter: true },
    { id: 'stats', label: '통계', icon: 'bar_chart' },
    { id: 'profile', label: '내 정보', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe px-margin pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto bg-surface-container-lowest/95 backdrop-blur-xl rounded-full shadow-[0_12px_32px_-4px_rgba(29,78,216,0.14),0_4px_12px_-2px_rgba(15,23,42,0.06)] px-2 py-1.5 border border-surface-container/70">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const isActive =
              activeTab === item.id || (item.id === 'pomodoro' && activeTab === 'focus');
            const isCenter = Boolean(item.isCenter);

            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center ${
                  isCenter ? 'min-w-[56px] -mt-1' : 'min-w-[50px]'
                } h-13 rounded-full transition-all duration-200 active:scale-95 group ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <div
                  className={`flex items-center justify-center transition-all duration-200 ${
                    isCenter
                      ? isActive
                        ? 'px-3.5 py-1.5 rounded-full bg-primary text-white shadow-md shadow-blue-600/30 scale-105'
                        : 'px-3 py-1 rounded-full group-hover:bg-primary-fixed/40 text-on-surface'
                      : isActive
                      ? 'px-3 py-1 rounded-full bg-primary-fixed text-primary shadow-2xs'
                      : 'px-3 py-1 rounded-full group-hover:bg-surface-container'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      isCenter ? 'text-[25px]' : 'text-[23px]'
                    } transition-transform duration-200 ${
                      isActive ? 'scale-105' : ''
                    }`}
                    style={{
                      fontVariationSettings: isActive
                        ? "'FILL' 1, 'wght' 600"
                        : "'FILL' 0, 'wght' 400",
                    }}
                  >
                    {item.icon}
                  </span>
                </div>
                <span
                  className={`${
                    isCenter
                      ? 'text-[14px] font-black tracking-tight mt-0.5'
                      : 'text-[13px] font-bold tracking-tight mt-0.5'
                  } leading-none ${
                    isCenter && isActive ? 'text-primary font-black' : ''
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
