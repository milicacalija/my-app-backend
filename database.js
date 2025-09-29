require('dotenv').config();
const mysql = require('mysql2');
const logger = require('./logger');
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, conn) => {
  if (err) {
    logger.error('❌ Greška pri povezivanju sa bazom:', err);
  } else {
    logger.log('✅ Povezan na bazu (pool, callback klijent)!');
    conn.release();
  }
});

module.exports = pool;



//Greška ti dolazi zato što tvoj database klijent koristi promise verziju, a ti pokušavaš da pozoveš db.query(sql, callback). To se ne može, jer promise klijent ne prihvata callback funkcije.Dakle, postoje dve opcije, zavisi šta želiš da koristiš:sve sql upite cemo await pozivat