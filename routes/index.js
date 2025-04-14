const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.get('/', function (req, res, next) {
  res.render('index');
});

// Single POST route handler
router.post('/', async function (req, res, next) {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.render('index', { alert: 'Email is not yet registered' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('index', { alert: 'Incorrect credentials' });
    }

    // Generate OTP secret
    const secret = speakeasy.generateSecret({ length: 20 });
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32'
    });

    // Store in session for verification (DON'T set user session yet)
    req.session.otpSecret = secret.base32;
    req.session.otpEmail = email;
    req.session.tempUser = {  // Store temporarily until OTP verification
      student_number: user.student_number,
      email: user.email
    };

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code for Lab Scheduler',
      text: `Your OTP code is: ${token}`
    };

    await transporter.sendMail(mailOptions);

    // Redirect to OTP verification page
    res.redirect('/otp');

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;