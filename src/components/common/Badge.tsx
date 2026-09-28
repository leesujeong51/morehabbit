import React from 'react';
import type { Category, RepeatType, TimeOfDay } from '../../types/routine';
import { Sparkles, Sun, Sunset, Moon, Calendar } from 'lucide-react';


interface CategoryBadgeProps {
  category?: Category;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'sm' }) => {
  if (!category) return null;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: category.bgLight,
        color: category.textDark,
      }}
    >
      <span>{category.emoji}</span>
      <span>{category.name}</span>
    </span>
  );
};

export const TimeBadge: React.FC<{ timeOfDay: TimeOfDay; time?: string }> = ({
  timeOfDay,
  time,
}) => {
  const getIcon = () => {
    switch (timeOfDay) {
      case 'morning':
        return <Sun size={12} className="text-amber-500" />;
      case 'afternoon':
        return <Sun size={12} className="text-orange-500" />;
      case 'evening':
        return <Sunset size={12} className="text-indigo-400" />;
      case 'night':
        return <Moon size={12} className="text-purple-400" />;
      default:
        return <Sparkles size={12} className="text-emerald-500" />;
    }
  };

  const getLabel = () => {
    switch (timeOfDay) {
      case 'morning':
        return '아침';
      case 'afternoon':
        return '낮';
      case 'evening':
        return '저녁';
      case 'night':
        return '밤';
      default:
        return '언제나';
    }
  };

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 bg-neutral-100/80 px-2 py-0.5 rounded-full">
      {getIcon()}
      <span>{getLabel()}</span>
      {time && (
        <>
          <span className="text-neutral-300">•</span>
          <span className="font-mono text-neutral-600">{time}</span>
        </>
      )}
    </span>
  );
};

export const RepeatBadge: React.FC<{
  repeatType: RepeatType;
  repeatDays?: number[];
  targetCount?: number;
}> = ({ repeatType, repeatDays, targetCount }) => {
  const formatText = () => {
    if (repeatType === 'daily') return '매일';
    if (repeatType === 'weekly_days') {
      if (!repeatDays || repeatDays.length === 0) return '요일별';
      if (repeatDays.length === 5 && !repeatDays.includes(0) && !repeatDays.includes(6)) {
        return '평일';
      }
      if (repeatDays.length === 2 && repeatDays.includes(0) && repeatDays.includes(6)) {
        return '주말';
      }
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      return repeatDays.map((d) => dayNames[d]).join('·');
    }
    if (repeatType === 'weekly_count') {
      return `주 ${targetCount || 1}회`;
    }
    return '';
  };

  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
      <Calendar size={11} className="text-neutral-400" />
      <span>{formatText()}</span>
    </span>
  );
};
