import React from 'react';
import { getWeekDates, toDateKey } from '../../utils/dateUtils';
import type { RoutineLog } from '../../types/routine';
import { useLanguage, getDayNamesForLanguage } from '../../utils/i18n';
import { MobitCharacter } from '../character/MobitCharacter';

interface StreakRulePageProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
  logs: RoutineLog[];
}

export const StreakRulePage: React.FC<StreakRulePageProps> = ({
  isOpen,
  onClose,
  streakCount,
  logs,
}) => {
  const { language, t } = useLanguage();
  if (!isOpen) return null;

  // Calculate current week days (Monday to Sunday)
  const currentWeek = getWeekDates(new Date());
  const dayNames = getDayNamesForLanguage(language);
  // Monday start: 1, 2, 3, 4, 5, 6, 0
  const dayLabels = [
    dayNames[1],
    dayNames[2],
    dayNames[3],
    dayNames[4],
    dayNames[5],
    dayNames[6],
    dayNames[0],
  ];

  const todayKey = toDateKey(new Date());

  return (
    /* Full-Page Native View UI (User Request 1: 팝업X 풀페이지 형태, 코알라+앱 색상 통일, 큰 글씨, 불꽃 규칙) */
    <div className="fixed inset-0 z-50 bg-[#f4f7fc] flex flex-col overflow-y-auto select-none animate-fadeIn">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-4 py-3.5 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition font-bold text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            <span>{t.common.back}</span>
          </button>
          <h2 className="text-base font-black text-[#0f2e7a]">
            {t.today.flameRuleTitle}
          </h2>
          <div className="w-16"></div> {/* Balance spacer */}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 py-6 flex flex-col items-center gap-4 text-center">
        {/* Blue Turtle Mascot with Flame Aura (원형 소프트 배지 + 원본 비율 유지) */}
        <div className="relative my-1 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-blue-50 to-blue-100/70 border border-blue-200/60 flex items-center justify-center shadow-xs relative">
            <MobitCharacter mood="streak" className="h-20 w-auto object-contain" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm shadow-md border-2 border-white">
              🔥
            </div>
          </div>
        </div>

        {/* Streak Counter Heading */}
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black tracking-wide inline-block mb-1.5">
            {streakCount > 0 ? `${streakCount} DAYS STREAK` : 'START TODAY'}
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
            {streakCount > 0 ? (
              <>
                <span className="text-primary font-black">
                  {streakCount}{language === 'en' ? ' DAYS' : language === 'ja' ? '日' : '일'}
                </span>{' '}
                {language === 'en' ? 'STREAK! 🔥' : language === 'ja' ? '連続維持中！🔥' : '연속 불꽃 유지 중! 🔥'}
              </>
            ) : (
              language === 'en' ? 'Start your streak today! 🔥' : language === 'ja' ? '今日最初の炎を灯しましょう！🔥' : '오늘 첫 불꽃을 밝혀보세요! 🔥'
            )}
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium break-keep">
            {language === 'en'
              ? 'Complete just 1 habit daily to keep your flame glowing.'
              : language === 'ja'
              ? '毎日1つの習慣を完了して炎を繋ぎましょう。'
              : '매일 습관 하나로 불꽃을 이어가 보세요.'}
          </p>
        </div>

        {/* Core Rule Card (불꽃 유지 규칙 안내 - 중복 제거 및 최소화) */}
        <div className="w-full bg-white rounded-3xl p-5 border border-blue-100/90 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.08)] flex flex-col gap-3 text-left">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-base shrink-0">
              🔥
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                {t.today.flameRuleTitle}
              </h3>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-2.5">
            <span className="text-lg shrink-0">💡</span>
            <p className="text-sm text-blue-950 font-bold leading-relaxed break-keep">
              {language === 'en' ? (
                <>
                  Completing <span className="text-blue-700 underline underline-offset-2">just 1 habit a day</span> keeps your streak alive!
                </>
              ) : language === 'ja' ? (
                <>
                  1日<span className="text-blue-700 underline underline-offset-2">1つの習慣を完了</span>するだけで炎が維持されます！
                </>
              ) : (
                <>
                  하루에 습관을 <span className="text-blue-700 underline underline-offset-2">1개만 완료</span>해도 불꽃이 꺼지지 않아요!
                </>
              )}
            </p>
          </div>

          <ul className="text-xs text-slate-600 leading-relaxed space-y-1.5 pl-1 break-keep">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
              <span>
                {language === 'en'
                  ? 'Check off at least 1 habit before midnight.'
                  : language === 'ja'
                  ? '深夜0時前に最低1つの習慣をチェックしてください。'
                  : '자정이 지나기 전에 최소 1개의 습관을 실천해 주세요.'}
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
              <span>
                {language === 'en'
                  ? 'Small actions like drinking water or stretching are enough.'
                  : language === 'ja'
                  ? 'コップ1杯の水や軽いストレッチでも十分です。'
                  : '물 한 잔, 10초 스트레칭 등 가벼운 실천 하나면 충분합니다.'}
              </span>
            </li>
          </ul>
        </div>

        {/* Weekly Flame Progress Strip (Mon ~ Sun) */}
        <div className="w-full bg-white rounded-3xl p-5 border border-blue-100/90 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.08)] flex flex-col gap-3">
          <div className="flex items-center justify-between text-left">
            <h4 className="text-sm font-black text-slate-900">
              {language === 'en' ? 'This Week Flame Records' : language === 'ja' ? '今週の炎の記録' : '이번 주 불꽃 기록'}
            </h4>
            <span className="text-xs text-slate-500 font-bold">
              {language === 'en' ? 'Mon ~ Sun' : language === 'ja' ? '月曜日 ~ 日曜日' : '월요일 ~ 일요일'}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {currentWeek.map((item, idx) => {
              const isItemDone = logs.some((l) => l.date === item.key && l.completed);
              const isToday = item.key === todayKey;

              return (
                <div
                  key={item.key}
                  className={`flex flex-col items-center py-2.5 rounded-2xl transition-all ${
                    isToday
                      ? 'bg-blue-50/80 ring-2 ring-primary ring-offset-1'
                      : isItemDone
                      ? 'bg-slate-50'
                      : 'bg-slate-50/60'
                  }`}
                >
                  <span
                    className={`text-xs font-black mb-1.5 ${
                      isToday
                        ? 'text-primary font-black'
                        : isItemDone
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {dayLabels[idx]}
                  </span>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isItemDone
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-200/80 text-slate-400'
                    }`}
                  >
                    {isItemDone ? (
                      <span className="text-base leading-none select-none">🔥</span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-600 font-medium break-keep">
              {t.today.flameRuleTip}
            </p>
          </div>
        </div>

        {/* Bottom CTA Button */}
        <div className="w-full pt-3 pb-6">
          <button
            onClick={onClose}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-blue-700 text-white font-extrabold text-base shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{t.today.flameCheckToday}</span>
          </button>
        </div>
      </main>
    </div>
  );
};
