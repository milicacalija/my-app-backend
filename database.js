require('dotenv').config();
const mysql = require('mysql2');

// Kreiranje pool-a umesto pojedinačne konekcije
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,  // maksimalno 10 paralelnih konekcija
  queueLimit: 0
});

// Da bi koristio async/await
const db = pool.promise();

db.getConnection()
  .then(conn => {
    console.log('✅ Povezan na bazu (pool)!');
    conn.release(); // oslobodi konekciju
  })
  .catch(err => {
    console.error('❌ Greška pri povezivanju sa bazom:', err);
  });

module.exports = db;
