const { ok, err, combine } = require('neverthrow');
const { DateTime } = require('luxon');

const bookingKeys = ['time', 'duration', 'userId'];
const dateTimeFormat = "dd MMM yyyy HH:mm:ss 'GMT'ZZZ";

function validateBookings(body) {
  if (typeof body !== 'object') {
    return err({
      status: 400,
      type: 'malformed-body',
      message: 'Body should be a single booking as an object',
    });
  }
  return validateBooking(body);
}

function validateBookingsBulk(body) {
  if (!Array.isArray(body)) {
    return err({
      status: 400,
      type: 'malformed-body',
      message: 'Body should be an array of bookings',
    });
  }
  return combine(body.map(validateBooking));
}

function validateBooking(booking) {
  const fieldsToCheck = Object.keys(booking);
  const keysMatch =
    fieldsToCheck.reduce((acc, key) => {
      return bookingKeys.includes(key) && acc;
    }, true) && fieldsToCheck.length === bookingKeys.length;

  if (!keysMatch) {
    return err({
      status: 400,
      type: 'malformed-body',
      message: `Booking keys should be ${bookingKeys.join(', ')}`,
    });
  }

  const parsedTime = DateTime.fromFormat(booking.time, dateTimeFormat);

  if (!parsedTime.isValid) {
    return err({
      status: 400,
      type: 'malformed-body',
      message: `Time values should be in the format "${dateTimeFormat}"`,
    });
  }

  const parsedDuration = parseInt(booking.duration);

  if (isNaN(parsedDuration)) {
    return err({
      status: 400,
      type: 'malformed-body',
      message: `Duration values should be integers`,
    });
  }
  const userIdRegex = /^[0-9]{4}$/;

  if (typeof booking.userId !== 'string' || !userIdRegex.test(booking.userId)) {
    return err({
      status: 400,
      type: 'malformed-body',
      message: `userId values should be strings of four digits`,
    });
  }

  return ok({
    time: parsedTime,
    duration: parsedDuration * 60 * 1000, // mins into ms
    userId: booking.userId,
  });
}

module.exports = { validateBookings, validateBookingsBulk };
