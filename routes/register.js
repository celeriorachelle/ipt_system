const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.get('/', function (req, res, next) {
  res.render('register', { title: 'Register' });
});

router.post('/', async function (req, res, next) {
  try {
    const {
      student_no,
      firstname,
      lastname,
      email,
      password,
      confirmPassword,
    } = req.body;

    // Backend password match validation
    if (password !== confirmPassword) {
      return res.status(400).send('Passwords do not match.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    const [result] = await db.execute(
      `INSERT INTO students 
       (student_number, first_name, last_name, email, password) 
       VALUES (?, ?, ?, ?, ?)`,
      [student_no, firstname, lastname, email, hashedPassword]
    );

    res.redirect('/');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).send('Email or Student Number already exists.');
    } else {
      console.error(err);
      res.status(500).send('Server error.');
    }
  }
});

module.exports = router;
