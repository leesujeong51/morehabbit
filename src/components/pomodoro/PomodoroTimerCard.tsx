import React, { useState, useEffect, useCallback } from 'react';
import { soundEngine, type AmbientSoundType } from '../../utils/soundEngine';
import {
  savePomodoroRecord,
  getTodayPomodoroStats,
  getPomodoroStrictMode,
  setPomodoroStrictMode,
} from '../../utils/pomodoroStorage';
import { triggerConfetti } from '../../utils/routineUtils';
import { toDateKey } from '../../utils/dateUtils';
import { MobitPraiseModal, MobitRegretModal } from '../character/MobitCharacter';

type TimerMode = 'work25' | 'work50' | 'shortBreak' | 'longBreak';

interface PomodoroTimerCardProps {
  onSessionComplete?: () => void;
  className?: string;
}

export const PomodoroTimerCard: React.FC<PomodoroTimerCardProps> = ({
  onSessionComplete,
  className = '',
}) => {
  // Timer durations in seconds (Pomodoro Classic 25m & Deep Work 50m)
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

  // Pomodoro Study Technique Feature 1: Single Task Commitment
  const [currentTask, setCurrentTask] = useState('기출문제 1회분 풀기');
  const [isTaskDone, setIsTaskDone] = useState(false);

  // Pomodoro Study Technique Feature 2: Brain Dump / Interruption Sheet (딴생각 보관함)
  const [distractions, setDistractions] = useState<Array<{ id: number; text: string; done: boolean }>>([
    { id: 1, text: '친구 카톡 답장하기 (휴식 시간에 하기)', done: false },
  ]);
  const [newDistraction, setNewDistraction] = useState('');

  // Strict mode & Ambient sound
  const [strictMode, setStrictMode] = useState<boolean>(() => getPomodoroStrictMode());
  const [strictAlertOpen, setStrictAlertOpen] = useState(false);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('rain');
  const [isSoundSelectorOpen, setIsSoundSelectorOpen] = useState(false);

  // Completion modal state
  const [isMobitModalOpen, setIsMobitModalOpen] = useState(false);
  const [lastCompletedCycle, setLastCompletedCycle] = useState(1);

  // Today's statistics
  const [todayStats, setTodayStats] = useState(() => getTodayPomodoroStats());

  // Strict Mode Listener: detects tab leave / blur
  useEffect(() => {
    if (!strictMode || !isRunning) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        setIsRunning(false);
        soundEngine.stopAmbient();
        setRemainingSeconds(totalSeconds);
        setStrictAlertOpen(true);
      }
    };

    const handleWindowBlur = () => {
      if (isRunning && strictMode) {
        setIsRunning(false);
        soundEngine.stopAmbient();
        setRemainingSeconds(totalSeconds);
        setStrictAlertOpen(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [strictMode, isRunning, totalSeconds]);

  // Ambient sound player sync with running state
  useEffect(() => {
    if (isRunning && ambientSound !== 'mute') {
      soundEngine.playAmbient(ambientSound);
    } else {
      soundEngine.stopAmbient();
    }
  }, [isRunning, ambientSound]);

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
    soundEngine.stopAmbient();
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
        strictMode,
        routineTitle: currentTask.trim() || undefined,
      });

      setTodayStats(getTodayPomodoroStats());
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
  }, [mode, cycle, strictMode, currentTask, onSessionComplete]);

  // Switch timer mode
  const handleSelectMode = (newMode: TimerMode) => {
    setIsRunning(false);
    soundEngine.stopAmbient();
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

  // Toggle strict mode
  const handleToggleStrictMode = () => {
    const next = !strictMode;
    setStrictMode(next);
    setPomodoroStrictMode(next);
  };

  // Add 5 minutes (+5분)
  const handleAddFiveMinutes = () => {
    setRemainingSeconds((prev) => prev + 5 * 60);
    setTotalSeconds((prev) => prev + 5 * 60);
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    soundEngine.stopAmbient();
    setRemainingSeconds(totalSeconds);
  };

  // Add a distraction (딴생각 보관함)
  const handleAddDistraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistraction.trim()) return;
    setDistractions((prev) => [
      ...prev,
      { id: Date.now(), text: newDistraction.trim(), done: false },
    ]);
    setNewDistraction('');
  };

  // Format time (MM:SS)
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Circular progress math (Grand enlarged dial: Radius 118, ViewBox 280x280)
  const RADIUS = 118;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~ 741.42
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <section className={`flex flex-col gap-4 ${className}`}>
      {/* 1. Top Bar: Header, Strict Mode & Background Sounds */}
      <div className="bg-surface-container-lowest rounded-3xl p-4.5 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-lg font-black shadow-xs">
            🍅
          </div>
          <div>
            <h2 className="text-[16px] font-black text-on-surface tracking-tight leading-none">
              뽀모도로 집중 스튜디오
            </h2>
            <span className="text-[12px] text-tertiary font-medium mt-1 block">
              오늘 완주 <strong className="text-primary font-bold">{todayStats.count}세션</strong>{' '}
              ({todayStats.totalMinutes}분 몰입)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Strict Mode Button */}
          <button
            onClick={handleToggleStrictMode}
            className={`px-2.5 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
              strictMode
                ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs'
                : 'bg-surface-container-low text-tertiary hover:text-on-surface'
            }`}
            title="화면 이탈 시 초기화되는 엄격 모드"
          >
            <span className="material-symbols-outlined text-[15px]">
              {strictMode ? 'lock' : 'lock_open'}
            </span>
            <span>엄격 모드</span>
          </button>

          {/* Sound Mini Player Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSoundSelectorOpen((prev) => !prev)}
              className={`p-1.5 rounded-xl text-[12px] font-bold flex items-center justify-center transition-all ${
                ambientSound !== 'mute' && isRunning
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container-low text-tertiary hover:text-on-surface'
              }`}
              title="백그라운드 사운드 설정"
            >
              <span className="material-symbols-outlined text-[19px]">
                {ambientSound === 'rain'
                  ? 'water_drop'
                  : ambientSound === 'cafe'
                  ? 'local_cafe'
                  : ambientSound === 'lofi'
                  ? 'headphones'
                  : 'volume_off'}
              </span>
            </button>

            {isSoundSelectorOpen && (
              <div className="absolute right-0 top-10 w-44 bg-surface-container-lowest rounded-2xl p-2 shadow-xl border border-surface-container z-30 flex flex-col gap-1">
                <span className="text-[11px] font-bold text-tertiary px-2 py-1 block">
                  몰입 백그라운드 사운드
                </span>
                {[
                  { id: 'rain', label: '잔잔한 빗소리', icon: 'water_drop' },
                  { id: 'cafe', label: '따뜻한 카페', icon: 'local_cafe' },
                  { id: 'lofi', label: '로파이 음악', icon: 'headphones' },
                  { id: 'mute', label: '소리 끄기 (음소거)', icon: 'volume_off' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setAmbientSound(s.id as AmbientSoundType);
                      setIsSoundSelectorOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-left text-[12px] font-bold flex items-center gap-2 transition ${
                      ambientSound === s.id
                        ? 'bg-primary-fixed text-primary'
                        : 'hover:bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. 뽀모도로 이용법 (30초 핵심 가이드) */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 flex flex-col transition-all">
        <button
          onClick={() => setIsGuideOpen((prev) => !prev)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span className="text-[14px] font-black text-[#0f2e7a]">
              뽀모도로 학습법 4단계 이용 가이드
            </span>
          </div>
          <span className="material-symbols-outlined text-primary text-[20px] transition-transform duration-200">
            {isGuideOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {isGuideOpen && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-blue-100/80 text-[12px]">
            <div className="bg-white/80 p-2.5 rounded-xl">
              <span className="font-bold text-primary block mb-0.5">1. 단일 목표 선정</span>
              <p className="text-slate-600 leading-tight">이번 25분 동안 오직 한 가지 작업만 정하기</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl">
              <span className="font-bold text-primary block mb-0.5">2. 25분 완전 몰입</span>
              <p className="text-slate-600 leading-tight">알림 차단! 떠오른 딴생각은 보관함에 메모</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl">
              <span className="font-bold text-emerald-600 block mb-0.5">3. 5분 꿀맛 휴식</span>
              <p className="text-slate-600 leading-tight">화면에서 눈을 떼고 가벼운 스트레칭 & 수분 보충</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl">
              <span className="font-bold text-indigo-600 block mb-0.5">4. 4회 후 긴 휴식</span>
              <p className="text-slate-600 leading-tight">4사이클 완주 시 15분간 뇌를 완벽 충전</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN HERO CARD: 초대형 원형 다이얼 타이머 (눈에 확 띄는 큰 라운드 디자인) */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_12px_36px_-4px_rgba(29,78,216,0.1)] border border-surface-container/80 flex flex-col items-center relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>

        {/* Mode Selector Tabs (위: 정통 25분, 딥워크 50분 / 아래: 5분 휴식, 15분 휴식 / 이모티콘 제거) */}
        <div className="w-full max-w-[340px] flex flex-col gap-2 z-10">
          {/* Top Row: Focus Modes */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'work25', label: '정통 25분' },
              { id: 'work50', label: '딥워크 50분' },
            ].map((tab) => {
              const isSelected = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectMode(tab.id as TimerMode)}
                  className={`h-10 px-3 rounded-xl text-[13.5px] font-bold transition-all active:scale-95 flex items-center justify-center ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs font-black'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Bottom Row: Break Modes */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'shortBreak', label: '5분 휴식' },
              { id: 'longBreak', label: '15분 휴식' },
            ].map((tab) => {
              const isSelected = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectMode(tab.id as TimerMode)}
                  className={`h-10 px-3 rounded-xl text-[13.5px] font-bold transition-all active:scale-95 flex items-center justify-center ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs font-black'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Dots Session Cycle Tracker */}
        <div className="flex items-center gap-2.5 mt-4 z-10">
          {[1, 2, 3, 4].map((dot) => {
            const isCompleted = dot < cycle;
            const isCurrent = dot === cycle;
            return (
              <div key={dot} className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    isCompleted
                      ? 'bg-primary text-white shadow-xs'
                      : isCurrent
                      ? 'bg-primary-fixed text-primary ring-2 ring-primary ring-offset-2 animate-pulse scale-110'
                      : 'bg-surface-container text-tertiary'
                  }`}
                  title={`${dot}번째 세션`}
                >
                  {isCompleted ? '✓' : dot}
                </div>
                {dot < 4 && (
                  <div
                    className={`w-5 h-0.5 rounded-full ${
                      isCompleted ? 'bg-primary' : 'bg-surface-container'
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-[11.5px] font-bold text-tertiary mt-1 z-10">
          {cycle}번째 세션 진행 중 · 4회 완주 시 15분 긴 휴식
        </span>

        {/* 🌟 ENLARGED GRAND PROGRESS RING (가운데 라운드를 크게 해서 눈에 확 띄게) 🌟 */}
        <div className="relative flex items-center justify-center my-6 z-10">
          <svg
            className="w-72 h-72 xs:w-80 xs:h-80 max-w-[320px] transform -rotate-90 drop-shadow-[0_8px_20px_rgba(29,78,216,0.12)]"
            viewBox="0 0 280 280"
          >
            <defs>
              <linearGradient id="grandPomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1d4ed8" />
                <stop offset="60%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            {/* Background Muted Track Ring */}
            <circle
              cx="140"
              cy="140"
              r={RADIUS}
              stroke="currentColor"
              strokeWidth="14"
              fill="transparent"
              className="text-surface-container/70"
            />

            {/* Glowing Active Progress Ring */}
            <circle
              cx="140"
              cy="140"
              r={RADIUS}
              stroke="url(#grandPomodoroGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-linear"
            />
          </svg>

          {/* Center Digital Display (Extra Large Numbers) */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[12.5px] font-black text-primary px-3 py-0.5 rounded-full bg-primary-fixed/60 mb-2 uppercase tracking-wide">
              {mode === 'work25'
                ? '정통 25분 집중'
                : mode === 'work50'
                ? '딥워크 50분 집중'
                : mode === 'shortBreak'
                ? '5분 휴식'
                : '15분 휴식'}
            </span>

            {/* High-visibility Giant Navy Blue Numbers */}
            <span className="text-[52px] xs:text-[56px] font-black text-[#0f2e7a] tracking-tight tabular-nums leading-none">
              {timeString}
            </span>

            <span className="text-[12.5px] font-bold text-tertiary mt-2.5 flex items-center gap-1.5">
              {isRunning ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-emerald-700 font-extrabold">완전 몰입 중 ✨</span>
                </>
              ) : (
                <span>일시 멈춤 상태</span>
              )}
            </span>
          </div>
        </div>

        {/* 3-Button Control Cluster */}
        <div className="flex items-center justify-center gap-3.5 w-full max-w-xs z-10 pb-1">
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-13 h-13 rounded-2xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xs"
            title="타이머 초기화"
          >
            <span className="material-symbols-outlined text-[23px]">restart_alt</span>
            <span className="text-[10px] font-bold mt-0.5">초기화</span>
          </button>

          {/* Main Hero Play/Pause Button */}
          <button
            onClick={() => setIsRunning((prev) => !prev)}
            className={`flex-1 h-14 rounded-2xl font-black text-[16px] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                : 'bg-primary hover:bg-blue-700 text-white shadow-blue-500/30 ring-2 ring-blue-400/20'
            }`}
          >
            <span className="material-symbols-outlined text-[26px]">
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
            <span>{isRunning ? '잠시 멈춤' : '시작하기'}</span>
          </button>

          {/* +5 Minutes Extension Button */}
          <button
            onClick={handleAddFiveMinutes}
            className="w-13 h-13 rounded-2xl bg-surface-container-low hover:bg-surface-container text-primary flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xs"
            title="시간 5분 연장"
          >
            <span className="text-[15px] font-black leading-none">+5</span>
            <span className="text-[10px] font-bold mt-0.5">연장</span>
          </button>
        </div>
      </section>

      {/* 4. 뽀모도로 학습법 기능 1: 이번 세션 집중 목표 (Task Commitment) */}
      <section className="bg-surface-container-lowest rounded-3xl p-4.5 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/70 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <h3 className="text-[15px] font-black text-on-surface">이번 뽀모 집중 과제</h3>
          </div>
          <span className="text-[11.5px] font-bold text-tertiary">오직 한 가지에만 몰입하기</span>
        </div>

        {/* Task Input & Complete Checkbox */}
        <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-surface-container-low border border-surface-container">
          <button
            onClick={() => setIsTaskDone((prev) => !prev)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
              isTaskDone
                ? 'bg-primary text-white shadow-xs'
                : 'border-2 border-outline-variant bg-white text-transparent'
            }`}
            title="과제 완료 체크"
          >
            <span className="material-symbols-outlined text-[18px] font-bold">check</span>
          </button>
          <input
            type="text"
            value={currentTask}
            onChange={(e) => setCurrentTask(e.target.value)}
            placeholder="이번 25분 동안 완수할 1가지 목표를 적어보세요"
            className={`flex-1 bg-transparent text-[14px] font-bold text-on-surface focus:outline-none placeholder:text-outline ${
              isTaskDone ? 'line-through text-outline' : ''
            }`}
          />
        </div>

        {/* Quick Task Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {['📚 시험공부/암기', '💻 코딩/업무', '📖 집중 독서', '✍️ 기획 및 과제'].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setCurrentTask(tag);
                setIsTaskDone(false);
              }}
              className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-surface-container hover:bg-primary-fixed hover:text-primary text-tertiary transition"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* 5. 뽀모도로 학습법 기능 2: 딴생각/잡념 보관함 (Brain Dump / Interruption Sheet) */}
      <section className="bg-surface-container-lowest rounded-3xl p-4.5 shadow-[0_4px_24px_-4px_rgba(29,78,216,0.06)] border border-surface-container/70 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💭</span>
            <div>
              <h3 className="text-[15px] font-black text-on-surface">딴생각·잡념 보관함</h3>
              <p className="text-[11.5px] text-tertiary font-medium">
                떠오른 딴생각은 적어두고, 타이머가 끝난 뒤 처리하세요!
              </p>
            </div>
          </div>
          <span className="text-[12px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-primary">
            {distractions.filter((d) => !d.done).length}개 보관
          </span>
        </div>

        {/* Fast Add Form */}
        <form onSubmit={handleAddDistraction} className="flex gap-2">
          <input
            type="text"
            value={newDistraction}
            onChange={(e) => setNewDistraction(e.target.value)}
            placeholder="떠오른 생각 적고 Enter (예: 택배 조회, 카톡)"
            className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container text-[13px] font-medium text-on-surface focus:outline-none focus:border-primary placeholder:text-outline"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-primary text-white text-[12.5px] font-bold shrink-0 hover:bg-blue-700 transition"
          >
            담기
          </button>
        </form>

        {/* Distraction List */}
        {distractions.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1 max-h-40 overflow-y-auto no-scrollbar">
            {distractions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low/60 text-[12.5px]"
              >
                <div
                  onClick={() =>
                    setDistractions((prev) =>
                      prev.map((d) => (d.id === item.id ? { ...d, done: !d.done } : d))
                    )
                  }
                  className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                >
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      item.done ? 'text-primary' : 'text-slate-400'
                    }`}
                  >
                    {item.done ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  <span
                    className={`truncate font-medium ${
                      item.done ? 'line-through text-outline' : 'text-on-surface'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setDistractions((prev) => prev.filter((d) => d.id !== item.id))
                  }
                  className="text-tertiary hover:text-rose-600 p-1"
                  title="삭제"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Strict Mode Violation Modal (모빗 위로) */}
      <MobitRegretModal
        isOpen={strictAlertOpen}
        onClose={() => setStrictAlertOpen(false)}
        message="'엄격 모드'가 켜진 상태에서 다른 화면으로 벗어나 집중이 중단되었어요. 타이머가 초기화되었습니다."
      />

      {/* Mobit Praise Modal (모빗의 완주 칭찬) */}
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
