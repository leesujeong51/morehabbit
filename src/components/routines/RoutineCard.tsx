import React from 'react';
import type { Routine, RoutineLog, Category } from '../../types/routine';
import { CategoryBadge, TimeBadge, RepeatBadge } from '../common/Badge';

import { Check, Flame, MessageSquare, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface RoutineCardProps {
  routine: Routine;
  category?: Category;
  log?: RoutineLog;
  streak: number;
  onToggleComplete: (routineId: string) => void;
  onOpenMemo: (routineId: string) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (routineId: string) => void;
}

export const RoutineCard: React.FC<RoutineCardProps> = ({
  routine,
  category,
  log,
  streak,
  onToggleComplete,
  onOpenMemo,
  onEdit,
  onDelete,
}) => {
  const isCompleted = log?.completed === true;
  const hasNote = Boolean(log?.note && log.note.trim().length > 0);
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div
      className={`group relative rounded-3xl p-4 transition-all duration-200 border ${
        isCompleted
          ? 'bg-white/80 border-[#DCEEC7] shadow-2xs'
          : 'bg-white border-[#E9E1DC] shadow-xs hover:border-[#C5C8BC]'
      }`}
    >
      <div className="flex items-center gap-3.5">
        {/* Stamp / Check Button */}
        <button
          onClick={() => onToggleComplete(routine.id)}
          className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
            isCompleted
              ? 'bg-[#455538] text-white shadow-md shadow-[#455538]/25 ring-2 ring-[#455538]/20'
              : 'bg-[#FBF2ED] hover:bg-[#EBF2E4] text-[#75786F] hover:text-[#455538] border border-[#E9E1DC] hover:border-[#455538]'
          }`}
          aria-label={isCompleted ? '루틴 완료 취소' : '루틴 완료 체크'}
        >
          {isCompleted ? (
            <div className="animate-stamp">
              <Check size={22} strokeWidth={3} />
            </div>
          ) : (
            <span className="text-xl select-none group-hover:scale-110 transition-transform">
              {routine.emoji}
            </span>
          )}
        </button>

        {/* Routine Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <CategoryBadge category={category} size="sm" />
            <TimeBadge timeOfDay={routine.timeOfDay} time={routine.reminderTime} />
            <RepeatBadge
              repeatType={routine.repeatType}
              repeatDays={routine.repeatDays}
              targetCount={routine.targetCountPerWeek}
            />
            {streak > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#795336] bg-[#FCEEE3] px-2 py-0.2 rounded-full">
                <Flame size={11} className="fill-[#C86D3B] text-[#C86D3B]" />
                {streak}일
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h3
              className={`font-bold text-sm tracking-tight transition-colors line-clamp-1 ${
                isCompleted ? 'text-[#75786F] line-through' : 'text-[#1E1B18]'
              }`}
            >
              {routine.title}
            </h3>
          </div>

          {/* Routine Memo preview if exists */}
          {hasNote && (
            <div
              onClick={() => onOpenMemo(routine.id)}
              className="mt-2 text-xs text-[#45483F] bg-[#FBF2ED] border border-[#E9E1DC] rounded-xl px-2.5 py-1.5 flex items-start gap-1.5 cursor-pointer hover:bg-[#F5ECE7] transition"
            >
              <MessageSquare size={13} className="text-[#455538] shrink-0 mt-0.5" />
              <span className="line-clamp-2">{log?.note}</span>
            </div>
          )}
        </div>


        {/* Action icons (Memo + More Options) */}
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => onOpenMemo(routine.id)}
            className={`p-1.5 rounded-full transition ${
              hasNote
                ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
            }`}
            title="루틴 메모 남기기"
          >
            <MessageSquare size={16} />
          </button>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition"
            aria-label="더보기 메뉴"
          >
            <MoreVertical size={16} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-30 w-32 bg-white rounded-xl shadow-lg border border-neutral-100 py-1 text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(routine);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 hover:bg-neutral-50 text-left transition"
                >
                  <Edit2 size={13} className="text-neutral-500" />
                  <span>수정</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(routine.id);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-rose-600 hover:bg-rose-50 text-left transition"
                >
                  <Trash2 size={13} className="text-rose-500" />
                  <span>삭제</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
