import { err, Result } from 'neverthrow';
import { InternalBooking, ServerBooking, serverFromInternal } from '../utils/booking';
import { wrapAsync } from '../utils/helpers';

const apiUrl = 'http://localhost:3001';

export async function getBookings(): Promise<
  Result<ServerBooking[], Error | undefined>
> {
  return wrapAsync(async () => {
    const response = await fetch(`${apiUrl}/bookings`);
    const body = await response.json();
    return body;
  });
}

export async function postBookingsBulk(
  bookings: InternalBooking[]
): Promise<Result<'success', Error | undefined>> {
  return wrapAsync(async () => {
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');

    const serverBookings = bookings.map(serverFromInternal)
    const raw = JSON.stringify(serverBookings);

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
