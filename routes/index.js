const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const checkRole = require('../middlewares/checkRole'); // middleware to check user role

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Login page
router.get('/', function (req, res, next) {
  res.render('index');
});

// Handle login post with middleware to check user role
router.post('/', checkRole, async function (req, res, next) {
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

    // Generate OTP
    const secret = speakeasy.generateSecret({ length: 20 });
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32'
    });

    // Store data in session
    req.session.otpSecret = secret.base32;
    req.session.otpEmail = email;
    req.session.tempUser = {
      student_number: user.student_number,
      email: user.email
    };

    // Send OTP
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code for Lab Scheduler',
      text: `Your OTP code is: ${token}`
    };

    await transporter.sendMail(mailOptions);

    res.redirect('/otp');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Internal server error');
  }
});

// Admin password prompt page
router.get('/admin-password', (req, res) => {
  res.render('admin-password');
});

// Handle admin password check
router.post('/admin-password', (req, res) => {
  const enteredPass = req.body.adminPassword;
  const actualPass = process.env.ADMIN_PASS;

  if (enteredPass === actualPass && req.session.adminLogin) {
    // After successful admin login
    req.session.isAdmin = true;
    req.session.lastActivity = Date.now();
    return res.redirect('/admin');
  }

  res.render('admin-password', { alert: 'Incorrect admin password.' });
});

module.exports = router;
