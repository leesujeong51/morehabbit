import React from 'react';
import { MobitCharacter } from '../character/MobitCharacter';
import { useLanguage } from '../../utils/i18n';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const displayTitle = title ?? t.confirm?.deleteHabitTitle ?? '습관을 삭제할까요?';
  const displayMessage = message ?? t.confirm?.deleteHabitMessage ?? '이 습관의 기록도 함께 삭제될 수 있습니다.';
  const displayConfirmLabel = confirmLabel ?? (isDestructive ? (t.common?.delete || '삭제') : (t.common?.confirm || '확인'));
  const displayCancelLabel = cancelLabel ?? t.common?.cancel ?? '취소';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog Box */}
      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl transition-all border border-slate-100 p-6 flex flex-col items-center text-center animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Blue Turtle Mascot */}
        <div className="mb-3 flex items-center justify-center">
          <MobitCharacter mood="comfort" className="w-20 h-20" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1.5">
          {displayTitle}
        </h3>

        {/* Optional Item Name Tag */}
        {itemName && (
          <div className="inline-block max-w-[90%] truncate px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2">
            '{itemName}'
          </div>
        )}

        {/* Message */}
        <p className="text-sm text-slate-600 font-medium break-keep leading-relaxed mb-6">
          {displayMessage}
        </p>

        {/* Action Buttons: [취소] / [삭제] */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition active:scale-95 cursor-pointer"
          >
            {displayCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`py-3 px-4 rounded-xl text-white text-sm font-black transition active:scale-95 cursor-pointer shadow-sm ${
              isDestructive
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-primary hover:bg-blue-700'
            }`}
          >
            {displayConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
