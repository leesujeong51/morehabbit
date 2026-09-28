import React from 'react';
import { ProgressRing } from '../common/ProgressRing';
import type { DailyStats } from '../../types/routine';
import { getEncouragementMessage } from '../../utils/routineUtils';

import { Trophy, Sparkles } from 'lucide-react';

interface DailyProgressCardProps {
  stats: DailyStats;
  isToday: boolean;
  dateDisplay: string;
}

export const DailyProgressCard: React.FC<DailyProgressCardProps> = ({
  stats,
  isToday,
  dateDisplay,
}) => {
  const encouragement = getEncouragementMessage(stats.percentage);
  const isAllCompleted = stats.totalRoutines > 0 && stats.percentage === 100;

  return (
    <div className="bg-[#FBF2ED] rounded-3xl p-4.5 shadow-2xs border border-[#E9E1DC] relative overflow-hidden">
      {/* Decorative subtle background gradient */}
      <div
        className={`absolute -right-12 -top-12 w-44 h-44 rounded-full blur-2xl pointer-events-none transition-all duration-700 ${
          isAllCompleted
            ? 'bg-[#DCEEC7]/70'
            : stats.percentage > 50
            ? 'bg-[#EBF2E4]/80'
            : 'bg-[#F5ECE7]'
        }`}
      />

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold text-[#75786F] tracking-wide">
              {isToday ? '오늘의 달성률' : `${dateDisplay} 달성률`}
            </span>
            {isAllCompleted && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCEEC7] text-[#2E3A24]">
                <Trophy size={10} className="text-[#455538]" />
                올클리어!
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="font-serif text-3xl font-bold text-[#1E1B18] tracking-tight">
              {stats.percentage}%
            </span>
            <span className="text-xs text-[#75786F] font-semibold">
              ({stats.completedRoutines} / {stats.totalRoutines} 완료)
            </span>
          </div>

          <p className="text-xs text-[#45483F] line-clamp-1 font-medium flex items-center gap-1">
            {isAllCompleted ? <Sparkles size={12} className="text-[#455538] shrink-0" /> : null}
            <span>{encouragement}</span>
          </p>

          {/* Linear Progress Bar */}
          <div className="w-full bg-[#E9E1DC] h-2 rounded-full mt-3.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isAllCompleted
                  ? 'bg-gradient-to-r from-[#455538] to-[#5D6D4E]'
                  : 'bg-gradient-to-r from-[#455538] to-[#795336]'
              }`}
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* Right Circular Gauge */}
        <div className="shrink-0 pl-2">
          <ProgressRing
            progress={stats.percentage}
            size={70}
            strokeWidth={7}
            color="#455538"
            trackColor="#E9E1DC"
          />
        </div>
      </div>
    </div>

  );
};
