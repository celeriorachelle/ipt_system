var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db = require('./db');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var labRouter = require('./routes/lab');
var registerRouter = require('./routes/register');
var forgotRouter = require('./routes/forgot');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const session = require('express-session');

// Session middleware
app.use(session({
  secret: 'lab_scheduler_key123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/lab', labRouter);
app.use('/register', registerRouter);
app.use('/forgot', forgotRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
