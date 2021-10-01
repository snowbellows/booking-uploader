import { ok, err, Result, Ok, Err } from 'neverthrow';

export function trimString(s: string) {
  return s.trim();
}

export async function wrapAsync<T, E>(
  fn: (...args: any) => Promise<T | Result<T, E>>
): Promise<Result<T, E | Error | undefined>> {
  try {
    const value = await fn();
    if (value instanceof Ok) {
      return ok(value.value);
    }
    if (value instanceof Err) {
      return err(value.error)
    }
    return ok(value);
  } catch (error) {
    if (error instanceof Error) {
      return err(error);
    }
    return err(undefined);
  }
}
