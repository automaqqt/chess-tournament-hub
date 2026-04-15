import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a UTC Date as a datetime-local string in Europe/Berlin timezone.
 * Use this when populating datetime-local inputs with existing dates from the DB.
 */
export function formatDateForInput(date: Date | string): string {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Parses a datetime-local input value (e.g. "2026-05-10T17:15") as Europe/Berlin time.
 * datetime-local inputs have no timezone info, so we need to interpret them
 * in the intended timezone before storing as UTC.
 */
export function parseDateAsBerlin(dateStr: string): Date {
  // dateStr is like "2026-05-10T17:15" from a datetime-local input
  // We need to find the UTC offset for Europe/Berlin at that specific date/time
  // First, parse as if it were UTC to get a rough Date
  const naive = new Date(dateStr);

  // Format that date in Europe/Berlin to find the offset
  const berlinParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(naive);

  const get = (type: string) => berlinParts.find(p => p.type === type)!.value;
  const berlinDate = new Date(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`);
  const offsetMs = berlinDate.getTime() - naive.getTime();

  // The user's input represents Berlin time, so subtract the offset to get UTC
  return new Date(naive.getTime() - offsetMs);
}

/**
 * Formats event date range in German locale
 * - No end date: "Do., 15. Jan. 2025, 19:30"
 * - Same day: "Do., 15. Jan. 2025, von 19:30 bis 22:00"
 * - Multi-day: "von 15. Jan. 2025, 19:30 bis 16. Jan. 2025, 14:00"
 */
export function formatEventDateRange(startDate: Date, endDate?: Date | null): string {
  const tz = 'Europe/Berlin';
  const start = new Date(startDate);

  if (!endDate) {
    return start.toLocaleDateString('de-DE', {
      timeZone: tz,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const end = new Date(endDate);
  const isSameDay = start.toLocaleDateString('de-DE', { timeZone: tz }) === end.toLocaleDateString('de-DE', { timeZone: tz });

  if (isSameDay) {
    const dateStr = start.toLocaleDateString('de-DE', {
      timeZone: tz,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const startTime = start.toLocaleTimeString('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
    return `${dateStr}, von ${startTime} bis ${endTime}`;
  } else {
    const startStr = start.toLocaleDateString('de-DE', {
      timeZone: tz,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const endStr = end.toLocaleDateString('de-DE', {
      timeZone: tz,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `von ${startStr} bis ${endStr}`;
  }
}
