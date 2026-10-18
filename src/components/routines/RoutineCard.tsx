import React, { useState } from 'react';
import type { Routine, RoutineLog, Category } from '../../types/routine';
import { CategoryBadge, TimeBadge, RepeatBadge } from '../common/Badge';
import { Check, Flame, MessageSquare, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { useLanguage } from '../../utils/i18n';

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
  const { t, language } = useLanguage();
  const isCompleted = log?.completed === true;
  const hasNote = Boolean(log?.note && log.note.trim().length > 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const streakUnit = language === 'en' ? 'd' : language === 'ja' ? '日' : '일';

  return (
    <>
      <div
        className={`group relative rounded-3xl p-4 transition-all duration-200 border ${
          isCompleted
            ? 'bg-blue-50/50 border-blue-200/90 shadow-2xs'
            : 'bg-white border-slate-200/90 shadow-xs hover:border-blue-300'
        }`}
      >
        <div className="flex items-center gap-3.5">
          {/* Stamp / Check Button */}
          <button
            onClick={() => onToggleComplete(routine.id)}
            className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ${
              isCompleted
                ? 'bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary/20'
                : 'bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-primary border border-slate-200 hover:border-primary'
            }`}
            aria-label={isCompleted ? (language === 'en' ? 'Uncheck habit' : language === 'ja' ? 'チェック解除' : '습관 완료 취소') : (language === 'en' ? 'Complete habit' : language === 'ja' ? '習慣完了' : '습관 완료 체크')}
          >
            {isCompleted ? (
              <div className="animate-stamp">
                <Check size={22} strokeWidth={3} />
              </div>
            ) : (
              <span className="text-lg select-none group-hover:scale-110 transition-transform">
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
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                  <Flame size={11} className="fill-amber-500 text-amber-500" />
                  {streak}{streakUnit}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h3
                className={`font-black text-sm tracking-tight transition-colors line-clamp-1 ${
                  isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                }`}
              >
                {routine.title}
              </h3>
            </div>

            {/* Routine Memo preview if exists */}
            {hasNote && (
              <div
                onClick={() => onOpenMemo(routine.id)}
                className="mt-2 text-xs text-slate-600 bg-blue-50/70 border border-blue-100 rounded-xl px-2.5 py-1.5 flex items-start gap-1.5 cursor-pointer hover:bg-blue-100/60 transition"
              >
                <MessageSquare size={13} className="text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2">{log?.note}</span>
              </div>
            )}
          </div>

          {/* Action icons (Memo + More Options) */}
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => onOpenMemo(routine.id)}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                hasNote
                  ? 'text-primary bg-blue-50 hover:bg-blue-100'
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
              }`}
              title={language === 'en' ? 'Habit memo' : language === 'ja' ? '習慣メモ' : '습관 메모'}
            >
              <MessageSquare size={16} />
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition cursor-pointer"
              aria-label={language === 'en' ? 'More options' : language === 'ja' ? 'その他のオプション' : '더보기 메뉴'}
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
                <div className="absolute right-0 top-8 z-30 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 text-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(routine);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 text-left transition cursor-pointer"
                  >
                    <Edit2 size={13} className="text-slate-500" />
                    <span>{t.common?.edit || '수정'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-rose-600 hover:bg-rose-50 text-left transition cursor-pointer"
                  >
                    <Trash2 size={13} className="text-rose-500" />
                    <span>{t.common?.delete || '삭제'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Routine Safe Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        itemName={routine.title}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(routine.id);
        }}
      />
    </>
  );
};
