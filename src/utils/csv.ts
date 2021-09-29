import { ok, err, Result } from 'neverthrow';
import Papa, { ParseConfig, ParseResult, Parser, ParseError } from 'papaparse';

import { Booking, isBooking, keys } from './booking';

export function parseFile(file: File, preview = 0) {
  let chunkNumber = 0;
  let rowNumber = 0; // zero indexed, excludes header row to align with papaparse
  function parseChunk(
    results: ParseResult<{ [key: string]: string | string[] }>,
    parser: Parser
  ): void {
    const trimmedFields = results.meta.fields?.map((field) => field.trim());
    chunkNumber++
    console.log(chunkNumber)
    checkHeaders(trimmedFields, keys).match(
      () => {
        console.log(results.data);
        results.data.forEach((row) => {
          console.log(`Row ${rowNumber}`)
          parseBooking(row, rowNumber).match(
            (booking) => console.log(booking),
            (e) => console.error(e)
          );
          rowNumber++;
        });
        results.errors.forEach((e) => {
          console.error(e);
        });
      },
      (e) => {
        console.error(e);
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
      message: `Expected ${keys.length} fields, but parsed ${
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
    }
    );
  }

  const parsedBooking = { ...trimmedRow, duration: parsedDuration };

  if (!isBooking(parsedBooking)) {
    return err({
      type: 'FieldMismatch',
      code: 'InvalidFields',
      message: `Expected a valid booking, but parsed "${Object.values(trimmedRow)}"`,
      row: rowNumber,
    }
    );
  }
  return ok(parsedBooking);
}

function checkHeaders(
  fieldsToCheck: string[] | undefined,
  headers: string[]
): Result<true, Error> {
  const error = new Error(
    `Mismatched headers. Expected: ${headers.reduce(
      (acc, header) => `${acc}, ${header}`
    )}. Got: ${
      fieldsToCheck
        ? fieldsToCheck.reduce((acc, header) => `${acc}, ${header} `)
        : 'undefined'
    }`
  );

  if (!fieldsToCheck) {
    return err(error);
  }
  const headersMatch =
    fieldsToCheck.reduce((acc, key) => {
      return headers.includes(key) && acc;
    }, true) && fieldsToCheck.length === headers.length;

  if (!headersMatch) {
    return err(error);
  }
  return ok(true);
}
