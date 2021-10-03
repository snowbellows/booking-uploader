import React, { useState, useMemo } from 'react';
import ReactModal from 'react-modal';
import { useDropzone } from 'react-dropzone';
import { ParseError } from 'papaparse';
import uniq from 'lodash/uniq';
import { DateTime } from 'luxon';

import { bookingOverlaps, InternalBooking } from '../../utils/booking';
import { parseBookings } from '../../utils/parseBookings';
import {
  baseStyle,
  activeStyle,
  acceptStyle,
  rejectStyle,
} from './dropzoneStyles';

import './styles.scss';
import { postBookingsBulk } from '../../services/api';

type UploadModalProps = {
  isOpen: boolean;
  closeModal: () => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  addBookings: ({
    newUnique,
    newOverlap,
  }: {
    newUnique: InternalBooking[];
    newOverlap: InternalBooking[];
  }) => void;
  setError: (error: string | undefined) => void;
  existingBookings: InternalBooking[];
};

export const UploadModal = ({
  isOpen,
  closeModal,
  uploading,
  setUploading,
  addBookings,
  setError,
  existingBookings,
}: UploadModalProps) => {
  const [previewBookings, setPreviewBookings] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const onError = (newErrors: ParseError | ParseError[]) => {
    const newErrorsArray = (
      Array.isArray(newErrors) ? newErrors : [newErrors]
    ).map((error) => {
      if (error.type === 'HeaderMismatch') {
        return error.message;
      }

      return `Skipped row ${error.row + 2}: ${error.message}`;
    });

    setParseErrors((oldErrors) => [...newErrorsArray, ...oldErrors]);
  };

  const displayPreview = (newBookings: InternalBooking[]) => {
    const headerString =
      newBookings[0] && Object.keys(newBookings[0]).join(',');
    const bookingStrings = newBookings.map(
      (booking) =>
        `${booking.time.toLocaleString(DateTime.DATETIME_FULL)},${
          booking.duration
        },${booking.userId}`
    );
    setPreviewBookings([
      ...(headerString ? [headerString] : []),
      ...bookingStrings,
    ]);
  };

  const onDrop = (newFiles: File[]) => {
    setParseErrors([]);
    setPreviewBookings([]);
    setFiles(newFiles);
    newFiles.forEach((file) => {
      parseBookings({ file, onError, onSuccess: displayPreview, preview: 5 });
    });
  };

  const processAndUpload = (newBookings: InternalBooking[]) => {
    const sortedBookings = newBookings.reduce(
      (acc, newBooking) => {
        if (bookingOverlaps(newBooking, existingBookings)) {
          return {
            ...acc,
            newOverlap: [...acc.newOverlap, newBooking],
          };
        }
        return {
          ...acc,
          newUnique: [...acc.newUnique, newBooking],
        };
      },
      { newUnique: [], newOverlap: [] } as {
        newUnique: InternalBooking[];
        newOverlap: InternalBooking[];
      }
    );

    addBookings(sortedBookings);

    if (sortedBookings.newUnique.length > 0) {
      postBookingsBulk(sortedBookings.newUnique).then((result) => {
        if (result.isErr()) {
          if (window.debug) {
            console.error(result.error);
          }
          const errorMessage = 'Upload Failed. Try again Later';
          setError(errorMessage);
          setParseErrors([...parseErrors, errorMessage]);
        }
      });
    } else {
      const errorMessage = 'No unique bookings to upload';
      setError(errorMessage);
      setParseErrors([...parseErrors, errorMessage]);
    }
  };

  const onSubmit = () => {
    setUploading(true);
    setError(undefined);
    setParseErrors([]);
    setPreviewBookings([]);
    files.forEach((file) => {
      parseBookings({
        file,
        onError,
        onSuccess: processAndUpload,
        onComplete: () => {
          setUploading(false);
        },
      });
    });
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    isFocused,
  } = useDropzone({ accept: 'text/csv', onDrop });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive || isFocused ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept, isFocused]
  );

  const filteredErrors = useMemo(() => {
    return uniq(parseErrors);
  }, [parseErrors]);

  return (
    <ReactModal
      isOpen={isOpen}
      aria={{
        labelledby: 'modal-heading',
        describedby: 'modal-description',
      }}
    >
      <button onClick={closeModal}>Close</button>
      <h1 id="modal-heading" className="UploadModal-heading">
        Upload Booking CSV
      </h1>
      <p id="modal-description">
        Add many bookings in bulk by uploading one or more CSV files.
      </p>
      <section>
        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />
          <p>Drop some files here, or click to select files</p>
        </div>
      </section>
      {parseErrors.length > 0 && (
        <div>
          <h2 className="UploadModal-error UploadModal-subheading">Errors</h2>
          <ul>
            {filteredErrors.map((error, i) => (
              <li key={i} className="UploadModal-error">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
      {previewBookings.length > 0 && (
        <div>
          <h2 className="UploadModal-subheading">Preview</h2>
          {previewBookings.map((bookingString, i) => (
            <p key={i}>{bookingString}</p>
          ))}
        </div>
      )}
      <button disabled={files.length === 0 || uploading} onClick={onSubmit}>
        Process and Upload
      </button>
      <p>Make sure your csv file is properly formatted before upload.</p>
      <p>The file should start with a row of headings like:</p>
      <pre>
        <code>time,duration,userId</code>
      </pre>

      <p>Followed by multiple rows of entries:</p>
      <pre>
        <code>01 Mar 2020 11:00:00 GMT+1000,300,0001</code>
        <code>02 Mar 2020 14:00:00 GMT+1000,300,0001</code>
      </pre>
      <section>
        <p>Notes:</p>
        <ul>
          <li>
            Spaces between commas and the next field are accepted and will be
            filtered out as in the following:
            <pre>
              <code>time, duration, userId</code>
              <code>01 Mar 2020 11:00:00 GMT+1000, 300, 0001</code>
              <code>02 Mar 2020 14:00:00 GMT+1000, 300, 0001</code>
            </pre>
          </li>
          <li>
            Headings can only be "time", "duration" and "userId" and must be
            spelt exactly the same including capitalisations.
          </li>
          <li>
            The time fields must be formatted as shown in examples. <br />
            Valid: <code>02 Mar 2020 14:00:00 GMT+1000</code> <br />
            Invalid: <code>02 March 2020 2pm</code>
          </li>
          <li>
            The duration fields must be valid numbers in seconds as shown in
            examples. <br /> Valid: <code>300</code> <br />
            Invalid: <code>5m</code>
          </li>
          <li>
            The userId fields must be 4 digit numbers as shown in examples with
            .<br />
            Valid: <code>0003</code> <br /> Invalid: <code>3</code>
          </li>
        </ul>
      </section>
    </ReactModal>
  );
};
