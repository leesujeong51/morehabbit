import React, { useState, useEffect } from 'react';
import type { Routine, RoutineLog } from '../../types/routine';
import { Modal } from '../common/Modal';

import { Check, Trash2, MessageSquare } from 'lucide-react';

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
  const [note, setNote] = useState('');

  useEffect(() => {
    setNote(log?.note || '');
  }, [log, isOpen]);

  if (!routine) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMemo(routine.id, note.trim());
    onClose();
  };

  const handleDelete = () => {
    onDeleteMemo(routine.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="루틴 실천 메모">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Routine brief info */}
        <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
          <span className="text-2xl">{routine.emoji}</span>
          <div>
            <h4 className="text-sm font-bold text-neutral-800">{routine.title}</h4>
            <p className="text-xs text-neutral-400">{dateKey} 실천 기록</p>
          </div>
        </div>

        {/* Note textarea */}
        <div>
          <label className="block text-xs font-bold text-neutral-600 mb-1.5 flex items-center gap-1.5">
            <MessageSquare size={13} className="text-emerald-600" />
            <span>오늘의 한 줄 감상 및 메모</span>
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 오늘은 5km 달림! 날씨가 시원해서 상쾌했다."
            className="w-full p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-neutral-800 placeholder-neutral-400"
            autoFocus
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
          {log?.note ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 p-1.5 rounded-lg hover:bg-rose-50 transition"
            >
              <Trash2 size={13} />
              <span>메모 삭제</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
            >
              닫기
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1"
            >
              <Check size={14} />
              <span>메모 저장</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
