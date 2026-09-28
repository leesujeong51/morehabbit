import React, { useState, useEffect } from 'react';
import type { Routine, Category, TimeOfDay, RepeatType } from '../../types/routine';
import { Modal } from '../common/Modal';
import { Clock, Check, Trash2 } from 'lucide-react';
import { KOREAN_DAY_NAMES } from '../../utils/dateUtils';

interface RoutineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialRoutine?: Routine | null;
  defaultTimeOfDay?: TimeOfDay;
  onSave: (routineData: Omit<Routine, 'id' | 'createdAt' | 'order'>, existingId?: string) => void;
  onDelete?: (routineId: string) => void;
}

const COMMON_EMOJIS = ['💧', '🏃', '📚', '🧘', '💊', '🥗', '☕', '✨', '📝', '💪', '🚶', '🌱', '💤', '🎯'];

export const RoutineFormModal: React.FC<RoutineFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialRoutine,
  defaultTimeOfDay = 'morning',
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'life');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(defaultTimeOfDay);
  const [reminderTime, setReminderTime] = useState('');
  const [repeatType, setRepeatType] = useState<RepeatType>('daily');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [targetCountPerWeek, setTargetCountPerWeek] = useState(3);

  useEffect(() => {
    if (initialRoutine) {
      setTitle(initialRoutine.title);
      setEmoji(initialRoutine.emoji || '✨');
      setCategoryId(initialRoutine.categoryId);
      setTimeOfDay(initialRoutine.timeOfDay);
      setReminderTime(initialRoutine.reminderTime || '');
      setRepeatType(initialRoutine.repeatType);
      setRepeatDays(initialRoutine.repeatDays || [1, 2, 3, 4, 5]);
      setTargetCountPerWeek(initialRoutine.targetCountPerWeek || 3);
    } else {
      setTitle('');
      setEmoji('💧');
      setCategoryId(categories[0]?.id || 'life');
      setTimeOfDay(defaultTimeOfDay);
      setReminderTime('');
      setRepeatType('daily');
      setRepeatDays([1, 2, 3, 4, 5]);
      setTargetCountPerWeek(3);
    }
  }, [initialRoutine, categories, defaultTimeOfDay, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        title: title.trim(),
        emoji: emoji || '✨',
        categoryId,
        timeOfDay,
        reminderTime: reminderTime.trim() || undefined,
        repeatType,
        repeatDays: repeatType === 'weekly_days' ? repeatDays : undefined,
        targetCountPerWeek: repeatType === 'weekly_count' ? targetCountPerWeek : undefined,
      },
      initialRoutine?.id
    );
    onClose();
  };

  const toggleDay = (dayIndex: number) => {
    if (repeatDays.includes(dayIndex)) {
      if (repeatDays.length > 1) {
        setRepeatDays(repeatDays.filter((d) => d !== dayIndex));
      }
    } else {
      setRepeatDays([...repeatDays, dayIndex].sort());
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRoutine ? '루틴 수정하기' : '새로운 루틴 만들기'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Emoji & Routine Title */}
        <div>
          <label className="block text-[14px] font-extrabold text-[#0f2e7a] mb-2">
            루틴 아이콘 & 이름
          </label>
          <div className="flex gap-2.5">
            <div className="relative">
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                className="w-14 h-12 text-center text-2xl rounded-xl border border-slate-200/90 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 shadow-2xs font-normal"
                maxLength={2}
                title="이모지 변경"
              />
            </div>
            <input
              type="text"
              required
              placeholder="예: 미온수 한 잔, 20분 독서"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 h-12 px-4 rounded-xl border border-slate-200/90 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-[15px] text-slate-900 placeholder:text-slate-400 font-bold shadow-2xs"
            />
          </div>

          {/* Quick emoji presets */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[12px] text-slate-400 font-bold shrink-0">추천:</span>
            {COMMON_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition shrink-0 active:scale-95 ${
                  emoji === em
                    ? 'bg-blue-50 border-2 border-blue-600 shadow-2xs'
                    : 'bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Category Selector */}
        <div>
          <label className="block text-[14px] font-extrabold text-[#0f2e7a] mb-2">
            카테고리
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-[13.5px] font-bold border transition text-left active:scale-98 ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-50 text-blue-900 shadow-2xs font-black'
                      : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                  }`}
                >
                  <span className="text-xl leading-none">{cat.emoji}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Time of Day & Specific Reminder Time */}
        <div>
          <label className="block text-[14px] font-extrabold text-[#0f2e7a] mb-2">
            실천 시간대 & 알림 시간
          </label>
          <div className="grid grid-cols-5 gap-1.5 mb-2.5">
            {[
              { id: 'morning', label: '아침' },
              { id: 'afternoon', label: '낮' },
              { id: 'evening', label: '저녁' },
              { id: 'night', label: '밤' },
              { id: 'anytime', label: '언제나' },
            ].map((t) => {
              const isSelected = timeOfDay === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeOfDay(t.id as TimeOfDay)}
                  className={`h-10 rounded-xl text-[13.5px] font-bold border transition active:scale-95 flex items-center justify-center ${
                    isSelected
                      ? 'bg-[#1d4ed8] border-[#1d4ed8] text-white shadow-xs font-black'
                      : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/90">
            <Clock size={18} className="text-blue-600 shrink-0" />
            <span className="text-[13.5px] text-slate-700 font-bold">목표/알림 시간:</span>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[13.5px] font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
            {reminderTime && (
              <button
                type="button"
                onClick={() => setReminderTime('')}
                className="text-[12px] font-bold text-slate-400 hover:text-slate-600 ml-auto px-2 py-1 rounded-md hover:bg-slate-200/60"
              >
                지우기
              </button>
            )}
          </div>
        </div>

        {/* 4. Repetition settings */}
        <div>
          <label className="block text-[14px] font-extrabold text-[#0f2e7a] mb-2">
            반복 설정
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            {[
              { id: 'daily', label: '매일 반복' },
              { id: 'weekly_days', label: '특정 요일' },
              { id: 'weekly_count', label: '주 N회' },
            ].map((r) => {
              const isSelected = repeatType === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRepeatType(r.id as RepeatType)}
                  className={`h-11 rounded-xl text-[13.5px] font-bold border transition text-center active:scale-95 flex items-center justify-center ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-50 text-blue-900 font-black shadow-2xs'
                      : 'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Specific Days Selector */}
          {repeatType === 'weekly_days' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90">
              <span className="block text-[12.5px] text-slate-600 mb-2.5 font-bold">
                반복할 요일을 선택하세요:
              </span>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                  const isSelected = repeatDays.includes(dayIdx);
                  return (
                    <button
                      key={dayIdx}
                      type="button"
                      onClick={() => toggleDay(dayIdx)}
                      className={`h-10 rounded-xl text-[13.5px] font-extrabold transition flex items-center justify-center active:scale-95 ${
                        isSelected
                          ? 'bg-[#1d4ed8] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-100'
                      }`}
                    >
                      {KOREAN_DAY_NAMES[dayIdx]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly Count Selector */}
          {repeatType === 'weekly_count' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 flex items-center justify-between">
              <span className="text-[13.5px] text-slate-700 font-bold">한 주 목표 달성 횟수:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((count) => {
                  const isSelected = targetCountPerWeek === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setTargetCountPerWeek(count)}
                      className={`w-8 h-8 rounded-xl text-[13.5px] font-extrabold transition active:scale-95 ${
                        isSelected
                          ? 'bg-[#1d4ed8] text-white shadow-xs'
                          : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {count}
                    </button>
                  );
                })}
                <span className="text-[13.5px] text-slate-600 font-bold ml-1">회</span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Submit & Action Buttons */}
        <div className="pt-3 flex items-center justify-between border-t border-slate-100 gap-2">
          <div>
            {initialRoutine && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`'${initialRoutine.title}' 루틴을 정말 삭제하시겠습니까? 관련된 지난 기록은 보존됩니다.`)) {
                    onDelete(initialRoutine.id);
                    onClose();
                  }
                }}
                className="h-11 px-3.5 text-[13px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 border border-rose-200 active:scale-95"
              >
                <Trash2 size={15} />
                <span>루틴 삭제</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 text-[14px] font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition active:scale-95"
            >
              취소
            </button>
            <button
              type="submit"
              className="h-11 px-5 text-[14.5px] font-black bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl shadow-[0_4px_16px_-2px_rgba(29,78,216,0.3)] transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={16} strokeWidth={3} />
              <span>{initialRoutine ? '수정 완료' : '루틴 생성'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
