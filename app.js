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

// routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/lab', labRouter);
app.use('/register', registerRouter);

// ✅ GET all bookings
app.get('/lab', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bookings');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/register', async (req, res) => {
  console.log(req.body); // Log the request body to check if it's correct

  const { firstname, lastname, email, password, confirmPassword, student_no } = req.body;

  // Check if the passwords match
  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match.');
  }

  try {
    // If student_no should be auto-generated, remove it from the form and generate here
    const generatedStudentNo = student_no || Math.floor(Math.random() * 100000);  // Example random generation
    
    // Insert user data into the database, including student_no
    const [result] = await db.query(
      `INSERT INTO user (first_name, last_name, email, password, student_no) 
       VALUES (?, ?, ?, ?, ?)`,
      [firstname, lastname, email, password, generatedStudentNo]
    );
    
    // Redirect to the index page (home route) after successful registration
    res.redirect('/');  // Redirect to home page ('/')
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user.');
  }
});



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
