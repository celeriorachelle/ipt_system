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

  if (verified) {
    // Set the actual user session after successful OTP verification
    req.session.user = req.session.tempUser;
    
    // Clear temporary session data
    delete req.session.otpSecret;
    delete req.session.otpEmail;
    delete req.session.tempUser;
    
    return res.redirect('/lab');
  }

  res.render('otp', { error: 'Invalid OTP code. Please try again.' });
});

module.exports = router;