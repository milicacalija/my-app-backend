
const express = require('express');
const router = express.Router();
const db = require('./database'); // import konekcije



db.query('SELECT * FROM kompanije', (err, results) => {
  if (err) {
    console.error('Greška pri upitu:', err);
    return; // umesto throw, da server ne crash-uje
  }
  console.log(results);
});

router.get("/",function(req,res){ /*F-je koje imaju zahteve, moraju da imaju HTTP req i HTTP res, to su argumenti u zagradi u f-ji*/
    res.json({message:"Hello"})
});

router.get("/", (req,res) => {
    const search = req.query.search;
    let sql = "SELECT * FROM kompanije";
    let params = [];

    if(search !== undefined) {
        sql += " WHERE kmp_naziv LIKE ? OR kmp_osoba LIKE ?";
        params = [`%${search}%`, `%${search}%`];
    }

    db.query(sql, params, (err, results) => {
        if(err) {
            console.error(err);
            return res.status(500).json({ error: "Greška pri upitu" });
        }
        res.json({ data: results });
    });
});




router.post("/kompanije", function(req, res){
  const pib = req.body.kmp_pib;
  const naziv = req.body.kmp_naziv;
  const adresa = req.body.kmp_adresa;
  const telefon = req.body.kmp_telefon;
  const email = req.body.kmp_email;
  const osoba = req.body.kmp_osoba;

  console.log("Pib:", pib); 
  console.log("Naziv:", naziv);
  console.log("Adresa:", adresa);
  console.log("Telefon:", telefon);  
  console.log("Email:", email);
  console.log("Osoba:", osoba);

  // Validacija
  if (!pib || !naziv) {
    return res.status(400).json({ message: "PIB i naziv kompanije su obavezni!" });
  }

  db.query(
    "INSERT INTO kompanije SET kmp_pib=?, kmp_naziv=?, kmp_adresa=?, kmp_telefon=?, kmp_email=?, kmp_osoba=?",
    [pib, naziv, adresa, telefon, email, osoba], 
    function(err, results) {
      if(err) {
        console.error(err);
        return res.status(500).json({ message: "Greška pri upisu kompanije" });
      }

      console.log("Kompanija dodata:", results);
      res.json({ message: "Kompanija uspešno dodata!", id: results.insertId });
    }
  );
});



router.delete("/kompanije", function(req,res){
    
var id= req.query.id;

db.query("DELETE FROM kompanije WHERE kmp_id=?",[id],
function(err,result,fields){
    if(err) throw err;
    res.json({"Result":"OK"});
    
});
});
    
module.exports = router;