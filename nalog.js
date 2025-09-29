const express = require('express');
const router = express.Router();
const db = require('./database'); // import konekcije
const logger = require('./logger');
app.use(express.json());

// Test ruta
router.get('/', (req, res) => {
  res.json({ message: 'Ruta /nalog radi!' });
});

// Registracija
router.post('/register', (req, res) => {
  const { usr_name, usr_email, usr_password, usr_phone, fk_usr_kmp_id } = req.body;
//JavaScript ne dozvoljava da isti identifikator bude deklarisan dva puta u istom opsegu → zato ti je podvučeno, jer ako na pocetku definises kontante onda ne treba posebno nakon toga definisati ponovo, u konstatni se ne navodi usr_level jer ga hardkodujemo
   
  //Ukloni fk user km pid, jer prilikom registracije ako unosis novu kompaniju trazice da li vec postoji a ne postoji u listi kompanija
  if (!usr_name || !usr_email || !usr_password || !usr_phone ) {
    return res.status(400).json({ message: "Sva polja su obavezna!" });
  }
   const usr_level = 1; // običan korisnik // običan korisnik uvek dobija level 1, svako ko se registruje naknadno je obican korsinik

  // Provera da li već postoji email
  db.query('SELECT * FROM users WHERE usr_email = ?', [usr_email], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Greška na serveru' });
    if (rows.length > 0) return res.status(400).json({ message: 'Email je već registrovan' });
   

    // Ovdje možeš nastaviti sa ubacivanjem korisnika u tabelu users, e sad u values mi smo imali 0 na petoj poziciji iza zareza, sto znaci automatski dodeljujemo usr level 0 svakom novom korisniku a to tako ne treba, vec umesto 0 pisemo upitnik
    const query = `
      INSERT INTO users 
      (usr_name, usr_email, usr_password, usr_phone, usr_level, fk_usr_kmp_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
      //fk_nar_id nije definisana nigde u kodu → greška. Zato smo stavili NULL, jer prilikom registracije korisnika ne unosimo narudzbenicu, to ce se kasnije dodeljivati
      query,
      [usr_name, usr_email, usr_password, usr_phone, usr_level, fk_usr_kmp_id ],
      (err2, result) => {
        if (err2) return res.status(500).json({ message: 'Greška pri upisu korisnika' });
        res.json({ message: 'Nalog uspešno kreiran!', id: result.insertId });
      }
    );
  });
  });
  

// Login
router.post('/login', (req, res) => {
  const { usr_email, usr_password } = req.body;

  db.query(
    'SELECT * FROM users WHERE usr_email = ? AND usr_password = ?',
    [usr_email, usr_password],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Greška na serveru' });
      if (rows.length === 0) return res.status(400).json({ message: 'Pogrešan email ili lozinka' });
      res.json({ message: 'Uspešno logovanje!', user: rows[0] });
    }
  );
});

module.exports = router;
