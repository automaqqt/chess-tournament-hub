import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats event date range in German locale
 * - No end date: "Do., 15. Jan. 2025, 19:30"
 * - Same day: "Do., 15. Jan. 2025, von 19:30 bis 22:00"
 * - Multi-day: "von 15. Jan. 2025, 19:30 bis 16. Jan. 2025, 14:00"
 */
export function formatEventDateRange(startDate: Date, endDate?: Date | null): string {
  const start = new Date(startDate);

  if (!endDate) {
    return start.toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const end = new Date(endDate);
  const isSameDay = start.toDateString() === end.toDateString();

  if (isSameDay) {
    const dateStr = start.toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const startTime = start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}, von ${startTime} bis ${endTime}`;
  } else {
    const startStr = start.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const endStr = end.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `von ${startStr} bis ${endStr}`;
  }
}
