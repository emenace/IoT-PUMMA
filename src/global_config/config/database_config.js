const { Pool } = require('pg');
require('dotenv').config()

const readDB = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_UTEWS
});

module.exports = readDB;