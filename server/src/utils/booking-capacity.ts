export const CAPACITY_CONSUMING_STATUSES = ['CONFIRMED', 'COMPLETED'] as const;

export function capacityDateKey(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10);
}

export function isCapacityConsumingStatus(status: unknown): boolean {
  return CAPACITY_CONSUMING_STATUSES.includes(String(status ?? '').toUpperCase() as typeof CAPACITY_CONSUMING_STATUSES[number]);
}

export function capacityLimitForActivity(activity: any): number {
  const settings = activity?.capacitySettings;
  const base = typeof settings?.maxParticipants === 'number'
    ? settings.maxParticipants
    : typeof activity?.maxParticipants === 'number' ? activity.maxParticipants : 0;
  const overbooking = settings?.overbookingAllowed ? Number(settings.overbookingLimit) || 0 : 0;
  return base > 0 ? base + overbooking : 0;
}

export async function hasCapacityForBooking(
  activity: any,
  activityId: string,
  date: Date,
  people: number,
  storage: { getBookingsForActivityOnDate: (activityId: string, date: Date) => Promise<any[]> },
): Promise<boolean> {
  const capacityLimit = capacityLimitForActivity(activity);
  if (capacityLimit <= 0) return true;
  const occupied = (await storage.getBookingsForActivityOnDate(activityId, date))
    .filter((booking) => isCapacityConsumingStatus(booking.status))
    .reduce((sum, booking) => sum + (Number(booking.numberOfPeople) || 0), 0);
  return occupied + people <= capacityLimit;
}
