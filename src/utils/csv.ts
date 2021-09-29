import { ok, err, Result, combineWithAllErrors, combine } from 'neverthrow';
import Papa, { ParseConfig, ParseResult, Parser, ParseError } from 'papaparse';

import { Booking, isBooking, keys } from './booking';

export function parseFile(
  file: File,
  onError: (error: ParseError | ParseError[]) => void,
  onChunk: (bookings: Booking[]) => void,
  preview = 0
) {
  let chunkNumber = 0;
  let rowNumber = 0; // zero indexed, excludes header row to align with papaparse
  function parseChunk(
    results: ParseResult<{ [key: string]: string | string[] }>,
    parser: Parser
  ): void {
    const trimmedFields = results.meta.fields?.map((field) => field.trim());
    chunkNumber++;
    console.log({ chunkNumber });
    checkHeaders(trimmedFields, keys).match(
      () => {
        console.log({ results: results.data });
        const bookings = combine(results.data
          .map((row) => {
            const bookingResult = parseBooking(row, rowNumber)
            rowNumber++;
            return bookingResult
          })
          .filter((bookingResult) => {
            if (bookingResult.isErr()) {
              bookingResult.mapErr(e => {onError(e)})
              return false
            }
            return true
          })).unwrapOr([]);

        onChunk(bookings)
        onError(results.errors);
      },
      (e) => {
        onError(e);
        parser.abort();
      }
    );
  }
  const config: ParseConfig = {
    chunk: parseChunk,
    header: true,
    preview,
    worker: true,
  };
  Papa.parse(file, config);
}

function trimString(s: string) {
  return s.trim();
}

function parseBooking(
  row: { [key: string]: string | string[] },
  rowNumber: number
): Result<Booking, ParseError> {
  const trimmedRow: { [key: string]: string | string[] } = Object.entries(
    row
  ).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [trimString(key)]: typeof value === 'string' ? trimString(value) : value,
    };
  }, {});

  if (trimmedRow.__parsed_extra) {
    return err({
      type: 'FieldMismatch',
      code: 'TooManyFields',
      message: `Too many fields: Expected ${keys.length} fields but parsed ${
        keys.length + trimmedRow.__parsed_extra.length
      }`,
      row: rowNumber,
    });
  }

  const parsedDuration =
    typeof trimmedRow.duration === 'string'
      ? parseInt(trimmedRow.duration)
      : NaN;

  if (isNaN(parsedDuration)) {
    return err({
      type: 'FieldMismatch',
      code: 'InvalidFields',
      message: `Expected an integer for field "duration", but parsed "${trimmedRow.duration}"`,
      row: rowNumber,
    });
  }

  const parsedBooking = { ...trimmedRow, duration: parsedDuration };
  console.log({ parsedBooking });
  if (!isBooking(parsedBooking)) {
    return err({
      type: 'FieldMismatch',
      code: 'InvalidFields',
      message: `Expected a valid booking, but parsed "${Object.values(
        trimmedRow
      )}"`,
      row: rowNumber,
    });
  }
  console.log('why');
  return ok(parsedBooking);
}

function checkHeaders(
  fieldsToCheck: string[] | undefined,
  headers: string[]
): Result<true, ParseError> {
  const errorMessage = () =>
    `Mismatched headers. Expected: ${headers.reduce(
      (acc, header) => `${acc}, ${header}`
    )}. Got: ${
      fieldsToCheck
        ? fieldsToCheck.reduce((acc, header) => `${acc}, ${header} `)
        : 'undefined'
    }`;

  if (!fieldsToCheck) {
    return err({
      type: 'HeaderMismatch',
      code: 'TooFewFields',
      message: errorMessage(),
      row: 0,
    });
  }
  const headersMatch =
    fieldsToCheck.reduce((acc, key) => {
      return headers.includes(key) && acc;
    }, true) && fieldsToCheck.length === headers.length;

  if (!headersMatch) {
    return err({
      type: 'HeaderMismatch',
      code: 'WrongFields',
      message: errorMessage(),
      row: 0,
    });
  }
  return ok(true);
}
