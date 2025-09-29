const express = require('express');
const router = express.Router();
const db = require('./database'); // import konekcije
const logger = require('./logger');

router.get('/', (req, res) => {
  db.query('SELECT * FROM poruke ORDER BY por_time DESC', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Greška pri dohvatanju poruka' });
    res.json(rows);
  });
});
// ✉️ Dodavanje nove poruke
router.post('/', (req, res) => {
  const { fk_user_sender, user_id_reciver, por_content, tip } = req.body;

  if (!por_content) {
    return res.status(400).json({ message: 'Sadržaj je obavezan' });
  }
//Tako će:Ulogovani korisnik imati fk_user_sender = njihov ID i user_anonim = NULL.Anonimni korisnik imati fk_user_sender = NULL i user_anonim = -1.
  // Odredi da li je anonimni korisnik
  const user_anonim = fk_user_sender ? null : -1;

  const query = `
    INSERT INTO poruke (fk_user_sender, user_id_reciver, por_content, tip, por_time, user_anonim)
    VALUES (?, ?, ?, ?, NOW(), ?)
  `;

  db.query(
    query,
    [
      fk_user_sender || null,   // ID korisnika ili NULL
      user_id_reciver || null,  // ID primaoca
      por_content,
      tip || 'poruka',
      user_anonim               // -1 za anonimnog, NULL za ulogovanog
    ],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Greška pri upisu poruke', err });
      res.json({ message: 'Poruka uspešno poslata!', id: result.insertId });
    }
  );
});
// 🔹 Dohvatanje svih poruka
router.get('/all', (req, res) => {
  db.query('SELECT * FROM poruke ORDER BY por_time DESC', (err, rows) => {
    if (err) return res.status(500).json({ message: 'Greška pri dohvatanju poruka' });
    res.json(rows);
  });
});

// 🔹 Promena statusa poruke
router.put('/:id/status', (req, res) => {
  const por_id = req.params.id;
  const { status } = req.body;

  if (!status) return res.status(400).json({ message: 'Status je obavezan' });

  db.query('UPDATE poruke SET status=? WHERE por_id=?', [status, por_id], (err) => {
    if (err) return res.status(500).json({ message: 'Greška pri ažuriranju statusa' });
    res.json({ message: 'Status uspešno promenjen' });
  });
});

module.exports = router; // VAŽNO!
