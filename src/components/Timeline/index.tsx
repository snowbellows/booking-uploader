import React from 'react';
import { DateTime } from 'luxon';
import { InternalBooking } from '../../utils/booking';

import './styles.scss';



export const Timeline = ({ bookings, dates, red }: { bookings: InternalBooking[], dates: DateTime[], red?: boolean }) => {
  const formatTime = (booking: InternalBooking) => {
    const startTime = booking.time.toLocaleString(DateTime.TIME_SIMPLE);
    const endTime = booking.time
      .plus({ minutes: booking.duration })
      .toLocaleString(DateTime.TIME_SIMPLE);
    const timeZone = booking.time
      .toLocaleParts({ timeZoneName: 'short' })
      .find((p) => p.type === 'timeZoneName')?.value;
  
    return `${startTime} - ${endTime} ${timeZone}`;
  };
  
  const BookingComponent = ({ booking }: { booking: InternalBooking }) => (
    <div
      className={`Timeline-booking ${red ? 'red' : ''}`}
      style={{ height: `${(booking.duration / 1440) * 100}%` }}
    >
      <div>User ID: {booking.userId}</div>
      <div>
        <p>{formatTime(booking)}</p>
      </div>
    </div>
  );

  const bookingsByDate = dates.map((date) => {
    const dateBookings = bookings
      .filter((b) => {
        return date.hasSame(b.time, 'day');
      })
      .sort((first, second) => {
        return first.time.toMillis() > second.time.toMillis() ? 1 : 0;
      });

    return { date, bookings: dateBookings };
  });

  return (
    <div className="Timeline-wrapper">
      {bookingsByDate.map((dateBookings, i) => {
        return (
          <div key={i} className="Timeline-dateblock">
            <h3>{dateBookings.date.toLocaleString(DateTime.DATE_FULL)}</h3>
            <div className="Timeline-bookings">
            {dateBookings.bookings.map((booking) => (
              <BookingComponent booking={booking} />
            ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
