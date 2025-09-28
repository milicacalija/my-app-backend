const mysql = require('mysql');

const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

conn.connect((err) => {
  if (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }
  console.log('MySQL connected!');
});
