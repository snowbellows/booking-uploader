import { DateTime } from 'luxon';
import React, { useState, useEffect } from 'react';
import { getBookings } from '../../services/api';

import { UploadModal } from '../UploadModal';

import './styles.scss';


type TimeStamp = string;
type Seconds = number;
type Booking = {
  time: TimeStamp;
  duration: Seconds;
  userId: string;
};

export const App = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined)

  const addBookings = (newBookings: Booking[]) => {
    setBookings([...bookings, ...newBookings]);
  };

  useEffect(() => {
    setError(undefined)
    getBookings()
      .then(result => {
        result.match((bookings) => setBookings(bookings), (error) => {
          setError('Could not get bookings from server. Try again later.')
        })
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
      {error && (
        <div>{error}</div>
      )}
      <div className="App-main">
        <p>Existing bookings:</p>
        {bookings.map((booking, i) => {
          const date = DateTime.fromISO(booking.time);
          const duration = booking.duration / (60 * 1000);
          return (
            <p key={i} className="App-booking">
              <span className="App-booking-time">
                {date.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS, {})}
              </span>
              <span className="App-booking-duration">
                {duration.toFixed(1)}
              </span>
              <span className="App-booking-user">{booking.userId}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
};
