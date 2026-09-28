import React, { useState, useEffect } from 'react';
import type { DailyReview, MoodType } from '../../types/routine';
import { BookOpen, Check } from 'lucide-react';


interface DailyReflectionProps {
  dateKey: string;
  review?: DailyReview;
  onSaveReview: (dateKey: string, mood?: MoodType, note?: string) => void;
}

const MOODS: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'great', emoji: '🥰', label: '최고' },
  { type: 'good', emoji: '😊', label: '좋음' },
  { type: 'normal', emoji: '🙂', label: '보통' },
  { type: 'tired', emoji: '🥱', label: '피곤' },
  { type: 'bad', emoji: '🌧️', label: '지침' },
];

export const DailyReflection: React.FC<DailyReflectionProps> = ({
  dateKey,
  review,
  onSaveReview,
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>(review?.mood);
  const [note, setNote] = useState(review?.note || '');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    setSelectedMood(review?.mood);
    setNote(review?.note || '');
  }, [review, dateKey]);

  const handleSave = () => {
    onSaveReview(dateKey, selectedMood, note.trim());
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleMoodSelect = (mood: MoodType) => {
    const newMood = selectedMood === mood ? undefined : mood;
    setSelectedMood(newMood);
    onSaveReview(dateKey, newMood, note.trim());
  };

  return (
    <div className="bg-[#FBF2ED] rounded-3xl p-4.5 shadow-2xs border border-[#E9E1DC]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#EBF2E4] text-[#455538] flex items-center justify-center">
            <BookOpen size={14} />
          </div>
          <h3 className="font-serif font-bold text-sm text-[#1E1B18] tracking-tight">
            오늘의 하루 회고 & 기분
          </h3>
        </div>

        {/* Mood Selector */}
        <div className="flex items-center gap-1">
          {MOODS.map((m) => {
            const isSelected = selectedMood === m.type;
            return (
              <button
                key={m.type}
                type="button"
                onClick={() => handleMoodSelect(m.type)}
                className={`w-7 h-7 rounded-xl text-base flex items-center justify-center transition active:scale-90 ${
                  isSelected
                    ? 'bg-[#EBF2E4] border border-[#455538] scale-110 shadow-xs'
                    : 'hover:bg-white/60 opacity-60 hover:opacity-100'
                }`}
                title={m.label}
              >
                {m.emoji}
              </button>
            );
          })}
        </div>
      </div>

      {/* Note input */}
      <div className="relative">
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="오늘 하루는 어땠나요? 사소한 성취나 감사한 순간을 기록해보세요."
          className="w-full text-xs p-3 rounded-2xl border border-[#E9E1DC] bg-white focus:outline-none focus:ring-2 focus:ring-[#455538]/20 focus:border-[#455538] text-[#1E1B18] placeholder-[#75786F] transition"
        />

        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[10px] text-[#75786F]">
            {isSavedRecently ? (
              <span className="text-[#455538] font-bold flex items-center gap-1">
                <Check size={11} /> 저장되었습니다
              </span>
            ) : (
              '입력 후 저장을 눌러주세요'
            )}
          </span>

          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-[#455538] hover:bg-[#38462D] text-white rounded-xl text-xs font-bold shadow-2xs transition active:scale-95"
          >
            저장
          </button>
        </div>
      </div>
    </div>

  );
};
