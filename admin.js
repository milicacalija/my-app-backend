const express = require('express');
const router = express.Router();
const db = require('./db.local'); // ovo mora biti konekcija
const moment = require('moment-timezone');

// GET korisnici sa narudžbenicama i stavkama
router.get("/users", (req, res) => {
  const query = `
    SELECT 
      users.usr_id,
      users.usr_name,
      users.usr_email,
      users.usr_level,
      narudzbenice.nar_id,
      narudzbenice.nar_datum,
      narudzbenice.nar_cena,
      narudzbenice.nac_plat,
      stavke.stv_id,
      stavke.fk_stv_pro_id,
      stavke.stv_kolicina,
      stavke.uk_stv_cena,
      proizvodi.pro_iupac
    FROM users
    LEFT JOIN narudzbenice ON narudzbenice.fk_nar_usr_id = users.usr_id
    LEFT JOIN stavke ON stavke.fk_stv_nar_id = narudzbenice.nar_id
    LEFT JOIN proizvodi ON proizvodi.pro_id = stavke.fk_stv_pro_id
    ORDER BY users.usr_id, narudzbenice.nar_id;
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    const usersMap = {};

    results.forEach(row => {
      // Kreiraj korisnika ako ne postoji
      if (!usersMap[row.usr_id]) {
        usersMap[row.usr_id] = {
          usr_id: row.usr_id,
          usr_name: row.usr_name,
          usr_email: row.usr_email,
          usr_level: row.usr_level,
          narudzbenice: []
        };
      }

      // Kreiraj narudžbenicu samo ako postoji
      if (row.nar_id) {
        let nar = usersMap[row.usr_id].narudzbenice.find(n => n.nar_id === row.nar_id);
        if (!nar) {
          nar = {
            nar_id: row.nar_id,
            nar_datum: row.nar_datum ? moment(row.nar_datum).tz('Europe/Belgrade').format('YYYY-MM-DD HH:mm:ss') : null,
            nar_cena: parseFloat(row.nar_cena),
            nac_plat: row.nac_plat,
            stavke: []
          };
          usersMap[row.usr_id].narudzbenice.push(nar);
        }

        // Dodaj stavku proizvoda
        if (row.stv_id) {
          nar.stavke.push({
            stv_id: row.stv_id,
            fk_stv_pro_id: row.fk_stv_pro_id,
            stv_kolicina: row.stv_kolicina,
            uk_stv_cena: row.uk_stv_cena,
            pro_iupac: row.pro_iupac
          });
        }
      }
    });

    res.json(Object.values(usersMap));
  });
});

module.exports = router;
