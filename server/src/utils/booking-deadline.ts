const CASABLANCA = 'Africa/Casablanca';

function offsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: CASABLANCA, timeZoneName: 'longOffset' }).formatToParts(at);
  const value = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT';
  const match = value.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!match) return 0;
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] || 0));
}

/** Converts a Casablanca local date/time to an instant without guessing missing times. */
export function parseCasablancaDateTime(dateOnly: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const naive = new Date(`${dateOnly}T${time}:00.000Z`);
  if (Number.isNaN(naive.getTime())) return null;
  const first = new Date(naive.getTime() - offsetMinutes(naive) * 60000);
  const second = new Date(naive.getTime() - offsetMinutes(first) * 60000);
  return second;
}

export function depositDeadlineFor(dateOnly: string, time?: string): Date | null {
  if (!time) return null;
  const start = parseCasablancaDateTime(dateOnly, time);
  return start ? new Date(start.getTime() - 24 * 60 * 60 * 1000) : null;
}
