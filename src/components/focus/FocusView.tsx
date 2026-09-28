import React, { useState, useEffect, useRef } from 'react';
import type { Routine, SoundEffectType } from '../../types/routine';
import { triggerConfetti } from '../../utils/routineUtils';

interface FocusViewProps {
  routines: Routine[];
  selectedRoutine?: Routine | null;
  onCompleteRoutine: (routineId: string) => void;
  onSelectRoutine?: (routine: Routine) => void;
}

export const FocusView: React.FC<FocusViewProps> = ({
  routines,
  selectedRoutine,
  onCompleteRoutine,
  onSelectRoutine,
}) => {
  // If no routine is selected, pick the first pending one or fallback
  const activeRoutine = selectedRoutine || routines[0] || {
    id: 'default-focus',
    title: '아침 독서 & 생각 노트',
    emoji: '📖',
    categoryId: 'cat-growth',
    timeOfDay: 'morning',
    repeatType: 'daily',
    createdAt: '',
    order: 1,
    tag: '20분',
    xp: 50,
  };

  const initialDuration = 20 * 60; // 20 minutes in seconds
  const [totalSeconds, setTotalSeconds] = useState(18 * 60 + 24); // Start at 18:24 as in mockup
  const [isRunning, setIsRunning] = useState(false);
  const [activeSound, setActiveSound] = useState<SoundEffectType>('rain');
  const [completedFeedback, setCompletedFeedback] = useState(false);

  // Session Checklist Steps
  const [steps, setSteps] = useState([
    { id: 1, text: '독서할 챕터 및 목표 15p 선정', done: true },
    { id: 2, text: '핵심 키워드 형광펜 표시하며 정독', done: false },
    { id: 3, text: '인상 깊은 문장 1줄 요약 메모', done: false },
  ]);

  // Audio Context Ref for synthesized calming ambient white noise
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, totalSeconds]);

  // Web Audio White Noise Generator
  const startAmbientSound = (soundType: SoundEffectType) => {
    stopAmbientSound();
    if (soundType === 'mute') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Create buffer with relaxing soft filtered noise
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        // Pink / Brown noise filter
        const white = Math.random() * 2 - 1;
        if (soundType === 'rain') {
          // Softer brown noise for rain
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 0.12; // gentle volume
        } else if (soundType === 'cafe') {
          // Warm filtered tone
          data[i] = (lastOut + 0.04 * white) / 1.04;
          lastOut = data[i];
          data[i] *= 0.08;
        } else {
          // Birds: subtle background pink noise
          data[i] = (lastOut + 0.015 * white) / 1.015;
          lastOut = data[i];
          data[i] *= 0.06;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Lowpass filter for cozy soothing ambient sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(soundType === 'rain' ? 800 : 1200, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(0);
      noiseNodeRef.current = noise;
    } catch (e) {
      console.log('Web Audio Ambient error:', e);
    }
  };

  const stopAmbientSound = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const handleSoundChange = (sound: SoundEffectType) => {
    setActiveSound(sound);
    if (sound === 'mute') {
      stopAmbientSound();
    } else {
      startAmbientSound(sound);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  // Format MM:SS
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Dial Calculations (Circumference = 2 * PI * 104 = ~653.45)
  const fullCircumference = 653.45;
  const fraction = Math.max(0, Math.min(1, totalSeconds / initialDuration));
  const strokeDashoffset = fullCircumference * (1 - fraction);

  const toggleStep = (id: number) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleCompleteCTA = () => {
    setIsRunning(false);
    stopAmbientSound();
    triggerConfetti();
    setCompletedFeedback(true);
    onCompleteRoutine(activeRoutine.id);

    setTimeout(() => {
      setCompletedFeedback(false);
    }, 3500);
  };

  return (
    <div className="flex flex-col w-full pb-8 gap-space-lg select-none">
      {/* Routine Header & Streak Context */}
      <section className="flex flex-col gap-space-sm pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-2xs">
            <span
              className="material-symbols-outlined text-[16px] text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="font-label-md text-label-md font-semibold tracking-tight text-secondary">
              Day 14 • 일일 20분 목표
            </span>
          </div>

          {/* Quick Routine Selector dropdown */}
          {routines.length > 1 && onSelectRoutine && (
            <select
              value={activeRoutine.id}
              onChange={(e) => {
                const found = routines.find((r) => r.id === e.target.value);
                if (found) onSelectRoutine(found);
              }}
              className="text-xs bg-surface-container-low text-primary font-bold px-2.5 py-1 rounded-full border border-surface-container focus:outline-none"
            >
              {routines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.emoji} {r.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeRoutine.emoji || '📖'}</span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">
              {activeRoutine.title}
            </h1>
          </div>
          <p className="font-body-md text-body-md text-tertiary mt-0.5">
            오롯이 나에게 집중하는 고요한 시간입니다.
          </p>
        </div>
      </section>

      {/* Interactive Circular Focus Dial */}
      <section className="relative flex flex-col items-center justify-center py-2">
        {/* Ambient Glow / Pulse Background */}
        <div
          className={`absolute w-72 h-72 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none -z-10 transition-opacity duration-1000 ${
            isRunning ? 'opacity-80 animate-pulse-glow' : 'opacity-20'
          }`}
        ></div>

        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* SVG Dial Track */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
            {/* Inactive Background Ring */}
            <circle
              className="text-surface-container-highest"
              cx="120"
              cy="120"
              fill="none"
              r="104"
              stroke="currentColor"
              strokeWidth="8"
            ></circle>
            {/* Active Sage Progress Ring */}
            <circle
              className="text-primary transition-all duration-700 ease-out"
              cx="120"
              cy="120"
              fill="none"
              r="104"
              stroke="currentColor"
              strokeDasharray={fullCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="8"
            ></circle>
          </svg>

          {/* Center Countdown Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase mb-0.5">
              목표 시간 20:00
            </span>
            <div className="font-numeral-display text-[2.75rem] text-on-surface tracking-tight leading-none my-1 font-extrabold">
              {timeFormatted}
            </div>
            <span className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm mt-1 px-2.5 py-0.5 rounded-full bg-surface-container-low font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-primary animate-pulse' : 'bg-outline'
                }`}
              ></span>
              <span>{isRunning ? '깊은 몰입 진행 중' : '잠시 멈춤'}</span>
            </span>
          </div>
        </div>

        {/* Micro Wellness Encouragement Whisper */}
        <p className="font-body-sm text-body-sm text-tertiary text-center mt-3 max-w-xs italic">
          🌿 잡념이 떠오르면 가볍게 흘려보내고, 호흡과 눈앞의 행동에 집중해보세요.
        </p>

        {/* Timer Control Actions */}
        <div className="flex items-center justify-center gap-6 mt-4">
          {/* Reset Button */}
          <button
            onClick={() => {
              setIsRunning(false);
              setTotalSeconds(initialDuration);
            }}
            className="w-12 h-12 rounded-full bg-surface-container-lowest text-on-surface-variant flex items-center justify-center shadow-xs hover:bg-surface-container active:scale-95 transition-all"
            title="처음부터 다시 시작"
          >
            <span className="material-symbols-outlined text-[24px]">replay</span>
          </button>

          {/* Main Pause / Resume Button */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_8px_24px_-4px_rgba(16,83,63,0.35)] hover:bg-primary-container active:scale-95 transition-all"
            title={isRunning ? '일시 정지' : '타이머 시작'}
          >
            <span
              className="material-symbols-outlined text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Quick +5 Min Extension Button */}
          <button
            onClick={() => setTotalSeconds((prev) => prev + 5 * 60)}
            className="w-12 h-12 rounded-full bg-surface-container-lowest text-on-surface-variant flex items-center justify-center shadow-xs hover:bg-surface-container active:scale-95 transition-all"
            title="5분 추가"
          >
            <span className="font-label-md text-label-md font-bold text-primary">+5m</span>
          </button>
        </div>
      </section>

      {/* Ambient Sound / White Noise Selector */}
      <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_20px_-2px_rgba(46,107,86,0.05)] border border-surface-container/60 space-y-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]">graphic_eq</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              배경 몰입 사운드
            </h2>
          </div>
          <span className="font-label-sm text-label-sm text-primary font-medium">
            {activeSound !== 'mute' ? '사운드 재생 중 🎧' : '음소거'}
          </span>
        </div>

        {/* Sound Pill Options */}
        <div className="grid grid-cols-2 gap-2">
          {/* Rain */}
          <button
            type="button"
            onClick={() => handleSoundChange('rain')}
            className={`group flex items-center justify-between p-3 rounded-xl transition-all active:scale-98 text-left ${
              activeSound === 'rain'
                ? 'bg-surface-container-low text-primary ring-1 ring-primary/30 font-semibold'
                : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">🌧️</span>
              <span className="font-label-md text-label-md truncate">잔잔한 빗소리</span>
            </div>
            {activeSound === 'rain' && (
              <span className="material-symbols-outlined text-[18px] text-primary animate-pulse">
                volume_up
              </span>
            )}
          </button>

          {/* Birds Forest */}
          <button
            type="button"
            onClick={() => handleSoundChange('birds')}
            className={`group flex items-center justify-between p-3 rounded-xl transition-all active:scale-98 text-left ${
              activeSound === 'birds'
                ? 'bg-surface-container-low text-primary ring-1 ring-primary/30 font-semibold'
                : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">🌲</span>
              <span className="font-label-md text-label-md truncate">깊은 숲속 새소리</span>
            </div>
            {activeSound === 'birds' && (
              <span className="material-symbols-outlined text-[18px] text-primary animate-pulse">
                volume_up
              </span>
            )}
          </button>

          {/* Cafe */}
          <button
            type="button"
            onClick={() => handleSoundChange('cafe')}
            className={`group flex items-center justify-between p-3 rounded-xl transition-all active:scale-98 text-left ${
              activeSound === 'cafe'
                ? 'bg-surface-container-low text-primary ring-1 ring-primary/30 font-semibold'
                : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">☕</span>
              <span className="font-label-md text-label-md truncate">아늑한 카페 소음</span>
            </div>
            {activeSound === 'cafe' && (
              <span className="material-symbols-outlined text-[18px] text-primary animate-pulse">
                volume_up
              </span>
            )}
          </button>

          {/* Mute */}
          <button
            type="button"
            onClick={() => handleSoundChange('mute')}
            className={`group flex items-center justify-between p-3 rounded-xl transition-all active:scale-98 text-left ${
              activeSound === 'mute'
                ? 'bg-surface-container text-on-surface font-semibold'
                : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">🔇</span>
              <span className="font-label-md text-label-md truncate">사운드 끄기</span>
            </div>
          </button>
        </div>
      </section>

      {/* Session Steps & Checklist */}
      <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-[0_4px_20px_-2px_rgba(46,107,86,0.05)] border border-surface-container/60 space-y-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]">checklist</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              세션 단계별 체크
            </h2>
          </div>
          <span className="font-label-sm text-label-sm text-tertiary">
            {steps.filter((s) => s.done).length} / {steps.length} 완료
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98 ${
                step.done
                  ? 'bg-surface-container-low/70 text-on-surface-variant border border-surface-container/50'
                  : 'bg-surface-container-low text-on-surface border border-primary-fixed/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    step.done ? 'text-primary' : 'text-primary'
                  }`}
                  style={{ fontVariationSettings: step.done ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {step.done ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span
                  className={`font-body-sm text-body-sm truncate ${
                    step.done ? 'line-through text-outline' : 'font-medium'
                  }`}
                >
                  Step {idx + 1}: {step.text}
                </span>
              </div>
              <span
                className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full shrink-0 font-semibold ${
                  step.done
                    ? 'bg-surface-container-high text-primary'
                    : 'bg-primary-fixed text-primary'
                }`}
              >
                {step.done ? '완료' : '진행'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Delight & Habit Journal Card */}
      <section className="relative overflow-hidden rounded-2xl bg-surface-container-low p-5 shadow-[0_4px_20px_-2px_rgba(46,107,86,0.06)] border border-surface-container/60 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary text-3xl shadow-xs shrink-0 select-none">
          🌱
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-label-sm text-label-sm text-secondary font-bold">
            오늘의 몰입 확언
          </span>
          <p className="font-body-sm text-body-sm text-on-surface italic mt-0.5">
            "오늘의 20분 몰입이 내일의 더 단단하고 여유로운 나를 만듭니다."
          </p>
        </div>
      </section>

      {/* Complete Routine Bottom CTA Section */}
      <div className="pt-2 pb-6">
        <button
          type="button"
          onClick={handleCompleteCTA}
          className={`w-full h-14 rounded-full font-label-lg text-label-lg active:scale-98 transition-all shadow-[0_12px_32px_-4px_rgba(16,83,63,0.25)] flex items-center justify-center gap-2 font-bold ${
            completedFeedback
              ? 'bg-secondary text-on-secondary shadow-lg'
              : 'bg-primary hover:bg-primary-container text-on-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            {completedFeedback ? 'celebration' : 'check_circle'}
          </span>
          <span>
            {completedFeedback
              ? '루틴 완료 및 기록이 저장되었습니다! 🎉'
              : '루틴 완료하고 기록 저장하기 (+50XP)'}
          </span>
        </button>
      </div>
    </div>
  );
};
