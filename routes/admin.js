const express = require('express');
const router = express.Router();
const db = require('../db');

router.use((req, res, next) => {
  // Set last activity time on every admin route access
  req.session.lastActivity = Date.now();
  next();
});

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

      // Log admin login
      await db.execute(
        'INSERT INTO admin_logs (admin_action, record_id, action_details) VALUES (?, ?, ?)',
        ['Login', null, 'Admin successfully logged in']
      );

    res.render('admin', { bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).send('<script>alert("Error loading admin dashboard. Please try again."); window.location.href="/admin";</script>');
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

    // Log the addition
    await db.execute(
      'INSERT INTO admin_logs (admin_action, record_id, action_details) VALUES (?, ?, ?)',
      ['Add', null, `New booking added for ${student_booking_number} on ${booking_date} (${start_time} - ${end_time}) in ${lab_selection}`]
    );    

    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding new booking:', error);
    res.status(500).send('<script>alert("The student/faculty number is not yet registered. Please try again."); window.location.href="/admin";</script>');
  }
});


// DELETE: Delete booking record (POST)
router.post('/delete-booking', async (req, res) => {
  const { id } = req.body;

  try {
    // Fetch the student_booking_number before deletion
    const [rows] = await db.execute('SELECT student_booking_number FROM bookings WHERE booking_id = ?', [id]);
    const studentBookingNumber = rows.length > 0 ? rows[0].student_booking_number : 'Unknown';

    const query = 'DELETE FROM bookings WHERE booking_id = ?';
    await db.execute(query, [id]);

    await db.execute(
      'INSERT INTO admin_logs (admin_action, record_id, action_details) VALUES (?, ?, ?)',
      ['Delete', id, `Booking record for ${studentBookingNumber} was deleted by admin`]
    );
        
    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting booking record:', error);
    res.status(500).send('Failed to delete booking record.');
  }
});

// Admin logs page
router.get('/logs', async function(req, res) {
  // Check if user is admin
  if (!req.session.isAdmin) {
    return res.redirect('/admin');
  }
  
  try {
    // Reset activity timer
    req.session.lastActivity = Date.now();
    
    // Fetch logs from database
    const [logs] = await db.execute(
      'SELECT * FROM admin_logs ORDER BY timestamp DESC'
    );
    
    res.render('admin-logs', { logs });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    res.status(500).send('Internal server error');
  }
});


router.post('/logout', function(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

router.get('/session-check', (req, res) => {
  if (!req.session.isAdmin) {
    return res.sendStatus(401);
  }
  res.sendStatus(200);
});

module.exports = router;