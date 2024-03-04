const Pool = require("pg").Pool;
// const dotenv = require('dotenv').config();

// Create pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'finance',
  password: '',
  port: 5432
});

module.exports = pool;