/*Povezivanje NOde sa MySql*, posle toga kazemo db .dbect damo f-ju i ako nesto pukne da nam izbaci exception , time ce se server srusiti, ali znamo zasto,  ili ako je sve u redu da ispise u console dbected*/
const express = require('express');
const router = express.Router();
const db = require('./db.local'); // ovo mora biti konekcija


router.get("/proizvodi", function(req, res) {
    var tpr_id = req.query.tpr_id;

    if (tpr_id === undefined) {
        db.query("SELECT proizvodi.pro_iupac FROM proizvodi JOIN proizvodi_tipoviprimene ON proizvodi.pro_id = proizvodi_tipoviprimene.pro_id", function(err, results, fields) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Database query error' });
                return;
            }
            res.json({ data: results });
        });
    } else {
        db.query("SELECT proizvodi.pro_iupac FROM proizvodi JOIN proizvodi_tipoviprimene ON proizvodi.pro_id = proizvodi_tipoviprimene.pro_id WHERE proizvodi_tipoviprimene.tpr_id = ?", [tpr_id], function(err, results, fields) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Database query error' });
                return;
            }
            res.json({ data: results });
        });
    }
});

// GET metoda za prikazivanje tipova primene na osnovu pro_id
router.get('/', function(req, res) {
    const search = req.query.search;
    //Jako vazan sql upit, da povezemo tabele da bi se pravilno pro id ucitavao
    const query = `
      SELECT p.pro_id, p.pro_iupac, t.tpr_naziv
      FROM proizvodi p
      JOIN proizvodi_tipoviprimene pt ON pt.pro_id = p.pro_id
      JOIN tipoviprimene t ON t.tpr_id = pt.tpr_id
      ORDER BY t.tpr_naziv, p.pro_iupac
    `;
    const values = [`%${search}%`, `%${search}%`, `%${search}%`];
  
    db.query(query, values, function(err, results) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database query failed' });
      }
      res.json({ data: results });
    });
  });
/*Ovo se sve zovu rest full APIJI,rest full je samo dogovor,to znaci ove putanje koje imamo npr router.get/kompanije, to su imenice i tako nam se zovu apiji, to mogu biti kompanije, proizvodi,studenti, ispiti itd..a onda u zavisnosti od metode zavisi sta radimo  Recimo GET polozeni ispiti verovatno nam vraca poloznene ispite, POST polozeni ispiti pravi neki novi polozeni ispit, PUT ILI PATCH menja neke podatke o poloznemo ispitu I DELETE brise neki polozeni ispit, TO JE SAMO DOGOVOR!*/

/*Nakon sto smo ubacili podatke u tabelu kompanije, preko frontenda, sad treba poslati infotmacije backendu to sto smo uneli u input, ovo se inace zovu restfull APPIJI, to znaci da mi pravimo dogovor kakvu zelimo putanju da komunicira sa bazom preko koje metode i sta nam ta metoda vraca, to je ona glavna razlika izmedju GET i POST metode, GET dobijamo podatke a POST pravi podatke, npr PUT metoda mozemo iskoristiti da izmenimo podatke ali msm da u ovom trenutku za moju bazu to nece biti potrebno, mozda cu iskoristiti za proizvode kad budem kreirala prodavnicu, ako mi bude zatrebao taj deo imam na predvanju DATA ACESS /4/4 posle 2.20h, vervatno cu koristiti za tabelu proizvodi!*/

router.post ("/", function(req,res){
    /*Sad treba da primimo json, da hvatamo podatke*/
    var naziv = req.body.naziv; /*dakle slacemo zahtev pod imenom pib, pod ne query nego body zahtevom, zato sto post ima body za razliku od geta koji nema, getom mozemo samo slati upite u search baru pod ? dok kod post metode to mozemo preko body*/


    /* Kako uneti stvari u bazu, to ide putem upita insert, u zagradi uglastoj saljemo argumente istim redosledom koji smo u upitu insert stavili*/
    db.query("INSERT INTO tipoviprimene SET tpr_naziv=?",[naziv], 
    function(err,results,fields) {
        if(err) throw err;
        console.log(results);
        /*Results nam nije toliko bitno sada, ali ono sto nam je bitno kad se sve zavrsi da vratimo rezultat*/
        /*res.json ({"Result": "OK"});*/
    }) ;

    /*Greska koja se javlja kao kl ne moze  vise poslati zahteva od jednog, to je zato sto imamo negde pogresno zatvorene zagrade u nekim kodovima ili res.json zahtev treba obrisati ako ima bespotrebno previse*/ 
    /* Http request funkcionise tako sto posaljemo zahtev serveru i dobijemo odgovor, zato treba pozvati res json da da odgovor korisniku nakon poslatog zahtev*/
    res.json ({"Result": "OK"});
    /*Mi nakon poslatog zahteva post metodom ocekujemo da nam se u terminalu ispisu argumenti*/

});

/*Napravicemo jednu metodu za izmenu podataka iz baze na frontendu, metoda put*/

router.put("/", function(req,res){
    /*Da bi mogli uspesno da izmeni podatak, treba nam id, da znamo koga menjamo i od toga pocinjemo*/
    var id = req.body.id;
    /*Prekopiramo sve prethodne zahteve*/
  
    var naziv = req.body.naziv;

    /*Jedina razlika je u dbquery koji ce imati drugaciji upit, UMESTO INSERT UPDATE i JAKO JE VAZNO DA KAZEMO WHERE U UPITU, JER AKO NE STAVIMO, AUTOMATSKI CEMO SVE PODATKE IZ BAZE IZGUBITI, ODN SVI CE IMATI ISTI PODATAK, Dakle mnogo je vazno za DELETE I UPDATE staviti u upitu WHERE*/

    db.query("UPDATE tipoviprimene SET tpr_naziv=? WHERE tpr_id=?",[naziv, id], 
function(err,results,fields) {
    if (err) {
  console.error(err);
  return res.status(500).json({ error: "Greška pri upitu" });
}

    console.log(results);
    /*Results nam nije toliko bitno sada, ali ono sto nam je bitno kad se sve zavrsi da vratimo rezultat*/
    res.json ({"Result": "OK"});
});

/* Http request funkcionise tako sto posaljemo zahtev serveru i dobijemo odgovor, zato treba pozvati res json da da odgovor korisniku nakon poslatog zahtev*/

});

/*APPI pozovemo za brisnje*/

router.delete("/", function(req,res){
    /*Problem sa specifikacijom za DELETE, pa umseto body poslacemo podatke preko URL, tj query*/
var id= req.query.id;
/*Imala sam gresku sa upitom u smislu nije hteo da mi obrise zato sto u sintaksi nisam imala zarez na kraju upitnika , kad se obrise komapnija, server tu infromaciju ne komentarise*/


db.query("DELETE FROM tipoviprimene WHERE tpr_id=?",[id],
function(err,result,fields){
    if(err) throw err;
    res.json({"Result":"OK"});
    /*Kad budemo radili validaciju, npr ako je result OK refresh usere ako je result error, prikazi msg */

});

});


module.exports = router;
