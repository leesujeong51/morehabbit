import React from 'react';
import { Modal } from '../common/Modal';

export type MobitMood = 'cheer' | 'proud' | 'sad' | 'happy' | 'wink';

interface MobitKoalaProps {
  mood?: MobitMood;
  className?: string;
  size?: number;
}

export const MobitKoala: React.FC<MobitKoalaProps> = ({
  mood = 'happy',
  className = 'w-32 h-32',
}) => {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none`}
    >
      {/* Background Soft Aura */}
      <circle cx="80" cy="82" r="64" fill="#e0e7ff" opacity="0.6" />
      <circle cx="80" cy="82" r="50" fill="#dbeafe" opacity="0.8" />

      {/* Confetti & Stars for 'cheer' and 'proud' */}
      {(mood === 'cheer' || mood === 'proud') && (
        <>
          <path d="M26 36L29 43L36 45L29 47L26 54L23 47L16 45L23 43L26 36Z" fill="#fbbf24" />
          <path d="M134 32L136 37L141 39L136 41L134 46L132 41L127 39L132 37L134 32Z" fill="#fbbf24" />
          <path d="M138 92L140 96L144 98L140 100L138 104L136 100L132 98L136 96L138 92Z" fill="#3b82f6" />
          <path d="M24 100L26 103L29 105L26 107L24 110L22 107L19 105L22 103L24 100Z" fill="#ec4899" />
          {/* Confetti ribbons */}
          <rect x="34" y="24" width="8" height="4" rx="2" fill="#ec4899" transform="rotate(25 34 24)" />
          <rect x="118" y="22" width="8" height="4" rx="2" fill="#10b981" transform="rotate(-30 118 22)" />
        </>
      )}

      {/* Sweat drop for 'sad' */}
      {mood === 'sad' && (
        <path
          d="M122 55C122 55 128 62 128 66C128 69 125.5 71 122 71C118.5 71 116 69 116 66C116 62 122 55 122 55Z"
          fill="#60a5fa"
        />
      )}

      {/* --- KOALA EARS --- */}
      {/* Left Big Koala Ear */}
      <circle cx="40" cy="54" r="26" fill="#8ca0ba" stroke="#1e293b" strokeWidth="3" />
      <circle cx="41" cy="54" r="17" fill="#fbcfe8" />
      {/* White ear fluff */}
      <path d="M35 50C38 52 40 56 37 60C41 59 44 55 43 51" fill="#ffffff" opacity="0.8" />

      {/* Right Big Koala Ear */}
      <circle cx="120" cy="54" r="26" fill="#8ca0ba" stroke="#1e293b" strokeWidth="3" />
      <circle cx="119" cy="54" r="17" fill="#fbcfe8" />
      {/* White ear fluff */}
      <path d="M125 50C122 52 120 56 123 60C119 59 116 55 117 51" fill="#ffffff" opacity="0.8" />

      {/* --- KOALA HEAD --- */}
      <ellipse cx="80" cy="80" rx="42" ry="38" fill="#8ca0ba" stroke="#1e293b" strokeWidth="3" />

      {/* Chubby Cheeks Highlight */}
      <ellipse cx="54" cy="92" rx="6.5" ry="4.5" fill="#fca5a5" opacity="0.8" />
      <ellipse cx="106" cy="92" rx="6.5" ry="4.5" fill="#fca5a5" opacity="0.8" />

      {/* --- EYES --- */}
      {mood === 'cheer' || mood === 'proud' ? (
        // Joyful smiling eyes ^ ^
        <>
          <path
            d="M58 76C61 71 67 71 70 76"
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M90 76C93 71 99 71 102 76"
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </>
      ) : mood === 'wink' ? (
        // One wink, one open
        <>
          <path d="M58 76C61 72 67 72 70 76" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="96" cy="74" r="4.5" fill="#0f172a" />
          <circle cx="94.5" cy="72.5" r="1.5" fill="#ffffff" />
        </>
      ) : mood === 'sad' ? (
        // Worried droopy eyes
        <>
          <path d="M58 74C62 76 68 76 71 73" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="64" cy="77" r="3.5" fill="#0f172a" />
          <path d="M89 73C92 76 98 76 102 74" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="96" cy="77" r="3.5" fill="#0f172a" />
        </>
      ) : (
        // Default happy round sparkling eyes
        <>
          <circle cx="64" cy="74" r="4.5" fill="#0f172a" />
          <circle cx="62.5" cy="72.5" r="1.5" fill="#ffffff" />
          <circle cx="96" cy="74" r="4.5" fill="#0f172a" />
          <circle cx="94.5" cy="72.5" r="1.5" fill="#ffffff" />
        </>
      )}

      {/* --- ICONIC BIG OVAL KOALA NOSE --- */}
      <ellipse cx="80" cy="85" rx="9" ry="13.5" fill="#1e293b" />
      {/* Nose reflection shine */}
      <ellipse cx="77.5" cy="80.5" rx="3" ry="4.5" fill="#475569" opacity="0.6" />

      {/* Small Happy Mouth under the big nose */}
      {mood === 'sad' ? (
        <path d="M76 102C78 100 82 100 84 102" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <path d="M75 101C78 104 82 104 85 101" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      )}

      {/* --- KOALA BODY & SCARF --- */}
      {/* Body */}
      <path
        d="M52 110C50 125 54 140 80 140C106 140 110 125 108 110"
        fill="#8ca0ba"
        stroke="#1e293b"
        strokeWidth="3"
      />
      {/* Light belly patch */}
      <ellipse cx="80" cy="126" rx="16" ry="12" fill="#f1f5f9" />

      {/* Royal Blue Neck Scarf / Bandana with mh Mark */}
      <path
        d="M50 108C60 113 100 113 110 108C112 115 105 119 80 120C55 119 48 115 50 108Z"
        fill="#1d4ed8"
        stroke="#1e293b"
        strokeWidth="2"
      />
      {/* Scarf tie knot & logo */}
      <circle cx="80" cy="118" r="4.5" fill="#3b82f6" />
      <circle cx="80" cy="118" r="2.5" fill="#ffffff" />

      {/* --- ARMS / HANDS --- */}
      {mood === 'cheer' ? (
        // Both hands raised high in triumph!
        <>
          <path
            d="M48 112C38 102 32 88 38 82C44 76 52 90 54 98"
            fill="#8ca0ba"
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M112 112C122 102 128 88 122 82C116 76 108 90 106 98"
            fill="#8ca0ba"
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : mood === 'proud' ? (
        // Holding golden star or trophy
        <>
          <path
            d="M52 114C45 108 55 98 62 106"
            fill="#8ca0ba"
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M108 114C115 108 105 98 98 106"
            fill="#8ca0ba"
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Golden Trophy in hands */}
          <path
            d="M74 102H86V109C86 112 83.5 114 80 114C76.5 114 74 112 74 109V102Z"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="1.5"
          />
          <path d="M78 114H82V119H78V114Z" fill="#d97706" />
          <path d="M74 119H86V121H74V119Z" fill="#d97706" />
          <path d="M72 104C70 104 69 107 72 109" stroke="#d97706" strokeWidth="1.5" />
          <path d="M88 104C90 104 91 107 88 109" stroke="#d97706" strokeWidth="1.5" />
        </>
      ) : (
        // Resting cute paws on tummy
        <>
          <ellipse cx="62" cy="116" rx="5.5" ry="4" fill="#8ca0ba" stroke="#1e293b" strokeWidth="2" />
          <ellipse cx="98" cy="116" rx="5.5" ry="4" fill="#8ca0ba" stroke="#1e293b" strokeWidth="2" />
        </>
      )}
    </svg>
  );
};

// 1. Pomodoro Session Completion Modal (칭찬)
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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="25분 집중 완주 칭찬 🎉">
      <div className="flex flex-col items-center text-center p-2">
        <div className="relative mb-2 flex items-center justify-center animate-bounce" style={{ animationDuration: '2.5s' }}>
          <MobitKoala mood="cheer" className="w-36 h-36" />
          <div className="absolute -bottom-1 px-3 py-0.5 rounded-full bg-primary text-white text-[11px] font-black shadow-xs">
            모어해빗의 코알라 모빗 (Mobit)
          </div>
        </div>

        <h3 className="text-[20px] font-black text-[#0f2e7a] tracking-tight leading-snug mt-2">
          모빗이가 격하게 칭찬해요! 🐨💙
        </h3>
        <p className="text-[14px] text-on-surface font-semibold mt-1">
          <strong className="text-primary font-black">{completedCycle}번째 뽀모도로 세션</strong>을
          한 번의 흐트러짐 없이 완벽하게 마쳤어요!
        </p>

        {/* Reward Chips */}
        <div className="flex items-center gap-2 mt-4 w-full">
          <div className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center gap-2">
            <span className="text-lg">⚡</span>
            <div className="text-left">
              <span className="text-[10px] text-tertiary font-bold block leading-none">성장 보상</span>
              <span className="text-[14px] font-black text-primary leading-tight">+50 XP 획득</span>
            </div>
          </div>

          <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-2">
            <span className="text-lg">🍅</span>
            <div className="text-left">
              <span className="text-[10px] text-emerald-600 font-bold block leading-none">사이클 달성</span>
              <span className="text-[14px] font-black text-emerald-700 leading-tight">
                {completedCycle}/4 완료
              </span>
            </div>
          </div>
        </div>

        {/* Rest Recommendation */}
        <div className="w-full mt-4 p-3 rounded-xl bg-surface-container-low text-left border border-surface-container/60">
          <p className="text-[13px] text-on-surface leading-relaxed">
            {isLongBreakNext ? (
              <span>
                🎉 <strong>4세션을 모두 완주하셨습니다!</strong> 지친 뇌의 회복을 위해{' '}
                <strong className="text-primary">15분간의 긴 휴식</strong>을 만끽해 보세요.
              </span>
            ) : (
              <span>
                ☕ 기지개를 켜며 물 한 잔 마시고,{' '}
                <strong className="text-primary">5분간 가볍게 쉬어</strong> 갈까요?
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-[13px] font-bold transition"
          >
            기록 완료
          </button>
          <button
            onClick={onStartBreak}
            className="flex-1 py-3 rounded-xl bg-primary hover:bg-blue-700 text-white text-[13px] font-black transition shadow-md shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>{isLongBreakNext ? '15분 긴 휴식 시작 🌿' : '5분 휴식 시작 ☕'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

// 2. All Routines Completed Modal (오늘 습관 모두 다했을 때 특급 칭찬)
interface MobitAllDoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalRoutines?: number;
}

export const MobitAllDoneModal: React.FC<MobitAllDoneModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="flex flex-col items-center text-center p-3 pt-1">
        {/* Koala with Trophy - Big & Adorable */}
        <div className="relative mb-3 flex items-center justify-center animate-bounce" style={{ animationDuration: '2.5s' }}>
          <MobitKoala mood="proud" className="w-52 h-52" />
          <div className="absolute -bottom-1 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[12px] font-black shadow-xs">
            트로피 수여 🏆
          </div>
        </div>

        <h3 className="text-[22px] font-black text-[#0f2e7a] tracking-tight leading-snug mt-2 break-keep">
          대단해요! 오늘 습관 100% 완료! 🐨🎉
        </h3>
        <p className="text-[15px] text-on-surface font-bold mt-1.5 leading-relaxed break-keep">
          모빗이가 기립박수를 보내요! 👏
        </p>

        {/* Short encouraging closing button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-primary hover:bg-blue-700 text-white text-[15px] font-black mt-6 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
        >
          내일도 함께해요! ✨
        </button>
      </div>
    </Modal>
  );
};

// 3. Strict Mode Violation / Disappointed Encouragement Modal (아쉬울 때 위로)
interface MobitRegretModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const MobitRegretModal: React.FC<MobitRegretModalProps> = ({
  isOpen,
  onClose,
  message = '집중 중 다른 화면으로 벗어났습니다. 엄격 모드에 의해 타이머가 초기화되었어요.',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="모빗이의 아쉬운 한마디 🐨">
      <div className="flex flex-col items-center text-center p-2">
        <div className="relative mb-2 flex items-center justify-center">
          <MobitKoala mood="sad" className="w-32 h-32" />
        </div>

        <h3 className="text-[18px] font-black text-on-surface tracking-tight mt-1">
          아쉬워요, 집중이 중단되었어요 💧
        </h3>
        <p className="text-[13px] text-tertiary mt-2 leading-relaxed px-2">
          {message}
        </p>

        <div className="w-full mt-4 p-3 rounded-xl bg-surface-container-low text-left border border-surface-container/60">
          <p className="text-[12px] text-on-surface leading-relaxed">
            🌿 <strong>모빗이의 한마디:</strong> "실패가 아니라 다시 도전할 수 있는 기회예요. 호흡을 가다듬고 다시 시작해 볼까요?"
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-primary text-white text-[13px] font-black mt-5 shadow-xs active:scale-95 transition"
        >
          마음 다잡고 다시 시작하기
        </button>
      </div>
    </Modal>
  );
};
