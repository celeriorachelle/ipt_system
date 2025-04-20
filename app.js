require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const db = require('./db');

// CORS setup
const cors = require('cors');  // Import CORS package

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const labRouter = require('./routes/lab');           // 💡 student/faculty bookings & lab dashboard
const registerRouter = require('./routes/register');
const forgotRouter = require('./routes/forgot');
const otpRouter = require('./routes/otp');
const adminRouter = require('./routes/admin');       // 💡 admin dashboard & lab updates
const adminpassRouter = require('./routes/admin-password');
const checkRole = require('./middlewares/checkRole');


const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS setup
app.use(cors());  // Enable CORS for all origins

// Session
const session = require('express-session');
app.use(session({
  secret: 'lab_scheduler_key123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Route setup
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/lab', labRouter);               // 👈 student/faculty use this route
app.use('/register', registerRouter);
app.use('/forgot', forgotRouter);
app.use('/otp', otpRouter);
app.use('/admin', adminRouter);           // 👈 admin-exclusive
app.use('/admin-password', adminpassRouter);
app.use('/checkRole', checkRole);


// Catch 404
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
