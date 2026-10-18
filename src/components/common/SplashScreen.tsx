import React, { useState, useEffect } from 'react';
import { MOBIT_IMAGES } from '../character/mobitImages';

interface SplashScreenProps {
  onFinish?: () => void;
  minDisplayTimeMs?: number;
}

// Module-level guard to ensure single execution per session
let hasSplashRun = false;

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDisplayTimeMs = 700,
}) => {
  const [isVisible, setIsVisible] = useState(!hasSplashRun);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (hasSplashRun) {
      if (onFinish) onFinish();
      return;
    }

    const timer = setTimeout(() => {
      setIsFading(true);
      const finishTimer = setTimeout(() => {
        hasSplashRun = true;
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 250);
      return () => clearTimeout(finishTimer);
    }, minDisplayTimeMs);

    return () => clearTimeout(timer);
  }, [minDisplayTimeMs, onFinish]);

  if (!isVisible || hasSplashRun) return null;

  return (
    // index.html 의 정적 스플래시와 동일한 레이아웃 — 바뀌어도 한 화면처럼 이어짐
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-[18px] bg-white select-none transition-opacity duration-250 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="MoreHabit"
    >
      <img
        src={MOBIT_IMAGES.default}
        alt=""
        width={128}
        height={150}
        className="w-[128px] h-[150px] object-contain"
        draggable={false}
      />
      <h1
        className="text-xl font-extrabold tracking-[-0.02em] text-primary leading-none"
      >
        MoreHabit
      </h1>
    </div>
  );
};
