import React, { useState, useEffect } from 'react';
import type { Routine, Category, TimeOfDay, RepeatType, RoutinePriority } from '../../types/routine';
import { Clock, Trash2, Calendar, Star, Lock } from 'lucide-react';
import { toDateKey } from '../../utils/dateUtils';
import { ConfirmModal } from '../common/ConfirmModal';
import { useLanguage, getDayNamesForLanguage } from '../../utils/i18n';

interface RoutineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialRoutine?: Partial<Routine> | null;
  defaultTimeOfDay?: TimeOfDay;
  onSave: (routineData: Omit<Routine, 'id' | 'createdAt' | 'order'>, existingId?: string) => void;
  onDelete?: (routineId: string) => void;
}

const COMMON_EMOJIS = ['💧', '🏃', '📚', '🧘', '💊', '🥗', '☕', '✨', '📝', '💪', '🚶', '🌱', '💤', '🎯', '🧴', '👗', '💰'];

export const RoutineFormModal: React.FC<RoutineFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialRoutine,
  defaultTimeOfDay = 'morning',
  onSave,
  onDelete,
}) => {
  const { t, language } = useLanguage();
  const dayNames = getDayNamesForLanguage(language);

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'life');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(defaultTimeOfDay);
  const [reminderTime, setReminderTime] = useState('');
  const [repeatType, setRepeatType] = useState<RepeatType>('daily');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [targetCountPerWeek, setTargetCountPerWeek] = useState(3);
  const [startDate, setStartDate] = useState(toDateKey());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<RoutinePriority>('medium');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialRoutine) {
      setTitle(initialRoutine.title || '');
      setEmoji(initialRoutine.emoji || '✨');
      setCategoryId(initialRoutine.categoryId || categories[0]?.id || 'life');
      setTimeOfDay(initialRoutine.timeOfDay || defaultTimeOfDay);
      setReminderTime(initialRoutine.reminderTime || '');
      setRepeatType(initialRoutine.repeatType || 'daily');
      setRepeatDays(initialRoutine.repeatDays || [1, 2, 3, 4, 5]);
      setTargetCountPerWeek(initialRoutine.targetCountPerWeek || 3);
      setStartDate(
        initialRoutine.startDate ||
          (initialRoutine.createdAt ? toDateKey(new Date(initialRoutine.createdAt)) : toDateKey())
      );
      if (initialRoutine.endDate) {
        setHasEndDate(true);
        setEndDate(initialRoutine.endDate);
      } else {
        setHasEndDate(false);
        setEndDate('');
      }
      setPriority(initialRoutine.priority || 'medium');
      setIsPrivate(Boolean(initialRoutine.isPrivate));
    } else {
      setTitle('');
      setEmoji('💧');
      setCategoryId(categories[0]?.id || 'life');
      setTimeOfDay(defaultTimeOfDay);
      setReminderTime('');
      setRepeatType('daily');
      setRepeatDays([1, 2, 3, 4, 5]);
      setTargetCountPerWeek(3);
      setStartDate(toDateKey());
      setHasEndDate(false);
      setEndDate('');
      setPriority('medium');
      setIsPrivate(false);
    }
  }, [initialRoutine, categories, defaultTimeOfDay, isOpen]);

  if (!isOpen) return null;

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
        startDate: startDate || toDateKey(),
        endDate: hasEndDate && endDate ? endDate : undefined, // Optional endDate (Request 1)
        priority,
        isPrivate,
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
    /* Full-Page Native View Experience (User Request 4: 팝업 대신 페이지 형태로 만들어 가독성 향상) */
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto animate-fadeIn select-none">
      {/* Sticky Top Bar with Back and Save button */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3.5 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>{t.common?.back || '돌아가기'}</span>
          </button>

          <h2 className="text-base font-black text-slate-900">
            {initialRoutine ? (t.routineForm?.editTitle || '습관 수정하기') : (t.routineForm?.createTitle || '새로운 습관 만들기')}
          </h2>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-1.5 rounded-full bg-primary hover:bg-blue-700 text-white font-black text-xs shadow-xs cursor-pointer active:scale-95 transition"
          >
            {t.common?.save || '저장'}
          </button>
        </div>
      </header>

      {/* Main Page Form Body */}
      <main className="max-w-md mx-auto w-full p-4 flex-1 pb-20">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Emoji & Routine Title */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-sm font-extrabold text-[#0f2e7a] mb-2">
              {t.routineForm?.nameSection || '습관 아이콘 & 이름'}
            </label>
            <div className="flex items-center gap-2.5 w-full">
              <div className="relative shrink-0">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                  className="w-14 h-12 text-center text-lg rounded-xl border border-slate-200/90 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 shadow-2xs font-normal"
                  maxLength={2}
                />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.routineForm?.namePlaceholder || '예: 물 한 잔 마시기, 30분 독서'}
                className="flex-1 min-w-0 h-12 px-3.5 rounded-xl border border-slate-200/90 bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 shadow-2xs"
                required
                autoFocus={!initialRoutine}
              />
            </div>

            {/* Quick Emoji Presets */}
            <div className="flex gap-1.5 flex-wrap mt-3 pt-2 border-t border-slate-200/60">
              {COMMON_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition active:scale-95 cursor-pointer ${
                    emoji === e ? 'bg-blue-100 ring-2 ring-primary' : 'hover:bg-slate-200/60'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Category Selector */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-sm font-extrabold text-[#0f2e7a] mb-2">
              {t.routineForm?.categorySection || '카테고리 선택'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                const getLocalizedCatName = (c: Category) => {
                  const id = (c.id || '').toLowerCase();
                  const n = (c.name || '').trim();
                  if (language === 'en') {
                    if (id.includes('health') || n.includes('운동') || n.includes('건강')) return 'Workout & Health';
                    if (id.includes('growth') || id.includes('study') || n.includes('공부') || n.includes('자기계발')) return 'Study & Growth';
                    if (id.includes('life') || n.includes('생활') || n.includes('습관')) return 'Daily & Habits';
                    if (id.includes('mind') || n.includes('마음') || n.includes('멘탈')) return 'Mind & Mental';
                    if (id.includes('hobby') || n.includes('취미') || n.includes('힐링')) return 'Hobby & Healing';
                    return c.name;
                  }
                  if (language === 'ja') {
                    if (id.includes('health') || n.includes('운동') || n.includes('건강')) return '運動・健康';
                    if (id.includes('growth') || id.includes('study') || n.includes('공부') || n.includes('자기계발')) return '勉強・自己啓発';
                    if (id.includes('life') || n.includes('생활') || n.includes('습관')) return '生活・習慣';
                    if (id.includes('mind') || n.includes('마음') || n.includes('멘탈')) return '心・メンタル';
                    if (id.includes('hobby') || n.includes('취미') || n.includes('힐링')) return '趣味・癒し';
                    return c.name;
                  }
                  return c.name;
                };

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`min-h-[46px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer active:scale-95 text-center ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/90 text-blue-950 shadow-2xs font-black ring-2 ring-blue-500/30'
                        : 'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base shrink-0">{cat.emoji}</span>
                    <span className="break-keep leading-tight">{getLocalizedCatName(cat)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Time of Day Blocks */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-sm font-extrabold text-[#0f2e7a] mb-2">
              {t.routineForm?.timeSection || '실천 시간대'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'morning', label: t.routineForm?.timeMorning || '오전', sub: '06:00~' },
                { id: 'afternoon', label: t.routineForm?.timeAfternoon || '낮', sub: '12:00~' },
                { id: 'night', label: t.routineForm?.timeNight || '저녁/밤', sub: '18:00~' },
                { id: 'anytime', label: t.routineForm?.timeAnytime || '상시', sub: language === 'en' ? 'Anytime' : language === 'ja' ? 'いつでも' : '언제나' },
              ].map((item) => {
                const isSelected = timeOfDay === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTimeOfDay(item.id as TimeOfDay)}
                    className={`py-2 rounded-xl text-center border transition flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black">{item.label}</span>
                    <span className="text-xs text-slate-400 mt-0.5">{item.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Reminder Time Notification (알림 시간) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-extrabold text-[#0f2e7a] flex items-center gap-1.5">
                <Clock size={16} className="text-primary" />
                <span>{t.routineForm?.reminderSection || '알림 리마인더 (선택)'}</span>
              </label>
              {reminderTime && (
                <button
                  type="button"
                  onClick={() => setReminderTime('')}
                  className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  {language === 'en' ? 'Clear' : language === 'ja' ? '通知解除' : '알림 지우기'}
                </button>
              )}
            </div>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-white text-sm font-bold text-slate-800 shadow-2xs focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed break-keep">
              {language === 'en'
                ? 'Gently notifies you at the set time on this device.'
                : language === 'ja'
                ? '設定した時間になるとアプリ上でお知らせします。'
                : '지정한 시간이 되면 브라우저 및 앱 상단에서 부드럽게 실천을 알려드립니다.'}
            </p>
          </div>

          {/* 5. Repeat Schedule */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-sm font-extrabold text-[#0f2e7a] mb-2">
              {t.routineForm?.repeatSection || '반복 주기'}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { id: 'daily', label: t.routineForm?.repeatDaily || '매일 실천' },
                { id: 'weekly_days', label: t.routineForm?.repeatWeeklyDays || '특정 요일' },
                { id: 'weekly_count', label: t.routineForm?.repeatWeeklyCount || '주 N회' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRepeatType(item.id as RepeatType)}
                  className={`h-10 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 ${
                    repeatType === item.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs font-black'
                      : 'border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Repeat Day Selector for 'weekly_days' */}
            {repeatType === 'weekly_days' && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="block text-xs text-slate-500 font-bold mb-2">
                  {language === 'en' ? 'Select active days' : language === 'ja' ? '実践する曜日を選択' : '실천할 요일을 선택하세요'}
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {dayNames.map((name, idx) => {
                    const isSelected = repeatDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`h-9 rounded-xl text-xs font-black border transition cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Target Count Selector for 'weekly_count' */}
            {repeatType === 'weekly_count' && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {language === 'en' ? 'How many times per week?' : language === 'ja' ? '週に何回実践しますか？' : '일주일에 몇 번 실천할까요?'}
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setTargetCountPerWeek(count)}
                      className={`w-8 h-8 rounded-lg text-xs font-black border transition cursor-pointer ${
                        targetCountPerWeek === count
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 6. Start Date & Optional End Date */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-sm font-extrabold text-[#0f2e7a] flex items-center gap-1.5">
              <Calendar size={16} className="text-primary" />
              <span>{t.routineForm?.periodSection || '습관 실천 기간 설정'}</span>
            </label>

            {/* Start Date */}
            <div>
              <span className="block text-xs font-bold text-slate-500 mb-1">
                {t.routineForm?.startDate || '시작일'} {language === 'en' ? '(Habit active from this date)' : language === 'ja' ? '(この日から表示されます)' : '(이 날짜부터 습관이 표시됩니다)'}
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-white text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Optional End Date Toggle & Input */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">
                  {t.routineForm?.endDate || '종료일 설정'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !hasEndDate;
                    setHasEndDate(next);
                    if (!next) setEndDate('');
                    else if (!endDate) setEndDate(toDateKey());
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-black transition cursor-pointer ${
                    hasEndDate
                      ? 'bg-primary text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {hasEndDate
                    ? (language === 'en' ? 'End date enabled' : language === 'ja' ? '終了日あり' : '종료일 사용 중')
                    : (language === 'en' ? 'No end date (Continuous)' : language === 'ja' ? '終了日なし (継続)' : '종료일 없음 (계속 반복)')}
                </button>
              </div>

              {hasEndDate ? (
                <div className="mt-2">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-white text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-slate-500 mt-1 break-keep">
                    {language === 'en'
                      ? '* The routine continues until the set end date and will no longer show afterwards.'
                      : language === 'ja'
                      ? '* 設定した終了日まで続き、以降は一覧に表示されなくなります。'
                      : '* 설정한 종료일까지 습관이 진행되며, 종료일 이후에는 습관 목록에 더 이상 나타나지 않습니다.'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1 break-keep">
                  {language === 'en'
                    ? 'Repeats continuously on the chosen schedule.'
                    : language === 'ja'
                    ? '終了日がない場合、設定したスケジュールで継続します。'
                    : '종료일이 없으면 매일 또는 설정한 요일마다 계속 반복됩니다.'}
                </p>
              )}
            </div>
          </div>

          {/* 7. Priority & Privacy Options */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div>
              <label className="block text-sm font-extrabold text-[#0f2e7a] mb-2 flex items-center gap-1.5">
                <Star size={16} className="text-amber-500" />
                <span>{t.routineForm?.prioritySection || '우선순위'}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'high', label: t.routineForm?.priorityHigh || '⭐ 중요', desc: language === 'en' ? 'Top' : language === 'ja' ? '最優先' : '상단 우선' },
                  { id: 'medium', label: t.routineForm?.priorityMedium || '🌱 보통', desc: language === 'en' ? 'Normal' : language === 'ja' ? '通常' : '일반 습관' },
                  { id: 'low', label: t.routineForm?.priorityLow || '☕ 선택', desc: language === 'en' ? 'Flexible' : language === 'ja' ? '気楽に' : '여유있게' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPriority(item.id as RoutinePriority)}
                    className={`py-2 rounded-xl text-center border transition flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                      priority === item.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs font-black'
                        : 'border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-xs text-slate-400 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Private Routine Toggle */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">{t.routineForm?.privateSection || '비공개 습관'}</span>
                  <span className="text-xs text-slate-400">{t.routineForm?.privateDesc || '타인에게 이 습관을 숨깁니다'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate((prev) => !prev)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center cursor-pointer ${
                  isPrivate ? 'bg-primary justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-xs"></div>
              </button>
            </div>
          </div>

          {/* Delete Routine (Only in edit mode) */}
          {initialRoutine && initialRoutine.id && onDelete && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 size={16} />
                <span>{t.routineForm?.deleteBtn || '이 습관을 삭제하기'}</span>
              </button>
            </div>
          )}
        </form>
      </main>

      {/* Routine Safe Delete Confirmation Dialog */}
      {initialRoutine && initialRoutine.id && onDelete && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          itemName={initialRoutine.title}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDelete(initialRoutine.id!);
            onClose();
          }}
        />
      )}
    </div>
  );
};
