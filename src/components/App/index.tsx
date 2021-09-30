import React, { useState, useEffect } from 'react';

import { UploadModal } from '../UploadModal';

import './styles.scss';

const apiUrl = 'http://localhost:3001';

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

  useEffect(() => {
    fetch(`${apiUrl}/bookings`)
      .then((response) => response.json())
      .then(setBookings);
  }, []);

  return (
    <div className="App">
      <UploadModal
        isOpen={uploadModalOpen}
        closeModal={() => {
          setUploadModalOpen(false);
        }}
      />
      <div className="App-header">
        <button onClick={() => setUploadModalOpen(true)}>Upload</button>
      </div>
      <div className="App-main">
        <p>Existing bookings:</p>
        {bookings.map((booking, i) => {
          const date = new Date(booking.time);
          const duration = booking.duration / (60 * 1000);
          return (
            <p key={i} className="App-booking">
              <span className="App-booking-time">{date.toString()}</span>
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
