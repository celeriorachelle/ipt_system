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

    // Set user session
    req.session.user = { student_number, email };
    
    // Store student_number separately for easier access
    req.session.student_number = student_number;

    // Clear temp session data
    delete req.session.otpSecret;
    delete req.session.otpEmail;
    delete req.session.tempUser;

    if (courses.length === 0) {
      // Respond with alert and redirect to course form
      return res.send(`
        <script>
          alert("Course Info Required: Please complete your course schedule before proceeding to lab booking.");
          window.location.href = "/course-form";
        </script>
      `);
    }

    // Redirect to lab booking if course data exists
    return res.redirect('/lab');

  } catch (err) {
    console.error('Error checking course schedule after OTP:', err);
    return res.status(500).send('Internal server error after OTP verification');
  }
});

module.exports = router;
