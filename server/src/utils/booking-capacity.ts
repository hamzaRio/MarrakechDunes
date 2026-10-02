export async function hasCapacityForBooking(
  activity: any,
  activityId: string,
  date: Date,
  people: number,
  storage: { getBookingsForActivityOnDate: (activityId: string, date: Date) => Promise<any[]> },
): Promise<boolean> {
  const settings = activity?.capacitySettings;
  const capacityLimit = typeof settings?.maxParticipants === 'number'
    ? settings.maxParticipants
    : typeof activity?.maxParticipants === 'number' ? activity.maxParticipants : null;
  if (capacityLimit == null || capacityLimit <= 0) return true;
  const overbookingLimit = settings?.overbookingAllowed ? Number(settings.overbookingLimit) || 0 : 0;
  const confirmed = await storage.getBookingsForActivityOnDate(activityId, date);
  const occupied = confirmed.reduce((sum, booking) => sum + (Number(booking.numberOfPeople) || 0), 0);
  return occupied + people <= capacityLimit + overbookingLimit;
}
