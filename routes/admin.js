const express = require('express');
const router = express.Router();
const db = require('../db');

// Admin dashboard route (GET)
router.get('/', async (req, res) => {
  try {
    // Fetch all lab availability and bookings
    const [labStatus] = await db.execute('SELECT * FROM lab_availability ORDER BY lab_name ASC');
    const [bookings] = await db.execute('SELECT * FROM bookings ORDER BY booking_date DESC');

    // Get the current time
    const currentTime = new Date();

    // Check and update booking status for each lab if time has passed
    for (let booking of bookings) {
      const bookingEndTime = new Date(`${booking.booking_date} ${booking.end_time}`);

      if (currentTime > bookingEndTime) {
        // If the booking time has passed, set the lab to available
        await db.execute(`
          UPDATE lab_availability
          SET available = 1
          WHERE lab_name = ?
        `, [booking.lab_selection]);
      }
    }

    // Render the admin dashboard with the updated lab status
    res.render('admin', { labStatus, bookings });
  } catch (error) {
    console.error('Error fetching data for admin dashboard:', error);
    res.status(500).send('Error loading admin dashboard.');
  }
});

// CREATE: Add new lab availability (POST)
router.post('/create-lab', async (req, res) => {
  const { lab_name, available, subject, schedule, faculty } = req.body;

  try {
    const query = `
      INSERT INTO lab_availability (lab_name, available, subject, schedule, faculty, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    await db.execute(query, [lab_name, available, subject, schedule, faculty]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding new lab availability:', error);
    res.status(500).send('Failed to add lab availability.');
  }
});

// UPDATE: Update lab availability (POST)
router.post('/update-lab', async (req, res) => {
  const { id, available, subject, schedule, faculty } = req.body;

  try {
    const query = `
      UPDATE lab_availability
      SET available = ?, subject = ?, schedule = ?, faculty = ?, updated_at = NOW()
      WHERE id = ?
    `;
    await db.execute(query, [available, subject, schedule, faculty, id]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error updating lab availability:', error);
    res.status(500).send('Failed to update lab availability.');
  }
});

// DELETE: Delete lab availability record (POST)
router.post('/delete-lab', async (req, res) => {
  const { id } = req.body;

  try {
    const query = 'DELETE FROM lab_availability WHERE id = ?';
    await db.execute(query, [id]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting lab record:', error);
    res.status(500).send('Failed to delete lab record.');
  }
});

// CREATE: Add new booking (POST)
router.post('/add-booking', async (req, res) => {
  const {
    user_type, section, subject, purpose_of_use, lab_selection,
    booking_date, start_time, end_time
  } = req.body;

  try {
    const query = `
      INSERT INTO bookings (user_type, section, subject, purpose_of_use, lab_selection, booking_date, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.execute(query, [user_type, section, subject, purpose_of_use, lab_selection, booking_date, start_time, end_time]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding new booking:', error);
    res.status(500).send('Failed to add booking.');
  }
});

// DELETE: Delete booking record (POST)
router.post('/delete-booking', async (req, res) => {
  console.log('/admin/delete-booking hit with ID:', req.body.id); 
  const { id } = req.body;
  console.log('Booking ID to delete:', id); 

  try {
    const query = 'DELETE FROM bookings WHERE id = ?';
    await db.execute(query, [id]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting booking record:', error);
    res.status(500).send('Failed to delete booking record.');
  }
});
router.post('/delete-booking', async (req, res) => {
  console.log('/admin/delete-booking hit with ID:', req.body.id); 
  const { id } = req.body;
  console.log('Booking ID to delete:', id); 

  try {
    const query = 'DELETE FROM bookings WHERE booking_id = ?';
    await db.execute(query, [id]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting booking record:', error);
    res.status(500).send('Failed to delete booking record.');
  }
});


module.exports = router;
