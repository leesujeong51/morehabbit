import React, { useState, useEffect } from 'react';
import type { SleepLog, SleepQuality } from '../../types/routine';
import { Modal } from '../common/Modal';
import { formatDisplayDate } from '../../utils/dateUtils';

interface SleepRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string;
  currentSleepLog?: SleepLog;
  onSaveSleep: (log: Omit<SleepLog, 'updatedAt'>) => void;
  onDeleteSleep?: (dateKey: string) => void;
}

export const SleepRecordModal: React.FC<SleepRecordModalProps> = ({
  isOpen,
  onClose,
  dateKey,
  currentSleepLog,
  onSaveSleep,
  onDeleteSleep,
}) => {
  const [bedtime, setBedtime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<SleepQuality>('great');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (currentSleepLog) {
      setBedtime(currentSleepLog.bedtime || '23:30');
      setWakeTime(currentSleepLog.wakeTime || '07:00');
      setQuality(currentSleepLog.quality || 'great');
      setNote(currentSleepLog.note || '');
    } else {
      setBedtime('23:30');
      setWakeTime('07:00');
      setQuality('great');
      setNote('');
    }
  }, [currentSleepLog, isOpen]);

  // Calculate sleep duration in minutes (handles overnight crossing)
  const calculateDuration = (bed: string, wake: string): number => {
    const [bH, bM] = bed.split(':').map(Number);
    const [wH, wM] = wake.split(':').map(Number);
    let bedMins = bH * 60 + bM;
    let wakeMins = wH * 60 + wM;

    if (wakeMins < bedMins) {
      // Crossed midnight (e.g. 23:00 to 07:00)
      wakeMins += 24 * 60;
    }
    return Math.max(0, wakeMins - bedMins);
  };

  const durationMinutes = calculateDuration(bedtime, wakeTime);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  const qualityOptions: Array<{
    id: SleepQuality;
    emoji: string;
    label: string;
    desc: string;
  }> = [
    { id: 'great', emoji: '😴', label: '꿀잠', desc: '완전 개운함' },
    { id: 'good', emoji: '🙂', label: '보통', desc: '적당한 수면' },
    { id: 'fair', emoji: '🥱', label: '피곤', desc: '중간에 깸' },
    { id: 'poor', emoji: '😫', label: '설침', desc: '잠을 설침' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSleep({
      date: dateKey,
      bedtime,
      wakeTime,
      durationMinutes,
      quality,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="수면 패턴 기록 🌙"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Display */}
        <div className="bg-surface-container-low px-3 py-2 rounded-xl flex items-center justify-between text-xs">
          <span className="text-on-surface-variant font-medium">기록 날짜</span>
          <span className="text-primary font-bold">{formatDisplayDate(dateKey)}</span>
        </div>

        {/* Total Sleep Time Calculated Badge */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌙</span>
            <div>
              <span className="text-[11px] text-blue-100 font-semibold block leading-tight">
                총 수면 시간
              </span>
              <span className="text-lg font-bold tracking-tight">
                {hours}시간 {minutes > 0 ? `${minutes}분` : ''}
              </span>
            </div>
          </div>
          <span className="text-xs bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full font-semibold">
            {durationMinutes >= 420 ? '권장 수면 충족 ✨' : '조금 부족해요'}
          </span>
        </div>

        {/* Bedtime & Wake time Pickers */}
        <div className="grid grid-cols-2 gap-3">
          {/* Bedtime */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1">
              <span>취침 시간</span>
              <span className="text-secondary">😴</span>
            </label>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container font-bold text-sm text-on-surface focus:outline-none focus:border-primary"
              required
            />
            {/* Quick bedtime presets */}
            <div className="flex gap-1 flex-wrap">
              {['22:30', '23:00', '23:30', '00:00'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBedtime(t)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                    bedtime === t
                      ? 'bg-primary text-white'
                      : 'bg-surface-container text-tertiary hover:bg-surface-container-high'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Wake time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1">
              <span>기상 시간</span>
              <span className="text-primary">☀️</span>
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container font-bold text-sm text-on-surface focus:outline-none focus:border-primary"
              required
            />
            {/* Quick wake time presets */}
            <div className="flex gap-1 flex-wrap">
              {['06:00', '06:30', '07:00', '07:30'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setWakeTime(t)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                    wakeTime === t
                      ? 'bg-primary text-white'
                      : 'bg-surface-container text-tertiary hover:bg-surface-container-high'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sleep Quality Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-on-surface">수면 만족도</label>
          <div className="grid grid-cols-4 gap-1.5">
            {qualityOptions.map((opt) => {
              const isSelected = quality === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setQuality(opt.id)}
                  className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs font-bold ring-2 ring-primary ring-offset-1'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="text-xl mb-0.5">{opt.emoji}</span>
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-on-primary-container' : 'text-tertiary'}`}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-on-surface">
            수면 메모 <span className="text-tertiary font-normal">(선택)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="꿈 내용, 자기 전 컨디션, 수면에 영향을 준 요인 등"
            className="w-full p-3 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface focus:outline-none focus:border-primary resize-none placeholder:text-outline"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {currentSleepLog && onDeleteSleep && (
            <button
              type="button"
              onClick={() => {
                if (confirm('이 날짜의 수면 기록을 삭제하시겠습니까?')) {
                  onDeleteSleep(dateKey);
                  onClose();
                }
              }}
              className="px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition"
            >
              삭제
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-xs font-bold transition"
          >
            취소
          </button>

          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-container text-xs font-bold transition shadow-xs"
          >
            기록 저장하기
          </button>
        </div>
      </form>
    </Modal>
  );
};
