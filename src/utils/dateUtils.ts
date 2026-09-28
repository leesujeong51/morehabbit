import { format, parseISO, isToday as isFnsToday, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export const toDateKey = (date: Date = new Date()): string => {
  return format(date, 'yyyy-MM-dd');
};

export const parseDateKey = (dateKey: string): Date => {
  return parseISO(dateKey);
};

export const isDateToday = (dateKey: string): boolean => {
  return isFnsToday(parseDateKey(dateKey));
};

export const formatDisplayDate = (dateKey: string): string => {
  const date = parseDateKey(dateKey);
  return format(date, 'M월 d일 EEEE', { locale: ko });
};

export const formatShortDisplayDate = (dateKey: string): string => {
  const date = parseDateKey(dateKey);
  return format(date, 'M.d (EEE)', { locale: ko });
};

export const getDayOfWeek = (dateKey: string): number => {
  const date = parseDateKey(dateKey);
  return date.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
};

export const KOREAN_DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export const getDayName = (dayIndex: number): string => {
  return KOREAN_DAY_NAMES[dayIndex % 7];
};

// Get Monday-start week days for a given date
export const getWeekDays = (centerDate: Date): Date[] => {
  const start = startOfWeek(centerDate, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(centerDate, { weekStartsOn: 1 }); // Sunday end
  return eachDayOfInterval({ start, end });
};

export interface WeekDateItem {
  date: Date;
  key: string;
  day: string;
}

export const getWeekDates = (centerDate: Date = new Date()): WeekDateItem[] => {
  const days = getWeekDays(centerDate);
  return days.map((d) => ({
    date: d,
    key: toDateKey(d),
    day: String(d.getDate()),
  }));
};

// Generate an extended date strip around the selected date (e.g. 14 days)
export const getStripDates = (centerDate: Date, daysRange: number = 7): Date[] => {
  const dates: Date[] = [];
  for (let i = -daysRange; i <= daysRange; i++) {
    dates.push(addDays(centerDate, i));
  }
  return dates;
};

// Format time string (e.g., "07:30" -> "오전 07:30")
export const formatTimeDisplay = (time?: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${period} ${displayHours}:${String(minutes).padStart(2, '0')}`;
};
