import { toDateKey } from './dateUtils';

export interface PomodoroSessionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number; // 25
  completedAt: string; // HH:mm
  cycle: number; // 1 ~ 4
  strictMode: boolean;
  routineTitle?: string;
}

const STORAGE_KEYS = {
  RECORDS: 'morehabbit_pomodoro_records_v1',
  STRICT_MODE: 'morehabbit_strict_mode',
  SOUND_PREF: 'morehabbit_sound_pref',
};

// Initial sample records so statistics have meaningful history
const getInitialRecords = (): PomodoroSessionRecord[] => {
  const today = toDateKey();
  return [
    {
      id: 'pomo-sample-1',
      date: today,
      durationMinutes: 25,
      completedAt: '09:30',
      cycle: 1,
      strictMode: false,
      routineTitle: '오전 핵심 업무 몰입',
    },
    {
      id: 'pomo-sample-2',
      date: today,
      durationMinutes: 25,
      completedAt: '11:15',
      cycle: 2,
      strictMode: true,
      routineTitle: '독서 및 학습',
    },
  ];
};

export const getStoredPomodoroRecords = (): PomodoroSessionRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) {
      const initial = getInitialRecords();
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialRecords();
  }
};

export const savePomodoroRecord = (
  record: Omit<PomodoroSessionRecord, 'id'>
): PomodoroSessionRecord => {
  const newRecord: PomodoroSessionRecord = {
    ...record,
    id: `pomo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };

  const records = getStoredPomodoroRecords();
  const updated = [newRecord, ...records];
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save pomodoro record', e);
  }
  return newRecord;
};

export const getTodayPomodoroStats = (dateKey: string = toDateKey()) => {
  const records = getStoredPomodoroRecords();
  const todayRecords = records.filter((r) => r.date === dateKey);
  const totalMinutes = todayRecords.reduce((sum, r) => sum + r.durationMinutes, 0);

  return {
    count: todayRecords.length,
    totalMinutes,
    records: todayRecords,
  };
};

export const getWeeklyPomodoroStats = () => {
  const records = getStoredPomodoroRecords();
  const dailyCounts: Record<string, number> = {};
  let totalCount = 0;
  let totalMinutes = 0;

  // Last 7 days
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    dailyCounts[key] = 0;
  }

  records.forEach((r) => {
    if (dailyCounts[r.date] !== undefined) {
      dailyCounts[r.date] += 1;
      totalCount += 1;
      totalMinutes += r.durationMinutes;
    }
  });

  return {
    totalCount,
    totalMinutes,
    dailyCounts,
  };
};

export const getPomodoroStrictMode = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.STRICT_MODE) === 'true';
  } catch {
    return false;
  }
};

export const setPomodoroStrictMode = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STRICT_MODE, enabled ? 'true' : 'false');
  } catch (e) {
    console.error(e);
  }
};
