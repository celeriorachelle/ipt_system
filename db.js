const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'scheduler_user',
  password: 'your_password',
  database: 'lab_scheduler'
});

module.exports = pool.promise();
