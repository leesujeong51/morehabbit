import React, { useState, useEffect, useCallback } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import {
  savePomodoroRecord,
} from '../../utils/pomodoroStorage';
import { triggerConfetti } from '../../utils/routineUtils';
import { toDateKey } from '../../utils/dateUtils';
import { MobitCharacter, MobitPraiseModal } from '../character/MobitCharacter';
import { useLanguage } from '../../utils/i18n';

type TimerMode = 'work25' | 'work50' | 'shortBreak' | 'longBreak';

interface DistractionItem {
  id: string;
  text: string;
  completed: boolean;
}

interface PomodoroTimerCardProps {
  onSessionComplete?: () => void;
  className?: string;
}

// Reusable Circular 'i' Tooltip Component (Request 3 & 지침 2: 마우스 오버 시 설명)
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1.5 group select-none">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-4 h-4 rounded-full border border-slate-300 hover:border-primary text-slate-400 hover:text-primary flex items-center justify-center text-xs font-bold transition-all cursor-pointer leading-none"
        aria-label="info"
      >
        i
      </button>

      {/* Tooltip Popup on Hover / Focus */}
      <span
        className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none transition-all duration-200 ${
          isOpen ? 'opacity-100 scale-100 flex' : 'opacity-0 scale-95 hidden group-hover:flex'
        } flex-col items-center`}
      >
        <span className="bg-slate-900/95 text-white text-xs font-medium px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap break-keep border border-slate-700/60 max-w-xs text-center leading-snug">
          {text}
        </span>
        <span className="w-2 h-2 bg-slate-900/95 rotate-45 -mt-1 border-r border-b border-slate-700/60 block" />
      </span>
    </span>
  );
};

export const PomodoroTimerCard: React.FC<PomodoroTimerCardProps> = ({
  onSessionComplete,
  className = '',
}) => {
  const { language, t } = useLanguage();

  // Timer durations in seconds
  const DURATIONS: Record<TimerMode, number> = {
    work25: 25 * 60,
    work50: 50 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  // Timer State
  const [mode, setMode] = useState<TimerMode>('work25');
  const [totalSeconds, setTotalSeconds] = useState(DURATIONS.work25);
  const [remainingSeconds, setRemainingSeconds] = useState(DURATIONS.work25);
  const [isRunning, setIsRunning] = useState(false);

  // Cycle tracker (1, 2, 3, 4)
  const [cycle, setCycle] = useState(1);

  // Guide accordion toggle
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAirplaneReady, setIsAirplaneReady] = useState(false);

  // Distraction Brain Dump State (딴생각·잡념 보관함)
  const [distractions, setDistractions] = useState<DistractionItem[]>(() => {
    try {
      const saved = localStorage.getItem('morehabbit_pomodoro_distractions_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [newDistraction, setNewDistraction] = useState('');

  // Persist distractions in localStorage
  useEffect(() => {
    localStorage.setItem('morehabbit_pomodoro_distractions_v3', JSON.stringify(distractions));
  }, [distractions]);

  // Completion modal state
  const [isMobitModalOpen, setIsMobitModalOpen] = useState(false);
  const [lastCompletedCycle, setLastCompletedCycle] = useState(1);

  // Main countdown timer interval
  useEffect(() => {
    let timer: number | null = null;

    if (isRunning) {
      timer = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, mode, cycle]);

  // Completion Handler
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    soundEngine.playChime();
    soundEngine.triggerVibration();

    const isWork = mode === 'work25' || mode === 'work50';

    if (isWork) {
      const minutesSpent = mode === 'work50' ? 50 : 25;
      savePomodoroRecord({
        date: toDateKey(),
        durationMinutes: minutesSpent,
        completedAt: new Date().toTimeString().slice(0, 5),
        cycle,
        strictMode: false,
      });

      triggerConfetti();

      setLastCompletedCycle(cycle);
      setIsMobitModalOpen(true);

      if (onSessionComplete) {
        onSessionComplete();
      }
    } else {
      // Break finished
      setMode('work25');
      setTotalSeconds(DURATIONS.work25);
      setRemainingSeconds(DURATIONS.work25);
    }
  }, [mode, cycle, onSessionComplete]);

  // Switch timer mode
  const handleSelectMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTotalSeconds(DURATIONS[newMode]);
    setRemainingSeconds(DURATIONS[newMode]);
  };

  // Start break after Mobit celebration
  const handleStartBreakAfterMobit = () => {
    setIsMobitModalOpen(false);
    const nextIsLong = cycle >= 4;
    const nextMode: TimerMode = nextIsLong ? 'longBreak' : 'shortBreak';

    if (nextIsLong) {
      setCycle(1);
    } else {
      setCycle((prev) => prev + 1);
    }

    setMode(nextMode);
    setTotalSeconds(DURATIONS[nextMode]);
    setRemainingSeconds(DURATIONS[nextMode]);
    setIsRunning(true);
  };

  // Add 5 minutes (+5분)
  const handleAddFiveMinutes = () => {
    setRemainingSeconds((prev) => prev + 5 * 60);
    setTotalSeconds((prev) => prev + 5 * 60);
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  // Distraction Actions
  const handleAddDistraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistraction.trim()) return;
    setDistractions((prev) => [
      ...prev,
      { id: `dist-${Date.now()}`, text: newDistraction.trim(), completed: false },
    ]);
    setNewDistraction('');
  };

  const handleToggleDistraction = (id: string) => {
    setDistractions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, completed: !d.completed } : d))
    );
  };

  const handleDeleteDistraction = (id: string) => {
    setDistractions((prev) => prev.filter((d) => d.id !== id));
  };

  // Format time (MM:SS)
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Circular progress math (Radius 98, ViewBox 240x240)
  const RADIUS = 98;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~ 615.75
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <section className={`flex flex-col gap-3.5 ${className}`}>
      {/* 1. MAIN HERO CARD: 원형 다이얼 타이머 & 시작 버튼이 한 화면에 딱 들어오도록 최적화 */}
      <section className="bg-surface-container-lowest rounded-3xl p-4 xs:p-5 pt-3.5 pb-4 shadow-[0_10px_32px_-4px_rgba(29,78,216,0.08)] border border-surface-container/80 flex flex-col items-center relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>

        {/* 1-Row Compact Mode Selector (25m / 50m / 5m / 15m) */}
        <div className="w-full max-w-sm grid grid-cols-4 gap-1.5 z-10">
          {[
            { id: 'work25', label: '25m', title: t.pomodoro.work25 },
            { id: 'work50', label: '50m', title: t.pomodoro.work50 },
            { id: 'shortBreak', label: '5m', title: t.pomodoro.shortBreak },
            { id: 'longBreak', label: '15m', title: t.pomodoro.longBreak },
          ].map((tab) => {
            const isSelected = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectMode(tab.id as TimerMode)}
                title={tab.title}
                className={`h-9 px-1 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center whitespace-nowrap break-keep cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Compact Session Cycle Tracker */}
        <div className="flex items-center justify-center gap-2 mt-2 z-10 select-none">
          <span className="text-xs font-black text-tertiary">
            {cycle}/4 {language === 'en' ? 'Sessions' : language === 'ja' ? 'セッション' : '세션'}
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((dot) => (
              <div
                key={dot}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  dot < cycle
                    ? 'bg-primary'
                    : dot === cycle
                    ? 'bg-primary ring-2 ring-blue-300 ring-offset-1 scale-110'
                    : 'bg-surface-container'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-tertiary font-bold ml-1">
            {cycle >= 4
              ? (language === 'en' ? '15m long break after' : language === 'ja' ? '完了時15分長い休憩' : '완주 시 15분 긴 휴식')
              : (language === 'en' ? '5m short break after' : language === 'ja' ? '完了後5分休憩' : '완료 후 5분 휴식')}
          </span>
        </div>

        {/* CIRCULAR DIAL (모바일 화면 중앙에 딱 맞게 정돈된 크기) */}
        <div className="relative flex items-center justify-center my-2 xs:my-3 z-10">
          <svg
            className="w-56 h-56 xs:w-60 xs:h-60 max-w-[240px] transform -rotate-90 drop-shadow-[0_6px_18px_rgba(29,78,216,0.12)]"
            viewBox="0 0 240 240"
          >
            <defs>
              <linearGradient id="grandPomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1d4ed8" />
                <stop offset="60%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            {/* Background Track Ring */}
            <circle
              cx="120"
              cy="120"
              r={RADIUS}
              stroke="currentColor"
              strokeWidth="13"
              fill="transparent"
              className="text-surface-container/70"
            />

            {/* Glowing Active Progress Ring */}
            <circle
              cx="120"
              cy="120"
              r={RADIUS}
              stroke="url(#grandPomodoroGradient)"
              strokeWidth="13"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-linear"
            />
          </svg>

          {/* Center Digital Display (Clean & Uncluttered without overflowing outer badge) */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            {/* High-visibility Bold Numbers */}
            <span className="text-xl xs:text-xl font-black text-[#0f2e7a] tracking-tight tabular-nums leading-none">
              {timeString}
            </span>

            <span className="text-xs font-extrabold mt-2.5 flex items-center gap-1.5 break-keep">
              {isRunning ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                  <span className="text-primary font-black">{t.pomodoro.focusing}</span>
                </>
              ) : (
                <span className="text-slate-500 font-bold">{t.pomodoro.paused}</span>
              )}
            </span>
          </div>
        </div>

        {/* 3-Button Control Cluster (모바일 하단 바에 가려지지 않고 바로 보이는 위치) */}
        <div className="flex items-center justify-center gap-3 w-full max-w-xs z-10 pb-0.5">
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-12 h-13 rounded-2xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xs cursor-pointer"
            title={t.pomodoro.reset}
          >
            <span className="material-symbols-outlined text-[22px]">restart_alt</span>
            <span className="text-xs font-bold mt-0.5 break-keep">{t.pomodoro.reset}</span>
          </button>

          {/* Main Hero Play/Pause Button */}
          <button
            onClick={() => setIsRunning((prev) => !prev)}
            className={`flex-1 h-13 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                : 'bg-primary hover:bg-blue-700 text-white shadow-blue-500/30 ring-2 ring-blue-400/20'
            }`}
          >
            <span className="material-symbols-outlined text-[26px]">
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
            <span className="break-keep">{isRunning ? t.pomodoro.pause : t.pomodoro.start}</span>
          </button>

          {/* +5 Minutes Extension Button */}
          <button
            onClick={handleAddFiveMinutes}
            className="w-12 h-13 rounded-2xl bg-surface-container-low hover:bg-surface-container text-primary flex items-center justify-center transition-all active:scale-95 shadow-2xs cursor-pointer font-black text-sm"
            title="+5m"
          >
            <span>+5m</span>
          </button>
        </div>
      </section>

      {/* 2. 비행기 모드 배너 — 웹에서는 기기 설정을 바꿀 수 없어, 사용자가 켰음을 체크하는 리마인더 */}
      <button
        type="button"
        onClick={() => setIsAirplaneReady((prev) => !prev)}
        className={`w-full p-4 rounded-2xl border flex items-center gap-3 text-left transition active:scale-[0.99] cursor-pointer ${
          isAirplaneReady ? 'bg-primary border-primary text-white' : 'bg-white border-surface-container/80'
        }`}
      >
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isAirplaneReady ? 'bg-white/20 text-white' : 'bg-blue-50 text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">airplanemode_active</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block text-base font-bold ${isAirplaneReady ? 'text-white' : 'text-on-surface'}`}>
            {isAirplaneReady ? t.pomodoro.airplaneDone : t.pomodoro.airplaneTitle}
          </span>
          <span className={`block text-sm ${isAirplaneReady ? 'text-white/80' : 'text-slate-500'}`}>
            {t.pomodoro.airplaneDesc}
          </span>
        </span>
        {isAirplaneReady ? (
          <span className="material-symbols-outlined text-[24px] shrink-0">check_circle</span>
        ) : (
          <span className="h-9 px-3 rounded-xl bg-primary text-white text-sm font-bold flex items-center shrink-0">
            {t.pomodoro.airplaneOn}
          </span>
        )}
      </button>

      {/* 3. 딴생각·잡념 보관함 (Request 3 & 4: 설명 문구 i 툴팁, 간결한 UI) */}
      <section className="bg-surface-container-lowest rounded-3xl p-4.5 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/70 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">💭</span>
            <h3 className="text-sm font-black text-on-surface flex items-center break-keep">
              <span>{t.pomodoro.distractionTitle}</span>
              <InfoTooltip text={t.pomodoro.distractionTooltip} />
            </h3>
          </div>
        </div>

        {/* Fast Add Form */}
        <form onSubmit={handleAddDistraction} className="w-full flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={newDistraction}
            onChange={(e) => setNewDistraction(e.target.value)}
            placeholder={t.pomodoro.distractionPlaceholder}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white border border-slate-200/90 text-xs font-medium text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 shadow-2xs"
          />
          <button
            type="submit"
            className="px-3.5 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-black shrink-0 transition active:scale-95 shadow-xs cursor-pointer whitespace-nowrap"
          >
            {t.pomodoro.distractionAdd}
          </button>
        </form>

        {/* Distraction List */}
        {distractions.length > 0 ? (
          <div className="flex flex-col gap-1.5 mt-1 max-h-48 overflow-y-auto no-scrollbar">
            {distractions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low/60 text-xs border border-surface-container/60 hover:bg-surface-container-low transition"
              >
                <div
                  onClick={() => handleToggleDistraction(item.id)}
                  className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 select-none"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] shrink-0 ${
                      item.completed ? 'text-primary' : 'text-slate-400'
                    }`}
                  >
                    {item.completed ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  <span
                    className={`truncate font-medium break-keep ${
                      item.completed ? 'line-through text-outline' : 'text-on-surface'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDistraction(item.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                  title={t.common?.delete || '삭제'}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2 text-center">
            <MobitCharacter mood="focus" className="w-12 h-12 mb-1 opacity-80" />
            <p className="text-xs text-slate-400 italic break-keep">
              {t.pomodoro.distractionEmpty}
            </p>
          </div>
        )}
      </section>

      {/* 3. 뽀모도로 학습법 4단계 가이드 (타이머 아래 배치하여 모바일 첫 화면을 가리지 않음) */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 flex flex-col transition-all">
        <button
          onClick={() => setIsGuideOpen((prev) => !prev)}
          className="flex items-center justify-between w-full text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-base select-none">💡</span>
            <span className="text-sm font-black text-[#0f2e7a] break-keep">
              {t.pomodoro.guideToggle}
            </span>
          </div>
          <span className="material-symbols-outlined text-primary text-[20px] transition-transform duration-200">
            {isGuideOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {isGuideOpen && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-blue-100/80 text-xs">
            <div className="bg-white/80 p-2.5 rounded-xl">
              <span className="font-bold text-primary block mb-0.5 break-keep">
                {t.pomodoro.guide1Title}
              </span>
              <p className="text-slate-600 leading-tight break-keep">{t.pomodoro.guide1Desc}</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl">
              <span className="font-bold text-primary block mb-0.5 break-keep">
                {t.pomodoro.guide2Title}
              </span>
              <p className="text-slate-600 leading-tight break-keep">{t.pomodoro.guide2Desc}</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl">
              <span className="font-bold text-primary block mb-0.5 break-keep">
                {t.pomodoro.guide3Title}
              </span>
              <p className="text-slate-600 leading-tight break-keep">{t.pomodoro.guide3Desc}</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl">
              <span className="font-bold text-indigo-600 block mb-0.5 break-keep">
                {t.pomodoro.guide4Title}
              </span>
              <p className="text-slate-600 leading-tight break-keep">{t.pomodoro.guide4Desc}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobit Praise Modal */}
      <MobitPraiseModal
        isOpen={isMobitModalOpen}
        onClose={() => setIsMobitModalOpen(false)}
        onStartBreak={handleStartBreakAfterMobit}
        completedCycle={lastCompletedCycle}
        isLongBreakNext={lastCompletedCycle >= 4}
      />
    </section>
  );
};
