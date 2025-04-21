const express = require('express');
const router = express.Router();
const db = require('../db');

// GET lab booking form
// GET lab booking form - Updated to include initial availability data
router.get('/', async function (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch initial availability for today
    const [rows] = await db.execute(
      'SELECT lab_selection FROM bookings WHERE booking_date = ?',
      [today]
    );

    const initialAvailability = {
      'Lab 1': true,
      'Lab 2': true,
      'Lab 3': true,
    };

    rows.forEach(row => {
      initialAvailability[row.lab_selection] = false;
    });

    res.render('lab', { 
      initialAvailability,
      initialDate: today 
    });

  } catch (error) {
    console.error('Error loading lab page:', error);
    res.render('lab', { 
      initialAvailability: {
        'Lab 1': true,
        'Lab 2': true,
        'Lab 3': true
      },
      initialDate: new Date().toISOString().split('T')[0]
    });
  }
});

// POST booking confirmation
router.post('/confirm', async function (req, res, next) {
  const {
    user_type,
    section,
    subject,
    purpose,
    lab,
    booking_date,
    start_time,
    end_time
  } = req.body;

  req.session.bookingData = {
    user_type,
    section,
    subject,
    purpose,
    lab,
    booking_date,
    start_time,
    end_time
  };

  res.render('confirm', { booking: req.session.bookingData });
});

// POST final booking submission
router.post('/', async function (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }

  const {
    user_type,
    section,
    subject,
    purpose,
    lab,
    booking_date,
    start_time,
    end_time
  } = req.body;

  const student_number = req.session.user.student_number || req.session.user.faculty_id;

  const values = [
    student_number,
    user_type || null,
    section || null,
    subject || null,
    purpose || null,
    lab || null,
    booking_date || null,
    start_time || null,
    end_time || null
  ];

  try {
    const insertQuery = `
      INSERT INTO bookings 
        (student_booking_number, user_type, section, subject, purpose_of_use, lab_selection, booking_date, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(insertQuery, values);

    req.session.bookingData = {
      user_type,
      section,
      subject,
      purpose,
      lab,
      booking_date,
      start_time,
      end_time
    };

    res.render('receipt', { booking: req.session.bookingData });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).send('Booking failed due to a server error.');
  }
});

// POST route to check for booking conflicts (real-time validation)
// GET route to fetch detailed lab availability by date
router.get('/availability/:date', async (req, res) => {
  const bookingDate = req.params.date;

  try {
    // Get all bookings for the date with time slots
    const [bookings] = await db.execute(
      `SELECT lab_selection, start_time, end_time 
       FROM bookings 
       WHERE booking_date = ? 
       ORDER BY lab_selection, start_time`,
      [bookingDate]
    );

    // Organize by lab
    const labDetails = {
      'Lab 1': { available: true, bookedSlots: [] },
      'Lab 2': { available: true, bookedSlots: [] },
      'Lab 3': { available: true, bookedSlots: [] }
    };

    bookings.forEach(booking => {
      labDetails[booking.lab_selection].available = false;
      labDetails[booking.lab_selection].bookedSlots.push({
        start: booking.start_time,
        end: booking.end_time
      });
    });

    res.json(labDetails);
  } catch (err) {
    console.error('Availability fetch error:', err);
    res.status(500).json({ error: 'Server error fetching availability.' });
  }
});

// ✅ NEW: GET route to fetch lab availability by date
router.get('/availability/:date', async (req, res) => {
  const bookingDate = req.params.date;

  try {
    const [rows] = await db.execute(
      'SELECT lab_selection FROM bookings WHERE booking_date = ?',
      [bookingDate]
    );

    const availability = {
      'Lab 1': true,
      'Lab 2': true,
      'Lab 3': true,
    };

    rows.forEach(row => {
      availability[row.lab_selection] = false;
    });

    res.json(availability);
  } catch (err) {
    console.error('Availability fetch error:', err);
    res.status(500).json({ error: 'Server error fetching availability.' });
  }
});

// Logout route
router.post('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;
