const express = require('express');
const router = express.Router();
const db = require('../db');
const speakeasy = require('speakeasy');

// OTP verification page
router.get('/', function(req, res) {
  if (!req.session.otpEmail || !req.session.tempUser) {
    return res.redirect('/');
  }
  res.render('otp');
});

// OTP verification handler
router.post('/', async function(req, res) {
  const { otp } = req.body;

  if (!req.session.otpSecret || !req.session.otpEmail || !req.session.tempUser) {
    return res.redirect('/');
  }

  const verified = speakeasy.totp.verify({
    secret: req.session.otpSecret,
    encoding: 'base32',
    token: otp,
    window: 2
  });

  if (!verified) {
    return res.render('otp', { error: 'Invalid OTP code. Please try again.' });
  }

  const { student_number, email } = req.session.tempUser;

  try {
    const [courses] = await db.execute(
      'SELECT * FROM courses WHERE student_number = ?',
      [student_number]
    );

    // Set the actual user session
    req.session.user = { student_number, email };

    // Clear temp session data
    delete req.session.otpSecret;
    delete req.session.otpEmail;
    delete req.session.tempUser;

    if (courses.length === 0) {
      // Needed for course-form route
      req.session.student_number = student_number;

      // Respond with alert and client-side redirect
      return res.send(`
        <script>
          alert("Course Info Required: Please complete your course schedule before proceeding to lab booking.");
          window.location.href = "/course-form";
        </script>
      `);
    }

    // If course data exists, proceed to lab booking
    return res.redirect('/lab');

  } catch (err) {
    console.error('Error checking course schedule after OTP:', err);
    return res.status(500).send('Internal server error after OTP verification');
  }
});

module.exports = router;
