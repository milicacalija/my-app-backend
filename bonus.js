// bonus.js
const express = require('express');
const mysql = require('mysql'); // koristimo mysql2
const cors = require('cors');
const router = express.Router();


require("dotenv").config(); //Da bi se PORT prilagodio public reilway
// Kreiramo pool konekciju (stabilnije za više zahteva)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});



// ================== GET: svi bonusi ==================
router.get('/bonus', (req, res) => {
    const query = `
       SELECT 
    b.bns_id,
    b.fk_bns_nar_id,
    b.fk_bns_pro_id,
    b.fk_bns_stv_id,
    b.bns_popust,
    n.nar_cena,
        n.nar_cena - b.bns_popust AS cena_sa_popustom
FROM bonus_narudzbenice b
JOIN narudzbenice n ON b.fk_bns_nar_id = n.nar_id
ORDER BY b.bns_id;
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Greška prilikom GET bonus:', err);
            return res.status(500).json({ error: err });
        }
        res.json({ data: results });
    });
});

// ================== POST: dodavanje novog bonusa ==================
router.post('/bonus', (req, res) => {
    const { fk_bns_nar_id, fk_bns_pro_id, fk_bns_stv_id, bns_popust } = req.body;

    // Provera obaveznih polja
    if (!fk_bns_nar_id || !bns_popust) {
        return res.status(400).json({ error: "fk_bns_nar_id i bns_popust su obavezni" });
    }

    const query = `
        INSERT INTO bonus_narudzbenice
        (fk_bns_nar_id, fk_bns_pro_id, fk_bns_stv_id, bns_popust)
        VALUES (?, ?, ?, ?)
    `;

    pool.query(
        query,
        [fk_bns_nar_id, fk_bns_pro_id || null, fk_bns_stv_id || null, bns_popust],
        (err, result) => {
            if (err) {
                console.error('Greška prilikom POST bonus:', err);
                return res.status(500).json({ error: err });
            }
            res.json({ message: 'Bonus uspešno dodat!', bonusId: result.insertId });
        }
    );
});


module.exports = router;