import React from 'react';
import type { Routine } from '../../types/routine';
import { Check, X } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

interface ReminderNotificationModalProps {
  routine: Routine | null;
  onClose: () => void;
  onComplete: (routineId: string) => void;
}

export const ReminderNotificationModal: React.FC<ReminderNotificationModalProps> = ({
  routine,
  onClose,
  onComplete,
}) => {
  const { language } = useLanguage();
  if (!routine) return null;

  return (
    /* Top In-App Alert Notification (User Request 2: 루틴 이름 + 할 시간 안내 문구) */
    <div className="fixed top-4 left-4 right-4 z-[9990] max-w-md mx-auto animate-bounce-short">
      <div className="bg-white/95 backdrop-blur-xl border-2 border-primary shadow-[0_12px_36px_-4px_rgba(29,78,216,0.35)] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <span className="text-lg">{routine.emoji || '⏰'}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-blue-700 uppercase tracking-wider">
                {language === 'en' ? 'Habit Reminder ⏰ ' : language === 'ja' ? '習慣リマインダー ⏰ ' : '습관 알림 ⏰ '}
                {routine.reminderTime || (language === 'en' ? 'Now' : language === 'ja' ? '今' : '지금')}
              </span>
              <h3 className="text-base font-black text-slate-900 leading-snug break-keep">
                {language === 'en'
                  ? `Time for "${routine.title}".`
                  : language === 'ja'
                  ? `「${routine.title}」の時間です。`
                  : `"${routine.title}"을(를) 할 시간이에요.`}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
            aria-label={language === 'en' ? 'Close reminder' : language === 'ja' ? '通知を閉じる' : '알림 닫기'}
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-700 font-semibold leading-relaxed break-keep pl-1">
          {language === 'en'
            ? 'Shall we complete it right now? ✨'
            : language === 'ja'
            ? '今すぐ実践してチェックしてみましょう！✨'
            : '지금 바로 실천하고 체크해볼까요? ✨'}
        </p>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
          >
            {language === 'en' ? 'Later' : language === 'ja' ? '後で' : '나중에'}
          </button>
          <button
            onClick={() => {
              onComplete(routine.id);
              onClose();
            }}
            className="flex-1 h-10 bg-primary hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check size={16} strokeWidth={3} />
            <span>{language === 'en' ? 'Check Now' : language === 'ja' ? '今すぐチェック' : '지금 바로 체크하기'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
