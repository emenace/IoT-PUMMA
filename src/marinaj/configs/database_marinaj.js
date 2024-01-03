const { Pool } = require('pg');
require('dotenv').config()

const pool2 = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_UTEWS
});
pool2.connect();

module.exports = pool2;