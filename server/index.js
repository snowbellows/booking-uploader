const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser');
const fs = require('fs');
const { DateTime } = require('luxon');

const { validateBookings, validateBookingsBulk } = require('./validators');

const dateTimeFormat = "dd MMM yyyy HH:mm:ss 'GMT'ZZZ";

const app = express();
app.use(bodyParser.json());
app.use(cors()); // so that app can access

let bookings = JSON.parse(fs.readFileSync('./bookings.json')).map(
  (bookingRecord) => {
    return {
      time: DateTime.fromFormat(bookingRecord.time, dateTimeFormat).toUTC(),
      duration: bookingRecord.duration * 60 * 1000, // mins into ms
      userId: bookingRecord.user_id,
    };
  }
);

app.get('/bookings', (_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(bookings);
});

app.post('/bookings', (req, res) => {
  const { body } = req;

  const validationResult = validateBookings(body);

  if (validationResult.isErr()) {
    const err = validationResult.error;
    res.setHeader('Content-Type', 'application/json');
    res
      .status(err.code)
      .json({ errorType: err.type, errorMessage: err.message });
  } else {
    bookings = [...bookings, validationResult.value];
  }
  res.sendStatus(200);
});

app.post('/bookings/bulk', (req, res) => {
  const { body } = req;

  const validationResult = validateBookingsBulk(body);

  if (validationResult.isErr()) {
    const err = validationResult.error;
    res.setHeader('Content-Type', 'application/json');
    res
      .status(err.code)
      .json({ errorType: err.type, errorMessage: err.message });
  } else {
    bookings = [...bookings, ...validationResult.value];
  }
  res.sendStatus(200);
});

app.listen(3001);
