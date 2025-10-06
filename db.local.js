// backend/db.local.js
// backend/db.local.js
const mysql = require('mysql');

const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root123',
  database: 'hemikalije_baza'
});

conn.connect((err) => {
  if (err) {
    console.error('❌ Greška pri povezivanju na lokalnu bazu:', err);
    return;
  }
  console.log('✅ MySQL lokalno povezan!');
});

module.exports = conn; // OBAVEZNO ovako!

