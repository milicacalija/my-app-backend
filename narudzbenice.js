//Pozvana oba modeula iz pdfGenerator.js
const { generateOrderPDF, sendOrderPDFEmail } = require('./pdfGenerator');
const express = require('express');
const router = express.Router();
const db = require('./db.local'); // ovo mora biti konekcija
const moment = require('moment-timezone');
//Za kreiranje pdf dokumnata putem emaila, ali da ne budu izopacena slova koristi se paket instaliran puppeteer

    const path = require('path');

const cors = require('cors'); // <---- OVO DODAJES

// Inicijalizacija aplikacije


// Dohvatanje svih narudžbenica sa podacima o korisniku
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      n.nar_id, n.nar_datum, n.nar_cena, n.nac_plat,
      u.usr_id, u.usr_name, u.usr_email,
      s.stv_id, s.fk_stv_pro_id, s.stv_kolicina, s.uk_stv_cena,
      p.pro_iupac
    FROM narudzbenice n
    JOIN users u ON n.fk_nar_usr_id = u.usr_id
    JOIN stavke s ON s.fk_stv_nar_id = n.nar_id
    JOIN proizvodi p ON p.pro_id = s.fk_stv_pro_id
    ORDER BY n.nar_id DESC
    LIMIT ? OFFSET ?;
  `;

  db.query(query, [limit, offset], (err, results) => {
    if (err) {
      console.error('Greška prilikom dohvaćanja narudžbenica:', err);
      return res.status(500).json({ error: 'Greška prilikom dohvaćanja narudžbenica' });
    }

    // Grupisanje po narudžbenici
    const narudzbeniceMap = {};
    results.forEach(row => {
      if (!narudzbeniceMap[row.nar_id]) {
        narudzbeniceMap[row.nar_id] = {
          nar_id: row.nar_id,
          nar_datum: moment(row.nar_datum).tz('Europe/Belgrade').format('YYYY-MM-DD HH:mm:ss'),
          nar_cena: row.nar_cena,
          nac_plat: row.nac_plat,
          user: { usr_id: row.usr_id, usr_name: row.usr_name, usr_email: row.usr_email },
          stavke: []
        };
      }
      narudzbeniceMap[row.nar_id].stavke.push({
        stv_id: row.stv_id,
        fk_stv_pro_id: row.fk_stv_pro_id,
        stv_kolicina: row.stv_kolicina,
        uk_stv_cena: row.uk_stv_cena,
        pro_iupac: row.pro_iupac
      });
    });

    res.json(Object.values(narudzbeniceMap));
  });
});

router.post('/', async (req, res) => {
  const { fk_nar_usr_id, nar_datum, nar_cena, nac_plat, stavke = [] } = req.body;

  if (!fk_nar_usr_id || !nar_datum || !nar_cena || !nac_plat) {
    return res.status(400).json({ error: 'Nedostaju obavezni podaci' });
  }

  try {
    // 1) Ubaci narudžbenicu
    const insertResult = await new Promise((resolve, reject) => {
      const sqlNar = `
        INSERT INTO narudzbenice (nar_datum, fk_nar_usr_id, nar_cena, nac_plat)
        VALUES (?, ?, ?, ?)
      `;
      db.query(sqlNar, [nar_datum, fk_nar_usr_id, nar_cena, nac_plat], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    const nar_id = insertResult.insertId;//// ovo je redni broj narudžbenice

    // 2) Ubaci stavke
    let greske = [];
    if (stavke.length > 0) {
      for (const s of stavke) {
        //U terminalu cemo videti ako je stigla stavka super ako nije to znaci da je do frontenda a nee do backenda, tacnije iz frontenda ili iz test JSON-a ne stižu ta polja.
        console.log("📦 Stigla stavka:", s);
        const kolicina = Number(s.stv_kolicina) || 0;
        const cena = Number(s.stv_cena) || 0;
        const ukCena = kolicina * cena;

        try {
          // Lager
          const lagerRez = await new Promise((resolve, reject) => {
            db.query('SELECT pro_lager FROM proizvodi WHERE pro_id = ?', [s.fk_stv_pro_id], (err, results) => {
              if (err) return reject(err);
              resolve(results[0]);
            });
          });

          if (!lagerRez || lagerRez.pro_lager < kolicina) {
            greske.push(`Nema dovoljno na lageru za proizvod ${s.fk_stv_pro_id}`);
            continue;
          }
         

          // Insert stavke
          //Backend prima saomo fk_stv_pro_id: 118, uk_stv_cena: null, zato u bazi ne mozemo videti popunjena polja stv cena i uk stv cena kao ni stv kolicina },
          await new Promise((resolve, reject) => {
            const sqlStavka = `
              INSERT INTO stavke (fk_stv_pro_id, fk_stv_nar_id, stv_kolicina, stv_cena, uk_stv_cena)
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                stv_kolicina = stv_kolicina + VALUES(stv_kolicina),
                uk_stv_cena = VALUES(stv_cena) * VALUES(stv_kolicina)
            `;
            db.query(sqlStavka, [s.fk_stv_pro_id, nar_id, kolicina, cena, ukCena], (err) => {
              if (err) return reject(err);
              resolve();
            });
          });

          // Lager update
          await new Promise((resolve, reject) => {
            db.query('UPDATE proizvodi SET pro_lager = pro_lager - ? WHERE pro_id = ?', [kolicina, s.fk_stv_pro_id], (err) => {
              if (err) return reject(err);
              resolve();
            });
          });

        } catch (err) {
          greske.push(`Greška za proizvod ${s.fk_stv_pro_id}: ${err.message}`);
        }
      }
    }

    // 3) Dohvati korisnika i podatke za fakturu
    const userData = await new Promise((resolve, reject) => {
      const sqlUser = `
        SELECT users.usr_id, users.usr_name, users.usr_email, kompanije.kmp_adresa, kompanije.kmp_naziv 
        FROM users 
        LEFT JOIN kompanije ON users.fk_usr_kmp_id = kompanije.kmp_id
        WHERE users.usr_id = ?
      `;
      db.query(sqlUser, [fk_nar_usr_id], (err, results) => {
        if (err || results.length === 0) return reject(err || new Error("Nema korisnika"));
        resolve(results[0]);
      });
    });

    // 4) Dohvati proizvode
    const proIds = stavke.map(s => s.fk_stv_pro_id);
    const proRez = await new Promise((resolve, reject) => {
      const sqlPro = `SELECT pro_id, pro_iupac, pro_cena FROM proizvodi WHERE pro_id IN (?)`;
      db.query(sqlPro, [proIds], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    const stavkeSaNazivima = stavke.map(s => {
      const p = proRez.find(pr => pr.pro_id === s.fk_stv_pro_id);
      return {
        
            fk_stv_pro_id: s.fk_stv_pro_id,   // 👈 DODAJ OVO
        naziv: p ? p.pro_iupac : "Nepoznata stavka",
        stv_kolicina: s.stv_kolicina || 1,
        stv_cena: p ? p.pro_cena : 0,
        uk_stv_cena: (s.stv_kolicina || 1) * (p ? p.pro_cena : 0),
      };
    });

    // 5) Sastavi podatke za mejl
    const orderData = {
      nar_id,
      nar_datum,
      nar_cena,
      kupac_ime: userData.usr_name,
      kupac_firma: userData.kmp_naziv || "-",
      kupac_email: userData.usr_email,
      kupac_adresa: userData.kmp_adresa || "-",
      stavke: stavkeSaNazivima
    };

    // 6) Pošalji mejl sa PDF-om
    // POZIV U POZADINI
    sendOrderPDFEmail(userData.usr_email, orderData)
      .then(() => console.log("📧 PDF mejl poslat"))
      .catch(err => console.error("❌ Greška pri slanju PDF mejla:", err));

    // VRATI ODMAH ODGOVOR FRONTEND-U
    return res.status(201).json({
      success: true,
      message: 'Narudžbenica i stavke uspešno sačuvane, mejl se šalje u pozadini',
      nar_id,
      greske
    });

  } catch (err) {
    console.error('❌ Greška pri dodavanju narudžbenice:', err);
    return res.status(500).json({ error: 'Greška pri dodavanju narudžbenice', details: err.message });
  }
});


router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { fk_nar_user_id, fk_nar_kmp_id, nar_cena } = req.body;
    const nar_datum = moment().tz('Europe/Belgrade').format('YYYY-MM-DD HH:mm:ss');

    // Ažuriranje narudžbenice
    const query = 'UPDATE narudzbenice SET nar_datum = ?, fk_nar_user_id = ?, fk_nar_kmp_id = ?, nar_cena = ? WHERE nar_id = ?';
    db.query(query, [nar_datum, fk_nar_user_id, fk_nar_kmp_id, nar_cena, id], (err) => {
        if (err) {
            console.error('Error during UPDATE:', err);
            return res.status(500).json({ error: 'Došlo je do greške prilikom ažuriranja narudžbenice.' });
        }

        // Brisanje postojećih stavki
        const deleteQuery = 'DELETE FROM narudzbenice_stavke WHERE nar_id = ?';
        db.query(deleteQuery, [id], (err) => {
            if (err) {
                console.error('Error during DELETE:', err);
                return res.status(500).json({ error: 'Došlo je do greške prilikom brisanja stavki.' });
            }

            // Dodavanje novih stavki
            if (stavke && stavke.length > 0) {
                const queryStavke = 'INSERT INTO narudzbenice_stavke (nar_id, stv_id, fk_naruid, fk_stavid, narst_kolicina) VALUES ?';
                const values = stavke.map(stavka => [id, stavka.stv_id, stavka.fk_naruid, stavka.fk_stavid, stavka.narst_kolicina]);

                db.query(queryStavke, [values], async (err) => {
                    if (err) {
                        console.error('Error inserting order items:', err);
                        return res.status(500).json({ error: 'Error inserting order items' });
                    }

                    // Ažuriranje ukupne cene narudžbenice
                    await updateOrderTotalPrice(id);

                    res.json({ id: id });
                });
            } else {
                // Ako nema stavki, samo ažurirajte cenu
                 updateOrderTotalPrice(id);
                res.json({ id: id });
            }
        });
    });
});

/*APPI pozovemo za brisnje*/

/*APPI pozovemo za brisnje*/

router.delete("/", function(req, res){
  const id = req.query.id;

  // 1. Obriši sve stavke narudžbenice
  db.query("DELETE FROM stavke WHERE fk_stv_nar_id = ?", [id], function(err, result){
    if(err) {
      console.error("Greška pri brisanju stavki:", err);
      return res.status(500).json({ error: "Greška pri brisanju stavki" });
    }

    // 2. Obriši samu narudžbenicu
    db.query("DELETE FROM narudzbenice WHERE nar_id = ?", [id], function(err2, result2){
      if(err2) {
        console.error("Greška pri brisanju narudžbenice:", err2);
        return res.status(500).json({ error: "Greška pri brisanju narudžbenice" });
      }

      res.json({ Result: "OK" });
    });
  });
  //Glavni uzrok: await sendOrderPDFEmail(...) traje predugoNa samom kraju rute imaš liniju:
 // await sendOrderPDFEmail(userData.usr_email, orderData);Ako slanje mejla (npr. preko nodemailer, gmail, ethereal itd.) traje duže od 10 sekundi→ frontend axios čeka na odgovor i posle 10 sekundi baca grešku:AxiosError: timeout of 10000ms exceeded (ECONNABORTED)Backend zapravo završi posao kasnije, ali Vue to više ne sačeka — već prikaže poruku o grešci.  Da bih bolje organizovala te funkcije samo sam napravila zasebno fajl pdfGenerator.js i iz njega pozvala oba modula ovde u narudzbenice.js

});

    
module.exports = router;
