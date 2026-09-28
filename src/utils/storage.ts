import type { Routine, RoutineLog, DailyReview, Category, SleepLog } from '../types/routine';
import {
  INITIAL_CATEGORIES,
  INITIAL_ROUTINES,
  getInitialSampleLogs,
  getInitialSampleSleepLogs,
} from '../constants/initialData';

const KEYS = {
  ROUTINES: 'myroutine_routines_v2',
  LOGS: 'myroutine_logs_v2',
  REVIEWS: 'myroutine_reviews_v2',
  CATEGORIES: 'myroutine_categories_v2',
  SLEEP: 'myroutine_sleep_v2',
};

export const getStoredCategories = (): Category[] => {
  try {
    const raw = localStorage.getItem(KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CATEGORIES;
  }
};

export const saveStoredCategories = (categories: Category[]): void => {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
};

export const getStoredRoutines = (): Routine[] => {
  try {
    const raw = localStorage.getItem(KEYS.ROUTINES);
    if (!raw) {
      localStorage.setItem(KEYS.ROUTINES, JSON.stringify(INITIAL_ROUTINES));
      return INITIAL_ROUTINES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ROUTINES;
  }
};

export const saveStoredRoutines = (routines: Routine[]): void => {
  localStorage.setItem(KEYS.ROUTINES, JSON.stringify(routines));
};

export const getStoredLogs = (): RoutineLog[] => {
  try {
    const raw = localStorage.getItem(KEYS.LOGS);
    if (!raw) {
      const { logs } = getInitialSampleLogs();
      localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
      return logs;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredLogs = (logs: RoutineLog[]): void => {
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
};

export const getStoredReviews = (): DailyReview[] => {
  try {
    const raw = localStorage.getItem(KEYS.REVIEWS);
    if (!raw) {
      const { reviews } = getInitialSampleLogs();
      localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
      return reviews;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredReviews = (reviews: DailyReview[]): void => {
  localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
};

export const getStoredSleepLogs = (): SleepLog[] => {
  try {
    const raw = localStorage.getItem(KEYS.SLEEP);
    if (!raw) {
      const sample = getInitialSampleSleepLogs();
      localStorage.setItem(KEYS.SLEEP, JSON.stringify(sample));
      return sample;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredSleepLogs = (sleepLogs: SleepLog[]): void => {
  localStorage.setItem(KEYS.SLEEP, JSON.stringify(sleepLogs));
};

// Export all user data as JSON file download
export const exportDataAsJson = (): void => {
  const data = {
    version: '2.1',
    exportedAt: new Date().toISOString(),
    categories: getStoredCategories(),
    routines: getStoredRoutines(),
    logs: getStoredLogs(),
    reviews: getStoredReviews(),
    sleep: getStoredSleepLogs(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `myroutine-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Import backup JSON
export const importDataFromJson = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.routines && Array.isArray(parsed.routines)) {
      saveStoredRoutines(parsed.routines);
    }
    if (parsed.logs && Array.isArray(parsed.logs)) {
      saveStoredLogs(parsed.logs);
    }
    if (parsed.reviews && Array.isArray(parsed.reviews)) {
      saveStoredReviews(parsed.reviews);
    }
    if (parsed.categories && Array.isArray(parsed.categories)) {
      saveStoredCategories(parsed.categories);
    }
    if (parsed.sleep && Array.isArray(parsed.sleep)) {
      saveStoredSleepLogs(parsed.sleep);
    }
    return true;
  } catch (err) {
    console.error('Import failed:', err);
    return false;
  }
};

// Reset to initial sample state
export const resetToSampleData = (): void => {
  const { logs, reviews } = getInitialSampleLogs();
  const sleep = getInitialSampleSleepLogs();
  saveStoredCategories(INITIAL_CATEGORIES);
  saveStoredRoutines(INITIAL_ROUTINES);
  saveStoredLogs(logs);
  saveStoredReviews(reviews);
  saveStoredSleepLogs(sleep);
};
