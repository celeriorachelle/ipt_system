// routes/course-form.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Show course form
router.get('/', (req, res) => {
  if (!req.session.student_number) {
    return res.redirect('/register');
  }
  res.render('course-form');
});

// Handle submission
router.post('/', async (req, res) => {
  const student_number = req.session.student_number;
  if (!student_number) {
    console.error('No student_number in session—redirecting back to register');
    return res.redirect('/register');
  }

  // Destructure with defaults so we always get arrays
  const {
    section     = [],
    course_name = [],
    schedule_day= [],
    start_time  = [],
    end_time    = []
  } = req.body;

  // Force into arrays
  const sections     = Array.isArray(section)      ? section      : [section];
  const names        = Array.isArray(course_name)  ? course_name  : [course_name];
  const days         = Array.isArray(schedule_day) ? schedule_day : [schedule_day];
  const starts       = Array.isArray(start_time)   ? start_time   : [start_time];
  const ends         = Array.isArray(end_time)     ? end_time     : [end_time];

  // All arrays must be same length
  const count = sections.length;
  if (![names, days, starts, ends].every(arr => arr.length === count)) {
    console.error('Mismatched course-array lengths', { sections, names, days, starts, ends });
    return res.status(400).send('Invalid form data');
  }

  try {
    for (let i = 0; i < count; i++) {
      const sec   = sections[i]?.trim();
      const name  = names[i]?.trim();
      const day   = days[i]?.trim();
      const start = starts[i];
      const end   = ends[i];

      // Skip any row where a required field is missing or empty
      if (!sec || !name || !day || !start || !end) {
        console.warn(`Skipping empty course row #${i}`, { sec, name, day, start, end });
        continue;
      }

      await db.execute(
        `INSERT INTO courses
           (student_number, section, course_name, schedule_day, start_time, end_time)
         VALUES (?,?,?,?,?,?)`,
        [student_number, sec, name, day, start, end]
      );
    }

    return res.redirect('/lab');
  } catch (err) {
    console.error('Error saving courses:', err);
    return res.status(500).send('Failed to save courses');
  }
});

module.exports = router;
