const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const passwordValidator = require('password-validator');

// Create password schema
const passwordSchema = new passwordValidator();
passwordSchema
  .is().min(8)
  .is().max(100)
  .has().uppercase()
  .has().lowercase()
  .has().digits()
  .has().symbols()
  .has().not().spaces()
  .not().oneOf(['Password123', '12345678']);

router.get('/', function (req, res, next) {
  res.render('register', { 
    title: 'Register',
    alert: req.query.alert || null,
    passwordErrors: null,
    formData: {
      student_no: '',
      firstname: '',
      lastname: '',
      email: '',
      password: ''
    }
  });
});

router.post('/', async function (req, res, next) {
  // Default template variables
  const templateVars = {
    title: 'Register',
    alert: null,
    passwordErrors: null,
    formData: req.body || {
      student_no: '',
      firstname: '',
      lastname: '',
      email: '',
      password: ''
    }
  };

  try {
    const { student_no, firstname, lastname, email, password, confirmPassword } = req.body;

    // Password match validation
    if (password !== confirmPassword) {
      templateVars.alert = 'Passwords do not match.';
      return res.render('register', templateVars);
    }

    // Password strength validation
    if (!passwordSchema.validate(password)) {
      templateVars.alert = 'Password does not meet requirements:';
      templateVars.passwordErrors = passwordSchema.validate(password, { details: true })
        .map(e => e.message);
      return res.render('register', templateVars);
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.execute(
      `INSERT INTO students (student_number, first_name, last_name, email, password) 
       VALUES (?, ?, ?, ?, ?)`,
      [student_no, firstname, lastname, email, hashedPassword]
    );

    return res.redirect('/login?alert=Registration successful! Please login.');
    
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      templateVars.alert = 'Email already registered. Please use another email.';
    } else {
      console.error(err);
      templateVars.alert = 'Server error. Please try again later.';
    }
    return res.render('register', templateVars);
  }
});

module.exports = router;