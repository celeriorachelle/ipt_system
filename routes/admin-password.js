const express = require('express');
const router = express.Router();

// GET admin password page
router.get('/', (req, res) => {
  res.render('admin-password');
});

// POST admin password form
router.post('/', (req, res) => {
  const enteredPass = req.body.adminPassword;
  const actualPass = process.env.ADMIN_PASS;

  if (enteredPass === actualPass && req.session.adminLogin) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }

  res.render('admin-password', { alert: 'Incorrect admin password.' });
});

module.exports = router;
