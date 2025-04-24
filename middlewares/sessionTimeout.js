module.exports = function(req, res, next) {
  if (!req.originalUrl.startsWith('/admin')) {
    return next();
  }

  const now = Date.now();

  if (req.session.lastActivity && now - req.session.lastActivity > 900000) {
    console.log('Session expired due to inactivity');
    req.session.destroy(err => {
      if (err) console.error('Error destroying session:', err);
      return res.redirect('/');
    });
  } else {
    // Don't update lastActivity if it's a background check
    if (req.originalUrl !== '/admin/session-check') {
      req.session.lastActivity = now;
    }
    next();
  }
};
