import React, { useState, useEffect, useMemo } from 'react';
import { DateTime } from 'luxon';
import { getBookings } from '../../services/api';
import { InternalBooking, internalFromServer } from '../../utils/booking';

import { UploadModal } from '../UploadModal';

import './styles.scss';

export const App = () => {
  const [bookings, setBookings] = useState<InternalBooking[]>([]);
  const [overlapBookings, setOverlapBookings] = useState<InternalBooking[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const addBookings = ({
    newUnique,
    newOverlap,
  }: {
    newUnique: InternalBooking[];
    newOverlap: InternalBooking[];
  }) => {
    setBookings((oldBookings) => [...oldBookings, ...newUnique]);
    setOverlapBookings( (oldOverlapBookigns) => [...oldOverlapBookigns, ...newOverlap]);
  };

  useEffect(() => {
    setError(undefined);
    getBookings().then((result) => {
      result.match(
        (serverBookings) => {
          const newBookings = serverBookings.map(internalFromServer);
          setBookings(newBookings);
        },
        (error) => {
          if (window.debug) {
            console.error(error);
          }
          setError('Could not get bookings from server. Try again later.');
        }
      );
    });
  }, []);

  const orderedBookings = useMemo(() => {
    const unique = bookings.map((b) => ({ overlap: false, booking: b }));
    const overlap = overlapBookings.map((b) => ({ overlap: true, booking: b }));

    return unique.concat(overlap).sort((first, second) => {
      return first.booking.time.toMillis() > second.booking.time.toMillis()
        ? 1
        : 0;
    });
  }, [bookings, overlapBookings]);

  const BookingComponent = ({ booking }: { booking: InternalBooking }) => (
    <p className="App-booking">
      <span className="App-booking-time">
        {booking.time.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS, {})}
      </span>
      <span className="App-booking-duration">{booking.duration}</span>
      <span className="App-booking-user">{booking.userId}</span>
    </p>
  );

  return (
    <div className="App">
      <UploadModal
        isOpen={uploadModalOpen}
        closeModal={() => {
          setUploadModalOpen(false);
        }}
        uploading={uploading}
        setUploading={setUploading}
        addBookings={addBookings}
        setError={setError}
        existingBookings={bookings}
      />
      <div className="App-header">
        <button onClick={() => setUploadModalOpen(true)}>{uploading ? 'Uploading...' : 'Upload'}</button>
      </div>
      {error && <div>{error}</div>}
      <div className="App-main">
        <h2>Bookings:</h2>
        <div className="App-bookings">
          <div className="App-row">
            <div className="App-column left">
              <h3>Existing Bookings</h3>
            </div>
            <div className="App-column right">
              <h3>Overlapping Bookings</h3>
            </div>
          </div>
          {orderedBookings.map((b, i) => {
            return b.overlap ? (
              <div className="App-row" key={i}>
                <div className="App-column left"></div>
                <div className="App-column right overlap">
                  <BookingComponent booking={b.booking} />
                </div>
              </div>
            ) : (
              <div className="App-row" key={i}>
                <div className="App-column left">
                  <BookingComponent booking={b.booking} />
                </div>
                <div className="App-column right overlap"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
