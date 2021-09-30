import React, { useState, useMemo } from 'react';
import ReactModal from 'react-modal';
import { useDropzone } from 'react-dropzone';
import { ParseError } from 'papaparse';
import uniq from 'lodash/uniq';

import { Booking } from '../../utils/booking';
import { parseBookings } from '../../utils/parseBookings';
import {
  baseStyle,
  activeStyle,
  acceptStyle,
  rejectStyle,
} from './dropzoneStyles';

import './styles.scss';

type UploadModalProps = {
  isOpen: boolean;
  closeModal: () => void;
};

export const UploadModal = ({ isOpen, closeModal }: UploadModalProps) => {
  const [previewBookings, setPreviewBookings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onError = (newErrors: ParseError | ParseError[]) => {
    const newErrorsArray = (
      Array.isArray(newErrors) ? newErrors : [newErrors]
    ).map((error) => {
      if (error.type === 'HeaderMismatch') {
        return error.message;
      }

      return `Row ${error.row + 2}: ${error.message}`;
    });

    setErrors((oldErrors) => [...newErrorsArray, ...oldErrors]);
  };

  const displayPreview = (newBookings: Booking[]) => {
    const headerString =
      newBookings[0] && Object.keys(newBookings[0]).join(',');
    const bookingStrings = newBookings.map((booking) =>
      Object.values(booking).join(',')
    );
    console.log({ newBookings });
    setPreviewBookings([
      ...(headerString ? [headerString] : []),
      ...bookingStrings,
    ]);
  };

  const onDrop = (files: File[]) => {
    setErrors([]);
    setPreviewBookings([]);
    files.forEach((file) => {
      parseBookings(file, onError, displayPreview, 5);
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
    return uniq(errors);
  }, [errors]);

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
      {errors.length > 0 && (
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
