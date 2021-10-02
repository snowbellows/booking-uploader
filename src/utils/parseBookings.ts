import { ParseError } from 'papaparse';

import {
  InternalBooking,
  isInternalBooking,
  keys,
  transformDuration,
  transformTime,
  transformUserId,
} from './booking';
import { parseFile } from './csv';

type ParseBookingsConfig = {
  file: File;
  onError: (error: ParseError | ParseError[]) => void;
  onSuccess: (bookings: InternalBooking[]) => void;
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
    typeCast: isInternalBooking,
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
