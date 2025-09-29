/*Na pocetku mi je izbacivalo gresku cors is not defined, zato sto uopste nisam definisala promenljivu cors, a kad izbaci gresku module not found to znaci da cors paket treba instalirati */
const cors = require('cors');
const jwt = require('jsonwebtoken');//Za zastitu, da ne bi bilo ko mogao uci na stranicu admin
const db = require('./database'); // konekcija iz database.js

const express = require("express");
const router = express.Router();




// Primena CORS middleware samo na određene rute





// Middleware za admin
// ========================
function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization']; 
  if (!authHeader) return res.status(401).json({ message: 'Niste prijavljeni' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token nije prosleđen' });

  try {
    const decoded = jwt.verify(token, '3f8a1b2c-9d4e-4f6b-a7c1-8e5f2d7a9b3c'); // <-- koristi svoj secret
    if (decoded.usr_level !== 0) {   // 0 = admin
      return res.status(403).json({ message: 'Nema pristup admin stranici' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Nevažeći token' });
  }
}








router.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  console.log("Email:", email);
  console.log("Password:", password);

  db.query(
    //Da pri logovanju odmah znamo email i naziv kompanije korisnika, informacije hvatamo u local storage
    "SELECT usr_id, usr_name, usr_email, usr_password, usr_phone, usr_level,  kompanije.kmp_naziv, kompanije.kmp_pib, kompanije.kmp_adresa FROM users LEFT JOIN kompanije ON users.fk_usr_kmp_id = kompanije.kmp_id WHERE usr_email=? AND usr_password=?",
    [email, password],
    (err, rows, fields) => {
      if (err) {
        console.error('Greška prilikom izvršavanja SQL upita:', err);
        res.status(500).json({"Result": "ERR", "Message": "Internal Server Error"});
        return;
      }
      console.log('Rows from database:', rows);

      if (rows.length === 0) {
        res.status(401).json({"Result": "ERR", "Message": "Invalid credentials"});
        return;
      }
      const user = rows[0];

      // Generiši JWT token
      const token = jwt.sign(
        {
          usr_id: user.usr_id,
          usr_level: user.usr_level,
          usr_name: user.usr_name,
          usr_email: user.usr_email
        },
        '3f8a1b2c-9d4e-4f6b-a7c1-8e5f2d7a9b3c', // promeni na neki jak secret
        { expiresIn: '2h' }
      );

      

    res.json({"Result": "OK", "data": user, "token": token});
      console.log('Login uspešan, token poslat');
        
      });
    }
  );
  // Zaštićena admin ruta primer
// ========================
router.get("/admin/users", adminAuth, (req, res) => {
  db.query("SELECT * FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

module.exports = router;

    

