import React from 'react';
import type { SleepLog, SleepQuality } from '../../types/routine';

interface SleepPatternCardProps {
  sleepLog?: SleepLog;
  onOpenRecordModal: () => void;
}

const QUALITY_LABELS: Record<SleepQuality, { emoji: string; label: string; bg: string; text: string }> = {
  great: { emoji: '😴', label: '꿀잠 (완전 개운함)', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  good: { emoji: '🙂', label: '보통 (적당한 수면)', bg: 'bg-blue-100', text: 'text-blue-800' },
  fair: { emoji: '🥱', label: '피곤 (중간에 깸)', bg: 'bg-amber-100', text: 'text-amber-800' },
  poor: { emoji: '😫', label: '설침 (잠을 설침)', bg: 'bg-rose-100', text: 'text-rose-800' },
};

export const SleepPatternCard: React.FC<SleepPatternCardProps> = ({
  sleepLog,
  onOpenRecordModal,
}) => {
  if (sleepLog) {
    const hours = Math.floor(sleepLog.durationMinutes / 60);
    const minutes = sleepLog.durationMinutes % 60;
    const qInfo = QUALITY_LABELS[sleepLog.quality] || QUALITY_LABELS.great;
    const targetPercent = Math.min(100, Math.round((sleepLog.durationMinutes / 480) * 100));

    return (
      <section className="bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#4338ca] text-white rounded-2xl p-4 shadow-[0_8px_24px_-4px_rgba(29,78,216,0.25)] relative overflow-hidden border border-blue-400/30 transition-all">
        {/* Ambient subtle luminous glow */}
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌙</span>
            <span className="text-[14px] font-extrabold text-blue-100 tracking-tight">
              수면 패턴 분석
            </span>
          </div>

          <button
            onClick={onOpenRecordModal}
            className="text-[12px] bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full font-bold backdrop-blur-sm transition active:scale-95 flex items-center gap-1 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            <span>수정</span>
          </button>
        </div>

        <div className="flex items-center justify-between mt-3 relative z-10">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-black tracking-tight text-white leading-none">
                {hours}시간 {minutes > 0 ? `${minutes}분` : ''}
              </span>
              <span className="text-[13px] text-blue-200 font-bold">
                ({sleepLog.bedtime} ~ {sleepLog.wakeTime})
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-white/20 text-white flex items-center gap-1.5 backdrop-blur-sm border border-white/15">
                <span>{qInfo.emoji}</span>
                <span>{qInfo.label}</span>
              </span>
            </div>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex flex-col items-center justify-center border border-white/20 shadow-xs shrink-0">
            <span className="text-[10px] text-blue-100 font-bold">수면 충족</span>
            <span className="text-[14px] font-black text-white mt-0.5">
              {targetPercent}%
            </span>
          </div>
        </div>

        {sleepLog.note && (
          <div className="mt-3 pt-2.5 border-t border-white/15 text-[13px] text-blue-100 italic flex items-center gap-1.5 relative z-10">
            <span>💬</span>
            <span className="truncate">"{sleepLog.note}"</span>
          </div>
        )}
      </section>
    );
  }

  // Not recorded yet: inviting, radiant Royal Blue point card
  return (
    <section
      onClick={onOpenRecordModal}
      className="bg-surface-container-lowest hover:bg-blue-50/40 rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(29,78,216,0.06)] border border-blue-100/80 cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#4338ca] text-white flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-xs">
          🌙
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-extrabold text-on-surface flex items-center gap-1">
            <span>어젯밤 수면 패턴 기록하기</span>
            <span className="text-secondary text-[12px]">✨</span>
          </span>
          <p className="text-[13px] text-tertiary truncate mt-0.5 font-medium">
            취침·기상 시간을 기록하고 활력 넘치는 하루를 시작해보세요.
          </p>
        </div>
      </div>

      <button
        type="button"
        className="px-3.5 py-2 rounded-full bg-primary hover:bg-blue-700 text-white text-[13px] font-bold shrink-0 shadow-xs transition-colors active:scale-95"
      >
        기록하기
      </button>
    </section>
  );
};
