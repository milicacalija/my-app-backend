require('dotenv').config();
console.log('DB NAME:', process.env.MYSQLDATABASE);
console.log('--- ENV VARIJABLE ---');
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQLPORT:', process.env.MYSQLPORT);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '✅ set' : '❌ undefined');
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('PORT:', process.env.PORT);
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ set' : '❌ undefined');
const mysql = require('mysql2');

// Kreiranje pool-a (klasičan callback stil)
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

// Test konekcije
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