const express = require('express');
const router = express.Router();
const db = require('../db');

// GET lab booking form
router.get('/', async function (req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }

  res.render('lab');
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
router.post('/check-availability', async (req, res) => {
  const { lab, booking_date, start_time, end_time } = req.body;

  try {
    const query = `
      SELECT * FROM bookings
      WHERE lab_selection = ?
        AND booking_date = ?
        AND (
          (start_time < ? AND end_time > ?)
          OR (start_time < ? AND end_time > ?)
          OR (start_time >= ? AND end_time <= ?)
          OR (start_time <= ? AND end_time >= ?)
        )
    `;

    const [conflicts] = await db.execute(query, [
      lab, booking_date,
      end_time, start_time,
      end_time, start_time,
      start_time, end_time,
      start_time, end_time
    ]);

    if (conflicts.length > 0) {
      return res.json({ available: false });
    }

    res.json({ available: true });
  } catch (error) {
    console.error('Conflict check failed:', error);
    res.status(500).json({ error: 'Server error during conflict check.' });
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
