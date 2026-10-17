const CASABLANCA = 'Africa/Casablanca';

function offsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: CASABLANCA, timeZoneName: 'longOffset' }).formatToParts(at);
  const value = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT';
  const match = value.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!match) return 0;
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] || 0));
}

function localParts(at: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CASABLANCA, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

/** Converts a Casablanca local date/time to an instant without guessing missing times. */
export function parseCasablancaDateTime(dateOnly: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const naive = new Date(`${dateOnly}T${time}:00.000Z`);
  if (Number.isNaN(naive.getTime())) return null;
  if (naive.toISOString().slice(0, 10) !== dateOnly) return null;
  const first = new Date(naive.getTime() - offsetMinutes(naive) * 60000);
  const second = new Date(naive.getTime() - offsetMinutes(first) * 60000);
  return localParts(second).date === dateOnly && localParts(second).time === time ? second : null;
}

export function depositDeadlineFor(dateOnly: string, time?: string): Date | null {
  if (!time) return null;
  const start = parseCasablancaDateTime(dateOnly, time);
  return start ? new Date(start.getTime() - 24 * 60 * 60 * 1000) : null;
}

export function isBelowRequiredDeposit(totalAmount: unknown, paidAmount: unknown): boolean {
  const total = Number(totalAmount);
  const paid = Number(paidAmount) || 0;
  return Number.isFinite(total) && total > 0 && Number.isFinite(paid) && paid < total * 0.5;
}
