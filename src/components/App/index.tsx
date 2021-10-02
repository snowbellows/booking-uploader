import { DateTime } from 'luxon';
import React, { useState, useEffect } from 'react';

import { getBookings } from '../../services/api';
import { InternalBooking, internalFromServer } from '../../utils/booking';

import { UploadModal } from '../UploadModal';

import './styles.scss';

export const App = () => {
  const [bookings, setBookings] = useState<InternalBooking[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const addBookings = (newBookings: InternalBooking[]) => {
    setBookings([...bookings, ...newBookings]);
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
        <button onClick={() => setUploadModalOpen(true)}>Upload</button>
      </div>
      {error && <div>{error}</div>}
      <div className="App-main">
        <p>Existing bookings:</p>
        {bookings.map((booking, i) => {
          return (
            <p key={i} className="App-booking">
              <span className="App-booking-time">
                {booking.time.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS, {})}
              </span>
              <span className="App-booking-duration">
                {booking.duration}
              </span>
              <span className="App-booking-user">{booking.userId}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
};
