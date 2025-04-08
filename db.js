const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'booking_admin',
  password: 'ipt123',
  database: 'ipt_system'
});

module.exports = pool.promise();
