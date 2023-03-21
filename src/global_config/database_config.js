const { Pool } = require('pg');
require('dotenv').config()

const pool3 = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool3;