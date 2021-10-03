import React, { useState, useEffect, useMemo } from 'react';
import { uniqBy } from 'lodash';

import { getBookings } from '../../services/api';
import { InternalBooking, internalFromServer } from '../../utils/booking';

import { UploadModal } from '../UploadModal';
import { Timeline } from '../Timeline';

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
    setOverlapBookings((oldOverlapBookigns) => [
      ...oldOverlapBookigns,
      ...newOverlap,
    ]);
  };

  useEffect(() => {
    // Fires on page load and any time bookings have been uploaded
    if (!uploading) {
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
    }
  }, [uploading]);

  const dates = useMemo(() => {
    const allDates = bookings.map((b) => b.time.startOf('day'));

    return uniqBy(allDates, (d) => d.toMillis());
  }, [bookings]);

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
        <button onClick={() => setUploadModalOpen(true)}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {error && <div>{error}</div>}
      <div className="App-main">
        <h2>Bookings:</h2>
        <div className="App-bookings">
          <div className="App-row">
            <div className="App-column left">
              <h3>Existing Bookings</h3>
              <Timeline bookings={bookings} dates={dates} />
            </div>
            <div className="App-column right">
              <h3>Overlapping Bookings</h3>
              <Timeline bookings={overlapBookings} dates={dates} red />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
