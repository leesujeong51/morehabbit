import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { MOBIT_IMAGES } from './mobitImages';
import { useLanguage } from '../../utils/i18n';
import type { RoutineLog } from '../../types/routine';
import { getWeekDates, isDateToday } from '../../utils/dateUtils';

export type MobitMood =
  | 'default'
  | 'victory'
  | 'joy'
  | 'cheer'
  | 'encourage'
  | 'excited'
  | 'success'
  | 'rest'
  | 'thinking'
  | 'sad'
  | 'comfort'
  | 'surprised'
  | 'focus'
  | 'pomodoro'
  | 'water'
  | 'exercise'
  | 'reading'
  | 'sleep'
  | 'medicine'
  | 'walking'
  | 'goal'
  | 'streak'
  | 'done'
  | 'memo'
  | 'heart'
  | 'slogan'
  | 'app_icon'
  | 'happy'
  | 'proud'
  | 'challenge'
  | 'wink'
  | 'icon'
  | 'icon_face'
  | 'card_done'
  | 'card_cheer';

interface MobitCharacterProps {
  mood?: MobitMood | string;
  className?: string;
  size?: number;
  alt?: string;
}

/**
 * MoreHabit 공식 파란 거북이 캐릭터 모빗 (Mobit)
 * 사용자가 직접 업로드한 원본 3D 그래픽 이미지 에셋을 그대로 렌더링
 * 모토: "천천히, 하지만 확실하게 매일 조금씩, 더 나은 나로!"
 */
export const MobitCharacter: React.FC<MobitCharacterProps> = ({
  mood = 'default',
  className = 'w-24 h-24',
  size,
  alt = '파란 거북이 모빗',
}) => {
  const src: string =
    (MOBIT_IMAGES as Record<string, string>)[mood] ||
    MOBIT_IMAGES.default ||
    MOBIT_IMAGES.happy;

  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none drop-shadow-xs transition-transform duration-200 inline-block ${className}`}
      style={style}
      loading="eager"
      draggable={false}
    />
  );
};

// Aliases for 100% backwards compatibility
export const MobitTurtle = MobitCharacter;
export const MobitKoala = MobitCharacter;

// 1. Pomodoro Session Completion Modal (25분 집중 완주 칭찬)
interface MobitPraiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBreak: () => void;
  completedCycle: number;
  isLongBreakNext: boolean;
}

export const MobitPraiseModal: React.FC<MobitPraiseModalProps> = ({
  isOpen,
  onClose,
  onStartBreak,
  completedCycle,
  isLongBreakNext,
}) => {
  const { language } = useLanguage();

  const titleText =
    language === 'en'
      ? '25-Min Focus Completed! 🎉'
      : language === 'ja'
      ? '25分集中達成！🎉'
      : '25분 집중 완주 칭찬 🎉';

  const badgeText =
    language === 'en'
      ? 'MoreHabit Turtle Mobit 🐢'
      : language === 'ja'
      ? 'モアハビット カメのモビット 🐢'
      : '모어해빗 거북이 모빗 (Mobit) 🐢';

  const cheerTitle =
    language === 'en'
      ? 'Mobit cheers for you! 🐢💙'
      : language === 'ja'
      ? 'モビットが応援します！ 🐢💙'
      : '모빗이가 힘차게 응원해요! 🐢💙';

  const cheerDesc =
    language === 'en' ? (
      <>
        Slowly, but surely! You completed <strong className="text-primary font-black">Pomodoro Session #{completedCycle}</strong> with unbroken focus!
      </>
    ) : language === 'ja' ? (
      <>
        ゆっくり、でも確実に！ <strong className="text-primary font-black">{completedCycle}回目のポモドーロセッション</strong>を集中して完走しました！
      </>
    ) : (
      <>
        천천히, 하지만 확실하게! <strong className="text-primary font-black">{completedCycle}번째 뽀모도로 세션</strong>을 한 번의 흐트러짐 없이 완벽하게 마쳤어요!
      </>
    );

  const rewardLabel = language === 'en' ? 'Growth Reward' : language === 'ja' ? '成長報酬' : '성장 보상';
  const rewardXp = language === 'en' ? '+50 XP Gained' : language === 'ja' ? '+50 XP 獲得' : '+50 XP 획득';
  const cycleLabel = language === 'en' ? 'Cycle' : language === 'ja' ? 'サイクル' : '사이클 달성';
  const cycleVal = language === 'en' ? `${completedCycle}/4 Done` : language === 'ja' ? `${completedCycle}/4 完了` : `${completedCycle}/4 완료`;

  const breakBtnLabel = isLongBreakNext
    ? language === 'en'
      ? 'Start 15m Long Break 🌿'
      : language === 'ja'
      ? '15分長い休憩を開始 🌿'
      : '15분 긴 휴식 시작 🌿'
    : language === 'en'
    ? 'Start 5m Break ☕'
    : language === 'ja'
    ? '5分休憩を開始 ☕'
    : '5분 휴식 시작 ☕';

  const doneBtnLabel = language === 'en' ? 'Done' : language === 'ja' ? '記録完了' : '기록 완료';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleText}>
      <div className="flex flex-col items-center text-center p-2">
        <div className="relative mb-2 flex items-center justify-center animate-bounce" style={{ animationDuration: '2.5s' }}>
          <MobitCharacter mood="success" className="w-36 h-36" />
          <div className="absolute -bottom-1 px-3 py-0.5 rounded-full bg-primary text-white text-xs font-black shadow-xs">
            {badgeText}
          </div>
        </div>

        <h3 className="text-lg font-black text-[#0f2e7a] tracking-tight leading-snug mt-2">
          {cheerTitle}
        </h3>
        <p className="text-sm text-on-surface font-semibold mt-1">
          {cheerDesc}
        </p>

        {/* Reward Chips */}
        <div className="flex items-center gap-2 mt-4 w-full">
          <div className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center gap-2">
            <span className="text-base">⚡</span>
            <div className="text-left">
              <span className="text-xs text-tertiary font-bold block leading-none">{rewardLabel}</span>
              <span className="text-sm font-black text-primary leading-tight">{rewardXp}</span>
            </div>
          </div>

          <div className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-center gap-2">
            <span className="text-base">🍅</span>
            <div className="text-left">
              <span className="text-xs text-blue-700 font-bold block leading-none">{cycleLabel}</span>
              <span className="text-sm font-black text-blue-800 leading-tight">
                {cycleVal}
              </span>
            </div>
          </div>
        </div>

        {/* Rest Recommendation */}
        <div className="w-full mt-4 p-3 rounded-xl bg-surface-container-low text-left border border-surface-container/60">
          <p className="text-xs text-on-surface leading-relaxed">
            {isLongBreakNext ? (
              <span>
                🎉 <strong>{language === 'en' ? 'Completed all 4 sessions!' : language === 'ja' ? '4セッションをすべて完走しました！' : '4세션을 모두 완주하셨습니다!'}</strong>{' '}
                {language === 'en'
                  ? 'Take a relaxing 15-minute break to refresh your mind.'
                  : language === 'ja'
                  ? '脳をリフレッシュするために15分間の長い休憩を楽しみましょう。'
                  : '지친 뇌의 회복을 위해 15분간의 긴 휴식을 만끽해 보세요.'}
              </span>
            ) : (
              <span>
                ☕{' '}
                {language === 'en'
                  ? 'Stretch, drink a glass of water, and take a quick 5-minute break.'
                  : language === 'ja'
                  ? '背伸びをして水を飲み、5分間軽く一息つきましょう。'
                  : '기지개를 켜며 물 한 잔 마시고, 5분간 가볍게 쉬어 갈까요?'}
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-xs font-bold transition cursor-pointer"
          >
            {doneBtnLabel}
          </button>
          <button
            onClick={onStartBreak}
            className="flex-1 py-3 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-black transition shadow-md shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{breakBtnLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

// 2. All Routines Completed View (Full page celebration view, not a popup)
interface MobitAllDoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  streakCount?: number;
  logs?: RoutineLog[];
  completedCount?: number;
  totalRoutines?: number;
  totalXp?: number;
}

export const MobitAllDoneModal: React.FC<MobitAllDoneModalProps> = ({
  isOpen,
  onClose,
  streakCount = 1,
  logs = [],
}) => {
  const { language } = useLanguage();

  // Trigger soft celebratory fireworks/confetti flutter when opened
  useEffect(() => {
    if (!isOpen) return;

    try {
      // 1st soft shower from upper center
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.2 },
        gravity: 0.75,
        ticks: 200,
        scalar: 0.85,
        colors: ['#2563eb', '#38bdf8', '#fbbf24', '#f43f5e', '#10b981', '#818cf8'],
        disableForReducedMotion: true,
      });

      // 2nd gentle flutter wave
      const timer = setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 85,
          origin: { y: 0.28 },
          gravity: 0.65,
          ticks: 220,
          scalar: 0.75,
          colors: ['#3b82f6', '#60a5fa', '#f59e0b', '#34d399', '#ec4899'],
          disableForReducedMotion: true,
        });
      }, 350);

      return () => clearTimeout(timer);
    } catch {
      // fallback if canvas-confetti is not available
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Streak headline
  const streakTitle =
    language === 'en'
      ? `${streakCount} Days Streak! 🔥`
      : language === 'ja'
      ? `${streakCount}日連続達成！🔥`
      : `${streakCount}일 연속 성공! 🔥`;

  // Mon-Sun Weekday Names
  const weekDaysLabels =
    language === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : language === 'ja'
      ? ['月', '火', '水', '木', '金', '土', '日']
      : ['월', '화', '수', '목', '금', '토', '일'];

  // Current week dates (Monday through Sunday)
  const currentWeekDates = getWeekDates(new Date());

  const weekData = currentWeekDates.map((item, idx) => {
    const isToday = isDateToday(item.key);
    // Checked if today (as today's all habits are cleared) or has completed logs
    const isDone = isToday || logs.some((l) => l.date === item.key && l.completed);
    return {
      dayName: weekDaysLabels[idx] || item.day,
      isToday,
      isDone,
    };
  });

  // Short inspiring quote (2-line formatted like Image 2)
  const quoteLine1 =
    language === 'en'
      ? 'Slowly, but surely.'
      : language === 'ja'
      ? 'ゆっくり、でも確実に。'
      : '천천히, 하지만 확실하게.';

  const quoteLine2 =
    language === 'en'
      ? 'You did an amazing job today! 👍💙'
      : language === 'ja'
      ? '今日も見事にやり遂げました！👍💙'
      : '오늘도 멋지게 해냈어요! 👍💙';

  // Back button label (User Image 2)
  const backLabel =
    language === 'en' ? 'Back' : language === 'ja' ? '戻る' : '이전';

  // Close Button label (User Image 2: 확인)
  const closeBtnText =
    language === 'en' ? 'Confirm' : language === 'ja' ? '確認' : '확인';

  return (
    <div className="fixed inset-0 z-[100] w-screen h-[100dvh] bg-white select-none animate-fadeIn flex flex-col justify-between overflow-y-auto">
      <div className="w-full max-w-sm sm:max-w-md min-h-full flex flex-col justify-between p-5 xs:p-6 mx-auto relative z-20">
        {/* Top Navigation Bar: Back button (User Image 2) */}
        <div className="w-full flex items-center justify-between shrink-0 h-9">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-extrabold text-sm -ml-2 py-1 px-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition cursor-pointer"
            aria-label={backLabel}
          >
            <span className="material-symbols-outlined text-[22px] font-bold">arrow_back</span>
            <span>{backLabel}</span>
          </button>
        </div>

        {/* Center Group: Character + Headline + Card (모바일 기종 관계없이 가운데 배치) */}
        <div className="my-auto flex flex-col items-center justify-center text-center w-full py-2 shrink-0">
          {/* 5th Mascot image: Star flag turtle on rock (확대X, 원본 비율 사용) */}
          <div className="relative mb-2 flex items-center justify-center shrink-0">
            <img
              src={(MOBIT_IMAGES as Record<string, string>).victory || (MOBIT_IMAGES as Record<string, string>).done}
              alt="성공 모빗"
              className="w-36 h-36 xs:w-40 xs:h-40 sm:w-44 sm:h-44 max-h-[175px] max-w-[175px] object-contain select-none drop-shadow-sm mx-auto"
              draggable={false}
            />
          </div>

          {/* Headline: "x일 연속 성공! 🔥" (두번째 이미지처럼 크고 가독성 좋게) */}
          <h2 className="text-xl xs:text-xl sm:text-xl font-black text-slate-900 tracking-tight leading-tight mt-1 mb-4 shrink-0 break-keep">
            {streakTitle}
          </h2>

          {/* 2nd Image Reference Style Card: Week Grid + Divider + Quote */}
          <div className="w-full p-4.5 xs:p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] shrink-0">
            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-1.5 xs:gap-2">
              {weekData.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className={`text-xs xs:text-sm font-black ${item.isDone ? 'text-primary' : 'text-slate-400'}`}>
                    {item.dayName}
                  </span>
                  <div
                    className={`w-9 h-9 xs:w-10 xs:h-10 rounded-full flex items-center justify-center transition-all ${
                      item.isDone
                        ? 'bg-primary text-white shadow-xs font-black ring-2 ring-blue-100'
                        : item.isToday
                        ? 'border-2 border-primary/40 text-slate-300 bg-blue-50/40'
                        : 'bg-slate-100 text-slate-300'
                    }`}
                  >
                    {item.isDone ? (
                      <span className="material-symbols-outlined text-[20px] font-black">check</span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider Line */}
            <hr className="border-slate-100 my-4" />

            {/* Inspiring Quote (두번째 이미지처럼 시원하고 가독성 좋은 2줄 문구) */}
            <p className="text-sm xs:text-base font-bold text-slate-700 leading-relaxed text-center break-keep px-1">
              {quoteLine1}
              <br />
              {quoteLine2}
            </p>
          </div>
        </div>

        {/* Bottom Button (크고 시원하게 키움) */}
        <div className="w-full pt-3 pb-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-14 xs:h-15 rounded-full bg-primary hover:bg-blue-700 active:scale-[0.98] text-white text-base xs:text-base font-black shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center"
          >
            {closeBtnText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Encouragement / Comfort Modal (미완료 시 부드러운 위로 & 격려)
interface MobitRegretModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const MobitRegretModal: React.FC<MobitRegretModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  const { language } = useLanguage();

  const titleText =
    language === 'en'
      ? "Mobit's Warm Support 🐢"
      : language === 'ja'
      ? 'モビットの温かい応援 🐢'
      : '모빗이의 따뜻한 위로 🐢';

  const headingText =
    language === 'en'
      ? "It's okay, you can start again 💙"
      : language === 'ja'
      ? '大丈夫、また始めればいいんです 💙'
      : '괜찮아요, 다시 시작하면 돼요 💙';

  const defaultMsg =
    language === 'en'
      ? "It's completely fine even if you didn't finish today. Just take a small step tomorrow."
      : language === 'ja'
      ? '今日すべて終えられなくても大丈夫です。小さな一歩からまた始めましょう。'
      : '오늘 다하지 못했어도 괜찮아요. 작은 한 걸음부터 다시 시작하면 됩니다.';

  const quoteText =
    language === 'en'
      ? '🐢 Mobit: "Habits are not about perfection, but the gentle persistence of returning. Shall we continue slowly?"'
      : language === 'ja'
      ? '🐢 モビットの一言: 「習慣とは完璧さではなく、立ち止まっても戻ってくる粘り強さです。ゆっくり再開しましょう。」'
      : '🐢 모빗이의 한마디: "습관은 완벽함이 아니라, 멈추더라도 다시 돌아오는 꾸준함입니다. 천천히 다시 가볼까요?"';

  const btnText =
    language === 'en'
      ? 'Start Fresh with Peace of Mind'
      : language === 'ja'
      ? '気楽に再スタート'
      : '마음 편하게 다시 시작하기';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleText}>
      <div className="flex flex-col items-center text-center p-2">
        <div className="relative mb-2 flex items-center justify-center">
          <MobitCharacter mood="comfort" className="w-32 h-32" />
        </div>

        <h3 className="text-base font-black text-on-surface tracking-tight mt-1">
          {headingText}
        </h3>
        <p className="text-xs text-tertiary mt-2 leading-relaxed px-2">
          {message || defaultMsg}
        </p>

        <div className="w-full mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 text-left">
          <p className="text-xs text-blue-950 font-bold leading-relaxed">
            {quoteText}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-black mt-5 shadow-xs active:scale-95 transition cursor-pointer"
        >
          {btnText}
        </button>
      </div>
    </Modal>
  );
};
