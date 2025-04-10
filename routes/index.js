const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.get('/', function (req, res, next) {
  res.render('index');
});

router.post('/', async function (req, res, next) {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.render('index', { alert: 'Account does not exist' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('index', { alert: 'Incorrect credentials' });
    }

    req.session.user = {
      student_number: user.student_number,
      email: user.email
    };

    res.redirect('/lab');

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;