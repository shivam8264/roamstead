/**
 * Date helpers that work on local calendar dates (YYYY-MM-DD) and never on
 * UTC timestamps, so a date picked in India stays the same date everywhere.
 */

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(): string {
  return toIso(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = fromIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = fromIso(checkOut).getTime() - fromIso(checkIn).getTime();
  return Math.round(ms / 86_400_000);
}

export function isValidIso(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(fromIso(value).getTime());
}

/**
 * Client-side mirror of the backend rules, used only to give instant feedback.
 * The backend re-checks everything and is the source of truth.
 */
export function stayProblem(checkIn: string | null, checkOut: string | null): string | null {
  if (!checkIn || !checkOut) return 'Select both a check-in and a check-out date.';
  if (checkIn < todayIso()) return 'Check-in cannot be in the past.';
  if (checkOut <= checkIn) return 'Check-out must be at least one day after check-in.';
  if (nightsBetween(checkIn, checkOut) > 30) return 'A single booking can cover at most 30 nights.';
  return null;
}
