import { ok, err, Result } from 'neverthrow';
import { ParseError } from 'papaparse';
import { DateTime } from 'luxon';

import { Booking, isBooking, keys } from './booking';
import { parseFile } from './csv';

type ParseBookingsConfig = {
  file: File;
  onError: (error: ParseError | ParseError[]) => void;
  onSuccess: (bookings: Booking[]) => void;
  onComplete?: () => void;
  preview?: number;
};

export function parseBookings({
  file,
  onError,
  onSuccess,
  onComplete = () => {},
  preview = 0,
}: ParseBookingsConfig) {
  const rowParserConfig = {
    typeCast: isBooking,
    headers: keys,
    fieldTransformers: {
      duration: {
        transform: transformDuration,
        message: (value: string) =>
          `Expected an integer for field "duration", but parsed "${value}"`,
      },
      time: {
        transform: transformTime,
        message: (value: string) =>
          `Expected a date time in specified format for field "time", but parsed "${value}"`,
      },
      userId: {
        transform: transformUserId,
        message: (value: string) =>
          `Expected a string of 4 numbers like "0001" for field "userId", but parsed "${value}"`,
      },
    },
  };

  parseFile({
    file,
    rowParserConfig,
    onError,
    onSuccess,
    onComplete,
    preview,
  });
}

function transformDuration(value: string): Result<number, undefined> {
  const parsedDuration = parseInt(value);

  if (isNaN(parsedDuration)) {
    return err(undefined);
  }

  return ok(parsedDuration);
}

function transformTime(value: string): Result<string, undefined> {
  const parsedTime = DateTime.fromFormat(
    value,
    "dd MMM yyyy HH:mm:ss 'GMT'ZZZ"
  );

  if (!parsedTime.isValid) {
    return err(undefined);
  }
  return ok(value);
}

function transformUserId(value: string): Result<string, undefined> {
  const userIdRegex = /^[0-9]{4}$/;

  if (!userIdRegex.test(value)) {
    return err(undefined);
  }

  return ok(value);
}
