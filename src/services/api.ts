import { err, Result } from 'neverthrow';
import { Booking } from '../utils/booking';
import { wrapAsync } from '../utils/helpers';

const apiUrl = 'http://localhost:3001';

export async function getBookings(): Promise<
  Result<Booking[], Error | undefined>
> {
  return wrapAsync(async () => {
    const response = await fetch(`${apiUrl}/bookings`);
    const body = await response.json();
    return body;
  });
}

export async function postBookingsBulk(
  bookings: Booking[]
): Promise<Result<'success', Error | undefined>> {
  return wrapAsync(async () => {
    var headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    const raw = JSON.stringify(bookings);
    const response = await fetch(`${apiUrl}/bookings/bulk`, {
      method: 'POST',
      body: raw,
      headers,
    });
    if (response.status === 200) {
      return 'success';
    }

    const body = await response.json();
    return err(body);
  });
}
