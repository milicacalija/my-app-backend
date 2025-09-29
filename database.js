const mysql = require('mysql');
require('dotenv').config();

// Kreiraj konekciju ka bazi
const db = mysql.createConnection({
  //Oba se uvode jedan za lokalno drugi za jeavno testiranje
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: process.env.DB_PORT || process.env.MYSQLPORT,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE
});
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);

// Povezivanje
db.connect((err) => {
  if (err) {
    console.error('❌ Ne mogu da se povežem na bazu:', err);
    return;
  }
  console.log('✅ Povezan na bazu!');
});

module.exports = db;
