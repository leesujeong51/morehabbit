import React from 'react';
import type { Category, RepeatType, TimeOfDay } from '../../types/routine';
import { Sparkles, Sun, Sunset, Moon, Calendar } from 'lucide-react';
import { useLanguage, getDayNamesForLanguage } from '../../utils/i18n';

interface CategoryBadgeProps {
  category?: Category;
  size?: 'sm' | 'md';
}

const CATEGORY_LOCALES: Record<string, { en: string; ja: string }> = {
  health: { en: 'Health & Workout', ja: '運動・健康' },
  growth: { en: 'Study & Growth', ja: '勉強・自己啓発' },
  life: { en: 'Daily & Habits', ja: '生活・習慣' },
  mind: { en: 'Mind & Mental', ja: '心・メンタル' },
  hobby: { en: 'Hobby & Healing', ja: '趣味・癒し' },
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'sm' }) => {
  const { language } = useLanguage();
  if (!category) return null;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const categoryName =
    language === 'en'
      ? CATEGORY_LOCALES[category.id]?.en || category.name
      : language === 'ja'
      ? CATEGORY_LOCALES[category.id]?.ja || category.name
      : category.name;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: category.bgLight,
        color: category.textDark,
      }}
    >
      <span>{category.emoji}</span>
      <span>{categoryName}</span>
    </span>
  );
};

export const TimeBadge: React.FC<{ timeOfDay: TimeOfDay; time?: string }> = ({
  timeOfDay,
  time,
}) => {
  const { language } = useLanguage();

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
    if (language === 'en') {
      switch (timeOfDay) {
        case 'morning':
          return 'Morning';
        case 'afternoon':
          return 'Afternoon';
        case 'evening':
          return 'Evening';
        case 'night':
          return 'Night';
        default:
          return 'Anytime';
      }
    }
    if (language === 'ja') {
      switch (timeOfDay) {
        case 'morning':
          return '朝';
        case 'afternoon':
          return '昼';
        case 'evening':
          return '夕方';
        case 'night':
          return '夜';
        default:
          return 'いつでも';
      }
    }
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
          <span className="tabular-nums text-neutral-600">{time}</span>
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
  const { language } = useLanguage();

  const formatText = () => {
    if (repeatType === 'daily') {
      return language === 'en' ? 'Daily' : language === 'ja' ? '毎日' : '매일';
    }
    if (repeatType === 'weekly_days') {
      if (!repeatDays || repeatDays.length === 0) {
        return language === 'en' ? 'Days' : language === 'ja' ? '曜日指定' : '요일별';
      }
      if (repeatDays.length === 5 && !repeatDays.includes(0) && !repeatDays.includes(6)) {
        return language === 'en' ? 'Weekdays' : language === 'ja' ? '平日' : '평일';
      }
      if (repeatDays.length === 2 && repeatDays.includes(0) && repeatDays.includes(6)) {
        return language === 'en' ? 'Weekends' : language === 'ja' ? '週末' : '주말';
      }
      const dayNames = getDayNamesForLanguage(language);
      return repeatDays.map((d) => dayNames[d]).join('·');
    }
    if (repeatType === 'weekly_count') {
      return language === 'en'
        ? `${targetCount || 1}x/week`
        : language === 'ja'
        ? `週${targetCount || 1}回`
        : `주 ${targetCount || 1}회`;
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
