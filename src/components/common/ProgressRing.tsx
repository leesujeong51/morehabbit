import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // width/height in px
  strokeWidth?: number; // thickness in px
  showText?: boolean;
  className?: string;
  color?: string; // hex or css color
  trackColor?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 64,
  strokeWidth = 6,
  showText = true,
  className = '',
  color = '#455538', // Stitch Sage Olive
  trackColor = '#E9E1DC', // Stitch surface container highest
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={normalizedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="transition-colors duration-300"
        />
        {/* Progress fill circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={normalizedProgress === 100 ? '#455538' : color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showText && (
        <span
          className="absolute font-bold text-[#1E1B18]"
          style={{ fontSize: Math.max(10, size * 0.24) }}
        >
          {normalizedProgress}%
        </span>
      )}
    </div>
  );
};

