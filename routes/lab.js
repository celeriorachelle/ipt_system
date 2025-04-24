const express = require('express');
const router = express.Router();
const db = require('../db');

// GET lab booking form
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

  const student_number = req.session.user?.student_number;
  if (!student_number) {
    return res.redirect('/');
  }

  try {
    const [validCourse] = await db.execute(
      `SELECT * FROM courses
       WHERE student_number = ?
         AND schedule_day = DAYNAME(?)
         AND TIME(start_time) <= TIME(?)
         AND TIME(end_time) >= TIME(?)`,
      [student_number, booking_date, start_time, end_time]
    );

    if (validCourse.length === 0) {
      return res.send(`
      <script>
        alert("⛔ Booking Not Allowed: Your selected time (${start_time} - ${end_time}) on ${booking_date} does not match any of your registered course schedules.");
        window.location.href = "/lab";
      </script>
      `);
    }

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

  } catch (err) {
    console.error('Course check error:', err);
    res.status(500).send('Internal server error during course schedule check.');
  }
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


// POST route to check lab availability for specific time slot
router.post('/check-availability', async (req, res) => {
  const { lab, booking_date, start_time, end_time } = req.body;

  try {
    const [existingBookings] = await db.execute(
      `SELECT * FROM bookings 
       WHERE lab_selection = ? 
         AND booking_date = ? 
         AND (
           (start_time < ? AND end_time > ?) -- overlapping slot
           OR (start_time >= ? AND start_time < ?)
           OR (end_time > ? AND end_time <= ?)
         )`,
      [lab, booking_date, end_time, start_time, start_time, end_time, start_time, end_time]
    );

    if (existingBookings.length > 0) {
      res.json({ available: false });
    } else {
      res.json({ available: true });
    }
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Server error while checking availability.' });
  }
});


// Logout route
router.post('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) return next(err);
    res.redirect('/');
  });
});

// GET route to fetch lab availability (including booked time slots) by date
router.get('/availability/:date', async (req, res) => {
  const bookingDate = req.params.date;

  try {
    // Pull all bookings for that date, ordered by lab and start time
    const [rows] = await db.execute(
      `SELECT lab_selection, start_time, end_time
       FROM bookings
       WHERE booking_date = ?
       ORDER BY lab_selection, start_time`,
      [bookingDate]
    );

    // Initialize your labs
    const labDetails = {
      'Lab 1': { available: true, bookedSlots: [] },
      'Lab 2': { available: true, bookedSlots: [] },
      'Lab 3': { available: true, bookedSlots: [] }
    };

    // Mark as unavailable & record each booked slot
    rows.forEach(({ lab_selection, start_time, end_time }) => {
      labDetails[lab_selection].available = false;
      labDetails[lab_selection].bookedSlots.push({
        start: start_time,
        end: end_time
      });
    });

    // Return JSON that your client‑side already knows how to render
    res.json(labDetails);

  } catch (err) {
    console.error('Availability fetch error:', err);
    res.status(500).json({ error: 'Server error fetching availability.' });
  }
});

module.exports = router;
