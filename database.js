const mysql = require('mysql');

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE
});

db.connect((err) => {
  if (err) {
    console.error('Ne mogu da se povežem na bazu:', err);
    return;
  }
  console.log('Povezan na bazu!');
});
