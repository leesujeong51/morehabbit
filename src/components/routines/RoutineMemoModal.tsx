import React, { useState, useEffect } from 'react';
import type { Routine, RoutineLog } from '../../types/routine';
import { Check, Trash2, MessageSquare, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';
import { ConfirmModal } from '../common/ConfirmModal';

interface RoutineMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: Routine | null;
  log?: RoutineLog;
  dateKey: string;
  onSaveMemo: (routineId: string, note: string) => void;
  onDeleteMemo: (routineId: string) => void;
}

export const RoutineMemoModal: React.FC<RoutineMemoModalProps> = ({
  isOpen,
  onClose,
  routine,
  log,
  dateKey,
  onSaveMemo,
  onDeleteMemo,
}) => {
  const { t, language } = useLanguage();
  const [note, setNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setNote(log?.note || '');
  }, [log, isOpen]);

  if (!isOpen || !routine) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMemo(routine.id, note.trim());
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    /* Full-Page Native View (User Request: 앱 전체 모두 풀 페이지 형태로 팝업X) */
    <div className="fixed inset-0 z-50 bg-[#f4f7fc] flex flex-col overflow-y-auto animate-fadeIn select-none">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-4 py-3.5 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition font-bold text-sm cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>{t.common.back}</span>
          </button>
          <h2 className="text-base font-black text-[#0f2e7a]">
            {t.today.memoTitle}
          </h2>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-1.5 rounded-full bg-primary hover:bg-blue-700 text-white font-black text-xs shadow-xs cursor-pointer active:scale-95 transition"
          >
            {t.common.save}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto p-5 flex flex-col gap-4">
        {/* Routine Header Card */}
        <div className="bg-white rounded-2xl p-4 border border-blue-100/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-blue-50/80 border border-blue-100 text-lg flex items-center justify-center shrink-0">
            {routine.emoji || '✨'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {dateKey} {language === 'en' ? 'Log' : language === 'ja' ? '記録' : '실천 기록'}
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1 truncate">
              {routine.title}
            </h3>
          </div>
        </div>

        {/* Note Writing Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-blue-100/90 shadow-2xs flex flex-col gap-3">
          <label className="block text-sm font-extrabold text-[#0f2e7a] flex items-center gap-1.5">
            <MessageSquare size={16} className="text-primary" />
            <span>{t.today.memoTitle}</span>
          </label>

          <textarea
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.today.memoPlaceholder}
            className="w-full p-4 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm font-medium text-slate-900 placeholder:text-slate-400 resize-none shadow-inner bg-slate-50/50"
            autoFocus
          />

          <div className="flex items-center justify-between pt-2">
            {log?.note ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1.5 p-2 rounded-xl hover:bg-rose-50 transition cursor-pointer"
              >
                <Trash2 size={15} />
                <span>{t.common.delete}</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Check size={16} strokeWidth={3} />
              <span>{t.common.save}</span>
            </button>
          </div>
        </form>
      </main>

      {/* Routine Memo Safe Delete Dialog */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t.confirm?.deleteMemoTitle || (language === 'en' ? 'Delete this note?' : language === 'ja' ? 'メモを削除しますか？' : '메모를 삭제할까요?')}
        message={t.confirm?.deleteMemoMessage || (language === 'en' ? 'The habit reflection note will be deleted.' : language === 'ja' ? '作成した習慣メモが削除されます。' : '작성한 습관 메모가 삭제됩니다.')}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDeleteMemo(routine.id);
          setShowDeleteConfirm(false);
          onClose();
        }}
      />
    </div>
  );
};
