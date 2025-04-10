const express = require('express');
const router = express.Router();
const db = require('../db');
const moment = require('moment');

/// GET the booking page
router.get('/', async function (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }

  try {
    const student_number = req.session.user.student_number;
    const currentMonth = moment().format('YYYY-MM');  // Format as YYYY-MM

    const [existingBookings] = await db.execute(`
      SELECT * FROM bookings
      WHERE student_booking_number = ? AND DATE_FORMAT(booking_date, '%Y-%m') = ?
    `, [student_number, currentMonth]);

    const [takenSlots] = await db.execute(`
      SELECT lab_selection, pc_selection
      FROM bookings
      WHERE booking_date = CURDATE()
    `);

    // Format taken slots into takenLabs object
    const takenLabs = {};
    takenSlots.forEach(slot => {
      if (!takenLabs[slot.lab_selection]) {
        takenLabs[slot.lab_selection] = [];
      }
      takenLabs[slot.lab_selection].push(slot.pc_selection);
    });

    res.render('lab', { takenLabs: takenLabs });

  } catch (error) {
    console.error('Error fetching taken slots or checking existing bookings:', error);
    res.status(500).send('Failed to load taken slots or check existing bookings.');
  }
});

// GET confirmation page for booking (this route shows the confirmation page with data)
router.post('/confirm', async function (req, res, next) {
  const {
    student_number,
    section,
    purpose,
    lab,
    pc,
    booking_date,
    duration
  } = req.body;

  // Get the current month from the booking date
  const bookingMonth = moment(booking_date).format('YYYY-MM');  // Format the booking date to YYYY-MM
  const currentMonth = moment().format('YYYY-MM');  // Get the current month as YYYY-MM

  // Check if the user has any existing bookings for the booking month
  const [existingBookings] = await db.execute(`
    SELECT * FROM bookings
    WHERE student_booking_number = ? AND DATE_FORMAT(booking_date, '%Y-%m') = ?
  `, [student_number, bookingMonth]);

  // If the user has existing bookings for the current month, prevent the booking
  if (existingBookings.length > 0 && bookingMonth === currentMonth) {
    return res.render('lab', { 
      alert: "You have already reached the maximum booking schedule for the current month."
    });
  }

  // Store data in session temporarily for confirmation
  req.session.bookingData = {
    student_number,
    section,
    purpose,
    lab,
    pc,
    booking_date,
    duration
  };

  // Render confirmation page with session data
  res.render('confirm', { booking: req.session.bookingData });
});

// POST booking form after confirmation
router.post('/', async function (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }

  const {
    student_number,
    section,
    purpose,
    lab,
    pc,
    booking_date,
    duration
  } = req.body;

  // Validate student number matches session user
  if (student_number !== req.session.user.student_number) {
    return res.render('lab', { alert: 'Student number does not match your session!' });
  }

  try {
    const insertQuery = `
      INSERT INTO bookings 
        (student_booking_number, section, purpose_of_use, lab_selection, pc_selection, booking_date, usage_duration)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      student_number,
      section,
      purpose,
      lab,
      pc,
      booking_date,
      duration
    ];

    // Store the booking data temporarily in session for receipt
    req.session.bookingData = {
      student_number,
      section,
      purpose,
      lab,
      pc,
      booking_date,
      duration
    };

    await db.execute(insertQuery, values);

    // Render the booking receipt page with session data
    res.render('receipt', { booking: req.session.bookingData });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).send('Booking failed due to a server error.');
  }
});

// Logout functionality
router.post('/logout', function (req, res, next) {
  // Destroy the session
  req.session.destroy(function (err) {
    if (err) {
      return next(err);
    }
    // Redirect to the index page (login page)
    res.redirect('/');
  });
});

module.exports = router;