/*Povezivanje NOde sa MySql*, posle toga kazemo db .dbect damo f-ju i ako nesto pukne da nam izbaci exception , time ce se server srusiti, ali znamo zasto,  ili ako je sve u redu da ispise u console dbected*/
const express = require('express');
const router = express.Router();
const db = require('./database'); // import konekcije
const logger = require('./logger');
router.get("/proizvodi/:id", function(req, res) {
  const id = req.params.id;
  const query = `
    SELECT proizvodi.*, specifikacije.*
    FROM proizvodi
    JOIN specifikacije ON proizvodi.pro_id = specifikacije.fk_spe_pro_id
    WHERE proizvodi.pro_id = ?;
  `;
  db.query(query, [id], function(err, results) {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).send({ message: "Proizvod nije pronađen" });
    res.json(results[0]);
  });
});



router.get("/proizvodi", function(req,res){
     /*Sad treba napraviti filter, search bar, npr ako unese korisnik er da mu prikaze sve sto sadrzi er, to se postize putem upita WHERE*/
var search = req.query.search;



if (search === undefined) {
    const query = `
        SELECT proizvodi.*, specifikacije.*
        FROM proizvodi
        JOIN specifikacije ON proizvodi.pro_id = specifikacije.fk_spe_pro_id;
    `;
    db.query(query, function (err, results) {
        if (err) throw err;
        res.json({ data: results });
    });
}
else{
    const query = `
    SELECT proizvodi.*, specifikacije.*
    FROM proizvodi
    JOIN specifikacije ON proizvodi.pro_id = specifikacije.fk_spe_pro_id
    WHERE proizvodi.pro_iupac LIKE ? OR proizvodi.pro_iupac LIKE ?;
`;
db.query(query, ["%" + search + "%", "%" + search + "%"], function (err, results) {
    if (err) throw err;
    res.json({ data: results });
});
}
});



       
            
            
router.post("/proizvodi", function(req, res) {
  logger.log("📥 Request body:", req.body);


  const sql = `
  INSERT INTO proizvodi 
    (pro_iupac, pro_cena, pro_kolicina, pro_jedinicamere, pro_rok, pro_lager, tip_hemikalije)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

const { iupac, cena, kolicina, jedinicamere, rok, lager, tip } = req.body;

const values = [
  iupac,
  parseFloat(cena),      // decimal
  parseInt(kolicina),    // int
  jedinicamere,
  parseInt(rok),
  parseInt(lager),
  tip
];

db.query(sql, values, (err, result) => {
  if (err) {
    logger.error("❌ Greška u INSERT upitu:", err);
    return res.status(500).json({ error: "Greška pri upisu u bazu" });
  }
  res.json({ message: "Proizvod uspešno dodat", id: result.insertId });
});
});

                

router.put("/proizvodi", function(req,res){
    /*Da bi mogli uspesno da izmeni podatak, treba nam id, da znamo koga menjamo i od toga pocinjemo*/
    var id = req.body.id;
    /*Prekopiramo sve prethodne zahteve*/
    
var iupac = req.body.iupac;
var cena = req.body.cena;
var kolicina = req.body.kolicina;
var jedinicamere = req.body.jedinicamere;
var rok = req.body.rok;
var lager = req.body.lager;
var tip = req.body.tip;


db.query("UPDATE proizvodi SET  pro_iupac=?, pro_cena=?, pro_kolicina=?, pro_jedinicamere=?, pro_rok=?, pro_lager=? tip_hemikalije=? WHERE pro_id=?", [naziv, iupac, cena, kolicina, jedinicamere, rok, lager, tip, id], 

function(err,results,fields) {
    if(err) throw err;
    logger.log(results);
    /*Results nam nije toliko bitno sada, ali ono sto nam je bitno kad se sve zavrsi da vratimo rezultat*/
    res.json ({"Result": "OK"});
}) ;




});
/*APPI pozovemo za brisnje*/

router.delete("/proizvodi", function(req,res){
    /*Problem sa specifikacijom za DELETE, pa umseto body poslacemo podatke preko URL, tj query*/
var id= req.query.id;

db.query("DELETE FROM proizvodi WHERE pro_id=?",[id],
function(err,result,fields){
    if(err) throw err;
    res.json({"Result":"OK"});
    /*Kad budemo radili validaciju, npr ako je result OK refresh usere ako je result error, prikazi msg */
});
});
    
module.exports = router;
