module.exports = function checkRole(req, res, next) {
  const { role } = req.body;

  if (!role) {
    return res.render('index', { alert: 'Please select a role.' });
  }

  if (role === 'admin') {
    req.session.adminLogin = {
      email: req.body.email,
      password: req.body.password,
    };
    return res.redirect('/admin-password');
  }

  // Allow OTP process for student/faculty
  next();
};
