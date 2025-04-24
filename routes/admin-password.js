const express = require('express');
const router = express.Router();
const db = require('../db');

// GET admin password page
router.get('/', (req, res) => {
  res.render('admin-password');
});

// POST admin password
router.post('*', async (req, res) => {
  const enteredPass = req.body.adminPassword;
  const actualPass = process.env.ADMIN_PASS;

  // Get IP address (handles proxies like NGINX)
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (enteredPass === actualPass) {
    req.session.isAdmin = true;

    await db.execute(
      'INSERT INTO admin_logs (admin_action, record_id, action_details, ip_address) VALUES (?, ?, ?, ?)',
      ['Login', null, 'Admin successfully logged in', ipAddress]
    );

    return res.redirect('/admin');
  }

  await db.execute(
    'INSERT INTO admin_logs (admin_action, record_id, action_details, ip_address) VALUES (?, ?, ?, ?)',
    ['Login', null, 'Admin failed log in', ipAddress]
  );

  res.render('admin-password', { alert: 'Incorrect admin password.' });
});


module.exports = router;
