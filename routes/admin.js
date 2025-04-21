const express = require('express');
const router = express.Router();
const db = require('../db');

// Admin dashboard route (GET) - Now only shows bookings
router.get('/', async (req, res) => {
  try {
    // Fetch all bookings with additional details
    const [bookings] = await db.execute(`
      SELECT 
        booking_id,
        student_booking_number,
        user_type,
        section,
        subject,
        purpose_of_use,
        lab_selection,
        DATE_FORMAT(booking_date, '%Y-%m-%d') as booking_date,
        TIME_FORMAT(start_time, '%H:%i') as start_time,
        TIME_FORMAT(end_time, '%H:%i') as end_time,
        created_at
      FROM bookings 
      ORDER BY booking_date DESC, start_time DESC
    `);

    res.render('admin', { bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).send('Error loading admin dashboard.');
  }
});

// CREATE: Add new booking (POST)
router.post('/add-booking', async (req, res) => {
  const {
    student_booking_number,
    user_type, 
    section, 
    subject, 
    purpose_of_use, 
    lab_selection,
    booking_date, 
    start_time, 
    end_time
  } = req.body;

  try {
    const query = `
      INSERT INTO bookings 
        (student_booking_number, user_type, section, subject, purpose_of_use, 
         lab_selection, booking_date, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.execute(query, [
      student_booking_number,
      user_type, 
      section, 
      subject, 
      purpose_of_use, 
      lab_selection,
      booking_date, 
      start_time, 
      end_time
    ]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding new booking:', error);
    res.status(500).send('Failed to add booking.');
  }
});

// DELETE: Delete booking record (POST)
router.post('/delete-booking', async (req, res) => {
  const { id } = req.body;

  try {
    const query = 'DELETE FROM bookings WHERE booking_id = ?';
    await db.execute(query, [id]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting booking record:', error);
    res.status(500).send('Failed to delete booking record.');
  }
});

router.post('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }
    // Clear the session cookie
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;