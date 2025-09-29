require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Greška pri povezivanju sa bazom:', err);
  } else {
    console.log('✅ Povezan na bazu (pool, callback klijent)!');
    conn.release();
  }
});

module.exports = pool;



//Greška ti dolazi zato što tvoj database klijent koristi promise verziju, a ti pokušavaš da pozoveš db.query(sql, callback). To se ne može, jer promise klijent ne prihvata callback funkcije.Dakle, postoje dve opcije, zavisi šta želiš da koristiš:sve sql upite cemo await pozivat