// === NEW FILE: routes/forgot.js ===
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// Render forgot password form
router.get('/', (req, res) => {
  res.render('forgot');
});

// Handle password reset
router.post('/', async (req, res) => {
  const { email, new_password } = req.body;

  if (!email || !new_password) {
    return res.render('forgot', { alert: 'Please fill in all fields.' });
  }

  try {
    const [users] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.render('forgot', { alert: 'No account found with that email.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.execute('UPDATE students SET password = ? WHERE email = ?', [hashedPassword, email]);

    res.render('index', { alert: 'Password successfully updated. Please log in.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).send('Server error while resetting password.');
  }
});

module.exports = router;
