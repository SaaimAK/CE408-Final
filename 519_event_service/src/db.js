const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'datahive',
  password: process.env.DB_PASSWORD || 'datahive123',
  database: process.env.DB_NAME || 'datahive',
  port: parseInt(process.env.DB_PORT) || 5432,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
});

module.exports = pool;
