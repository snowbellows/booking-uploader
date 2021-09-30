import { ok, err, Result } from 'neverthrow';
import { ParseError } from 'papaparse';

import { Booking, isBooking, keys } from './booking';
import { parseFile } from './csv';

export function parseBookings(
  file: File,
  onError: (error: ParseError | ParseError[]) => void,
  onSuccess: (bookings: Booking[]) => void,
  preview = 0
) {
  const rowParserConfig = {
    typeCast: isBooking,
    headers: keys,
    fieldTransformers: {
      duration: {
        transform: transformDuration,
        message: (value: string) =>
          `Expected an integer for field "duration", but parsed "${value}"`,
      },
    },
  };

  parseFile({
    file,
    rowParserConfig,
    onError,
    onSuccess,
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
