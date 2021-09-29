export interface Booking {
  time: string;
  duration: number;
  userId: string;
}

export const keys = ['time', 'duration', 'userId'];

export function isBooking(tbd: any): tbd is Booking {
  const checkTime =
    (tbd as Booking).time && typeof (tbd as Booking).time === 'string';
  if (!checkTime) return false;

  const checkDuration =
    (tbd as Booking).duration && typeof (tbd as Booking).duration === 'number';
  if (!checkDuration) return false;

  const checkUserId =
    (tbd as Booking).userId && typeof (tbd as Booking).userId === 'string';
  if (!checkUserId) return false;

  if (Object.keys(tbd).length !== keys.length) return false;

  return true;
}
