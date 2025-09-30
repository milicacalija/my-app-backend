
const express = require('express');
const router = express.Router();
const db = require('./database'); // import konekcije
const moment = require('moment-timezone'); // za Node.js
const logger = require('./logger');





router.get("/",function(req,res){ /*F-je koje imaju zahteve, moraju da imaju HTTP req i HTTP res, to su argumenti u zagradi u f-ji*/
    res.json({message:"Hello"})
});

router.get("/admin/", (req, res) => {
  const query = `
   SELECT 
      users.usr_id,
      users.usr_name,
      users.usr_email,
      users.usr_level,
      narudzbenice.nar_id,
      narudzbenice.nar_datum,
      narudzbenice.nar_cena,
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
    if (err) {
        results.forEach(r => logger.log(r.nar_id, r.nar_cena));
      logger.error("SQL greška:", err);
      return res.status(500).json({ error: err });
    }

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
          // Kreiraj narudžbenicu samo ako postoji nar_id
       if (row.nar_id) {
        let narudzbenica = usersMap[row.usr_id].narudzbenice.find(n => n.nar_id === row.nar_id);
        if (!narudzbenica) {
          narudzbenica = {
            nar_id: row.nar_id,
            nar_datum: row.nar_datum ? moment(row.nar_datum).tz('Europe/Belgrade').format('YYYY-MM-DD HH:mm:ss') : null,
  nar_cena: parseFloat(row.nar_cena), // <-- ovde parsiraš string u broj   
  //Stavke su bile upsane kao komentar zato sam imala problem sa greskom undefined push....pronadji u fajlu        
  stavke: []
          };
          usersMap[row.usr_id].narudzbenice.push(narudzbenica);
        }

// Ovo proverava da li narudzbenica postoji pre push
  if (row.stv_id && narudzbenica) {
              narudzbenica.stavke.push({
            stv_id: row.stv_id,
            fk_stv_pro_id: row.fk_stv_pro_id,
            stv_kolicina: row.stv_kolicina,
            uk_stv_cena: row.uk_stv_cena,
            pro_iupac: row.pro_iupac,
          });
        }
      }
    });

    res.json(Object.values(usersMap));

   
   
  });
});
router.get("/", function(req,res){

   
var search = req.query.search;


    
if(search === undefined){

    db.query("SELECT*FROM users", function(err,results,fields){
if (err) {
  logger.error(err);
  return res.status(500).json({ error: "Greška pri upitu" });
}
        res.json({"data": results})
    });

}
else{
    db.query("SELECT * FROM users WHERE usr_email LIKE ? OR usr_password LIKE ? ",["%"+search+"%", "%"+search+"%"],function(err,results,fields){
if (err) {
  logger.error(err);
  return res.status(500).json({ error: "Greška pri upitu" });
}
        /*Onda kazemo ako greska baci gresku, ispisi res.json results*/
        
         res.json({"data": results});
    }
    );
}
});

router.post ("/", function(req,res){
    /*Sad treba da primimo json, da hvatamo podatke*/
    var id = req.body.id;
    var name=req.body.name; 
    var email=req.body.email;
    var password=req.body.password;
   
    var phone=req.body.phone;
    var level=req.body.level;
    


    
    db.query("INSERT INTO users SET usr_name=?, usr_email=?, usr_password=?, usr_phone=?,usr_level=?",[name, email, password, phone, level,], 
    function(err,results,fields) {
       if (err) {
  logger.error(err);
  return res.status(500).json({ error: "Greška pri upitu" });
}

        logger.log(results);
        
    }) ;


    res.json ({"Result": "OK"});
   
});


router.put("/", function(req,res){
    /*Da bi mogli uspesno da izmeni podatak, treba nam id, da znamo koga menjamo i od toga pocinjemo*/
    var id = req.body.id;
    /*Prekopiramo sve prethodne zahteve*/
    var name =req.body.name; /*dakle slacemo zahtev pod imenom pib, pod ne query nego body zahtevom, zato sto post ima body za razliku od geta koji nema, getom mozemo samo slati upite u search baru pod ? dok kod post metode to mozemo preko body*/
    var email = req.body.email;
    var password = req.body.password;
   
    var phone =req.body.phone;
    var level =req.body.level;
    


db.query("UPDATE users SET usr_name=?, usr_email=?, usr_password=?, usr_phone=?,usr_level=?, WHERE usr_id=?",[name, email, password, phone, level], 
function(err,results,fields) {
    if (err) {
  logger.error(err);
  return res.status(500).json({ error: "Greška pri upitu" });
}

    logger.log(results);
    /*Results nam nije toliko bitno sada, ali ono sto nam je bitno kad se sve zavrsi da vratimo rezultat*/
    res.json ({"Result": "OK"});
}) ;

});


router.delete("/", function(req,res){
    /*Problem sa specifikacijom za DELETE, pa umseto body poslacemo podatke preko URL, tj query*/
var id= req.query.id;

db.query("DELETE FROM users WHERE usr_id=?",[id],
function(err,result, fields){
   if (err) {
  logger.error(err);
  return res.status(500).json({ error: "Greška pri upitu" });
}

    res.json({"Result":"OK"});
    
});
});
    
module.exports = router;
