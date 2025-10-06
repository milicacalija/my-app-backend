const express = require('express');
const router = express.Router();
const db = require('./db.local.js'); // konekcija
const moment = require('moment-timezone'); // za formatiranje datuma



// 2️⃣ POST - dodavanje korisnika
router.post('/', (req, res) => {
  const { name, email, password, phone, level } = req.body;

  db.query(
    "INSERT INTO users SET usr_name=?, usr_email=?, usr_password=?, usr_phone=?, usr_level=?",
    [name, email, password, phone, level],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Greška pri upitu" });
      }
      res.json({ Result: "OK", insertedId: results.insertId });
    }
  );
});

// 3️⃣ PUT - izmena korisnika
router.put('/', (req, res) => {
  const { id, name, email, password, phone, level } = req.body;

  db.query(
    "UPDATE users SET usr_name=?, usr_email=?, usr_password=?, usr_phone=?, usr_level=? WHERE usr_id=?",
    [name, email, password, phone, level, id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Greška pri upitu" });
      }
      res.json({ Result: "OK" });
    }
  );
});

// 4️⃣ DELETE - brisanje korisnika
router.delete('/', (req, res) => {
  const id = req.query.id;

  db.query("DELETE FROM users WHERE usr_id=?", [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Greška pri upitu" });
    }
    res.json({ Result: "OK" });
  });
});

module.exports = router;
