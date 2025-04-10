const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'lab_admin',
  password: 'lab_admin123',
  database: 'lab_scheduler',
});

module.exports = pool.promise();
