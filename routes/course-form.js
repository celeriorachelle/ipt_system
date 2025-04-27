// routes/course-form.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Show course form
router.get('/', async (req, res) => {
  if (!req.session.student_number) {
    return res.redirect('/register');
  }

  try {
    const [courses] = await db.execute(
      'SELECT * FROM courses WHERE student_number = ?',
      [req.session.student_number]
    );

    // Pre-process courses for the template (to avoid .map() inside EJS)
    const courseData = courses.map(course => ({
      course_id: course.course_id,
      section: course.section,
      course_name: course.course_name,
      schedule_day: course.schedule_day,
      start_time: course.start_time.substring(0,5),
      end_time: course.end_time.substring(0,5)
    }));

    res.render('course-form', { courses: courseData });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).send('Failed to load courses');
  }
});

// Handle course form submission
router.post('/', async (req, res) => {
  const student_number = req.session.student_number;
  if (!student_number) {
    console.error('No student_number in session—redirecting back to register');
    return res.redirect('/register');
  }

  const {
    course_id    = [],
    section      = [],
    course_name  = [],
    schedule_day = [],
    start_time   = [],
    end_time     = []
  } = req.body;

  const ids      = Array.isArray(course_id)    ? course_id    : [course_id];
  const sections = Array.isArray(section)      ? section      : [section];
  const names    = Array.isArray(course_name)  ? course_name  : [course_name];
  const days     = Array.isArray(schedule_day) ? schedule_day : [schedule_day];
  const starts   = Array.isArray(start_time)   ? start_time   : [start_time];
  const ends     = Array.isArray(end_time)     ? end_time     : [end_time];

  const count = sections.length;
  if (![names, days, starts, ends, ids].every(arr => arr.length === count)) {
    console.error('Mismatched form-array lengths');
    return res.status(400).send('Invalid form data');
  }

  try {
    for (let i = 0; i < count; i++) {
      const id    = ids[i];
      const sec   = sections[i]?.trim();
      const name  = names[i]?.trim();
      const day   = days[i]?.trim();
      const start = starts[i];
      const end   = ends[i];

      if (!sec || !name || !day || !start || !end) {
        console.warn(`Skipping incomplete row ${i}`);
        continue;
      }

      if (id) {
        // Update existing course
        await db.execute(
          `UPDATE courses
           SET section = ?, course_name = ?, schedule_day = ?, start_time = ?, end_time = ?
           WHERE course_id = ? AND student_number = ?`,
          [sec, name, day, start, end, id, student_number]
        );
      } else {
        // Insert new course
        await db.execute(
          `INSERT INTO courses
           (student_number, section, course_name, schedule_day, start_time, end_time)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [student_number, sec, name, day, start, end]
        );
      }
    }

    return res.redirect('/lab');
  } catch (err) {
    console.error('Error saving courses:', err);
    return res.status(500).send('Failed to save courses');
  }
});

module.exports = router;
