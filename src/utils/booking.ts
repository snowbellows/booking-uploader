import { DateTime } from 'luxon';
import { ok, err, Result } from 'neverthrow';

type ISOTimeStamp = string;
type AdHocTimeStamp = string; // dd MMM yyyy HH:mm:ss 'GMT'ZZZ
type Milliseconds = number;
type Minutes = number;

export interface ServerBooking {
  time: ISOTimeStamp; // ISO DateTime with timezone
  duration: Milliseconds; // milliseconds
  userId: string;
}

export interface InternalBooking {
  time: DateTime;
  duration: Minutes;
  userId: string;
}

export interface CsvBooking {
  time: AdHocTimeStamp;
  duration: Minutes;
  userId: string;
}

export const keys = ['time', 'duration', 'userId'];
const dateFormat = "dd MMM yyyy HH:mm:ss 'GMT'ZZZ";

export function isInternalBooking(tbd: any): tbd is InternalBooking {
  const checkTime =
    (tbd as InternalBooking).time &&
    (tbd as InternalBooking).time instanceof DateTime;
  if (!checkTime) return false;

  const checkDuration =
    (tbd as InternalBooking).duration &&
    typeof (tbd as InternalBooking).duration === 'number';
  if (!checkDuration) return false;

  const checkUserId =
    (tbd as InternalBooking).userId &&
    typeof (tbd as InternalBooking).userId === 'string';
  if (!checkUserId) return false;

  if (Object.keys(tbd).length !== keys.length) return false;

  return true;
}

export function transformDuration(value: string): Result<number, undefined> {
  const parsedDuration = parseInt(value);

  if (isNaN(parsedDuration)) {
    return err(undefined);
  }

  return ok(parsedDuration);
}

export function transformTime(value: string): Result<DateTime, undefined> {
  const parsedTime = DateTime.fromFormat(value, dateFormat);

  if (!parsedTime.isValid) {
    return err(undefined);
  }
  return ok(parsedTime);
}

export function transformUserId(value: string): Result<string, undefined> {
  const userIdRegex = /^[0-9]{4}$/;

  if (!userIdRegex.test(value)) {
    return err(undefined);
  }

  return ok(value);
}

export function internalFromServer(
  serverBooking: ServerBooking
): InternalBooking {
  return {
    time: DateTime.fromISO(serverBooking.time),
    duration: Math.floor(serverBooking.duration / (60 * 1000)),
    userId: serverBooking.userId,
  };
}

export function serverFromInternal(
  internalBooking: InternalBooking
): ServerBooking {
  return {
    time: internalBooking.time.toISO(),
    duration: internalBooking.duration * (60 * 1000),
    userId: internalBooking.userId,
  };
}

export function bookingOverlaps(
  newBooking: InternalBooking,
  existingBookings: InternalBooking[]
) {
  const newBookingStart = newBooking.time.toMillis();
  const newBookingEnd = newBookingStart + newBooking.duration * (60 * 1000);
  return existingBookings.reduce((acc, existingBooking) => {
    if (acc) {
      return acc;
    }
    const existingBookingStart = existingBooking.time.toMillis();
    const existingBookingEnd =
      existingBookingStart + existingBooking.duration * (60 * 1000);

    const newBookingStartsAfter = newBookingStart >= existingBookingEnd;
    const newBookingEndsBefore = newBookingEnd <= existingBookingStart;

    const noOverlap = newBookingStartsAfter || newBookingEndsBefore;

    return !noOverlap || acc;
  }, false);
}
