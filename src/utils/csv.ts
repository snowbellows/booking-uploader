import { ok, err, Result } from 'neverthrow';
import Papa, { ParseConfig, ParseResult, Parser, ParseError } from 'papaparse';

import { trimString } from './helpers';
export interface ParseFileConfig<T> {
  file: File;
  rowParserConfig: RowParserConfig<T>;
  onError: (error: ParseError | ParseError[]) => void;
  onSuccess: (parsedRows: T[]) => void;
  preview: number;
}

export function parseFile<T>({
  file,
  rowParserConfig,
  onError,
  onSuccess,
  preview = 0,
}: ParseFileConfig<T>) {
  let chunkNumber = 0;
  let rowNumber = 0; // zero indexed, excludes header row to align with papaparse

  function parseChunk(
    results: ParseResult<{ [key: string]: string }>,
    parser: Parser
  ): void {
    const trimmedFields = results.meta.fields?.map((field) => field.trim());
    chunkNumber++;
    console.log({ chunkNumber });
    const headersResult = checkHeaders(trimmedFields, rowParserConfig.headers);
    if (headersResult.isErr()) {
      onError(headersResult.error);
      parser.abort();
      console.log('gets here');
    } else {
      const parsedRows = results.data.reduce(
        (acc, row) => {
          const rowResult = rowParser(rowParserConfig)(row, rowNumber);
          rowNumber++;
          if (rowResult.isOk()) {
            const newRows = [...acc.rows, rowResult.value];
            return {
              rows: newRows,
              errors: acc.errors,
            };
          }

          const newErrors = [...acc.errors, rowResult.error];
          return {
            rows: acc.rows,
            errors: newErrors,
          };
        },
        { rows: [], errors: [] } as {
          rows: T[];
          errors: ParseError[];
        }
      );

      onSuccess(parsedRows.rows);

      onError([...parsedRows.errors, ...results.errors]);
    }
  }

  const config: ParseConfig = {
    chunk: parseChunk,
    header: true,
    preview,
    worker: true,
  };
  Papa.parse<{ [key: string]: string }>(file, config);
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

export interface RowParserConfig<T> {
  typeCast: (tbd: any) => tbd is T;
  headers: string[];
  fieldTransformers: {
    [key: string]: {
      transform: (value: string) => Result<any, any>;
      message: (value: string) => string;
    };
  };
}

function rowParser<T>(config: RowParserConfig<T>) {
  return (row: { [key: string]: string }, rowNumber: number) =>
    parseRow(row, rowNumber, config);
}

function parseRow<T>(
  row: { [key: string]: string },
  rowNumber: number,
  { typeCast, fieldTransformers, headers }: RowParserConfig<T>
): Result<T, ParseError> {
  if (row.__parsed_extra) {
    /* 
    This elimantes the only string[] field in objects from papaparse \
    Allowing us to treat rows as {[key: string]: string} througout
    */
    return err({
      type: 'FieldMismatch',
      code: 'TooManyFields',
      message: `Too many fields: expected ${headers.length} fields but parsed ${
        headers.length + row.__parsed_extra.length
      }`,
      row: rowNumber,
    });
  }

  function transformObject<T>(
    acc: Result<T, ParseError>,
    [key, value]: string[]
  ): Result<T, ParseError> {
    if (acc.isErr()) {
      return acc;
    }
    const trimmedKey = trimString(key);
    const trimmedValue = trimString(value);

    const fieldTransformer = fieldTransformers[trimmedKey];
    if (fieldTransformer) {
      const transformResult = fieldTransformer.transform(trimmedValue);

      if (transformResult.isErr()) {
        return err({
          type: 'FieldMismatch',
          code: 'InvalidFields',
          message: fieldTransformer.message(trimmedValue),
          row: rowNumber,
        });
      }
      return acc.map((accObj) => ({
        ...accObj,
        [trimmedKey]: transformResult.value,
      }));
    }

    return acc.map((accObj) => ({ ...accObj, [trimmedKey]: trimmedValue }));
  }

  const transformedObject = Object.entries(row).reduce(
    transformObject,
    ok({}) as Result<{ [key: string]: any }, ParseError>
  );

  if (transformedObject.isErr()) {
    return err(transformedObject.error);
  }

  if (typeCast(transformedObject.value)) {
    return ok(transformedObject.value);
  }
  return err({
    type: 'FieldMismatch',
    code: 'InvalidFields',
    // prettier-ignore
    message: `Expected a valid booking, but parsed "${
      Object.values(row).join(',')
    }"`,
    row: rowNumber,
  });
}
