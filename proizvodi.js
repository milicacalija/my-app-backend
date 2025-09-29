/*Povezivanje NOde sa MySql*, posle toga kazemo db .dbect damo f-ju i ako nesto pukne da nam izbaci exception , time ce se server srusiti, ali znamo zasto,  ili ako je sve u redu da ispise u console dbected*/
var mysql= require("mysql");
const express = require("express");
const router = express.Router();


/*zatim treba napraviti konekciju uz pomoc var db taj sam malo kasnije zapisala, kod var db imamo host to je lokalhot, user, to je kod nas rooter, password koji koristim za mysql, database je naziv seme koju zelim da povezem */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


module.exports = db;
/*Da bismo napravili konekciju kazemo, ako se desi glupost izbaci gresku, greske mogu biti posledica ako nesto iz podataka kao sto je username, password, schema itd nije tacno uneto, i ako se ne uhvati exception rusi se celo okruzenje servera, to nam je veoma vazno, da ne bi ispalo da server radi a nema nikakvu konekciju sa bazom!*/
db.dbect((err) => {
    if(err) throw err;
    console.log("MySql dbected");

});
/*Da ne bi ispalo da server ne radi nista, ako nam neko dodje na HOME stranu, mi cemo njega da pozdravimo i kazemo HELLO! Ovo je primer najbanalnijeg servera*/
router.get("/",function(req,res){ /*F-je koje imaju zahteve, moraju da imaju HTTP req i HTTP res, to su argumenti u zagradi u f-ji*/
    res.json({message:"Hello"})
});
/*Hocu da podatke prikazem sa baze na frontendu, npr tabela kompanije, komuniciramo sa appijem preko GET metode*/
//Da se pretrazi prema piktogramu ili prema primeni
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


/*Zatim uvodimo prolazimo kroz if naredbu, oznaka!== znaci nije/
ali se posle predavac ispravio pa je napisao === da jeste, dakle ako jeste undefined radi normalno, znaci nismo prosledili nikakv search vrati ih sve, */
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
else{/*a ako nije undefined, u uglastoj zagradi saljemo niz stvari koje treba da se zamene, treba da se stavi search na prvom mestu, zatim search na drugom mestu, a ti nam je nasa promenljiva var search, i saljemo treci argument function sa err, results, fields, zatvorimo db.query, Na pocetku preedavac je napravio gresku a toje bilo ummesto or and i prepare statement a to je '%' gde ne trabe i odmah je pukao server i izbacio gresku, sto znaci, posto upitnik zamenjuje onim sto smo poslali, a mi zelimo ono sto on zamenjuje da bude ? prosledjeno (to je ono sto se nalazi u uglastoj zagradi kod search(), onda smo napravili izmenu i napisali kod kako treba?*/
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



       
            
            


/*Nakon sto smo ubacili podatke u tabelu kompanije, preko frontenda, sad treba poslati infotmacije backendu to sto smo uneli u input, ovo se inace zovu restfull APPIJI, to znaci da mi pravimo dogovor kakvu zelimo putanju da komunicira sa bazom preko koje metode i sta nam ta metoda vraca, to je ona glavna razlika izmedju GET i POST metode, GET dobijamo podatke a POST pravi podatke, npr PUT metoda mozemo iskoristiti da izmenimo podatke ali msm da u ovom trenutku za moju bazu to nece biti potrebno, mozda cu iskoristiti za proizvode kad budem kreirala prodavnicu, ako mi bude zatrebao taj deo imam na predvanju DATA ACESS /4/4 posle 2.20h, vervatno cu koristiti za tabelu proizvodi!*/
router.post("/proizvodi", function(req, res) {
  console.log("📥 Request body:", req.body);


  //Ovaj pristup:koristi INSERT INTO ... (kolone) VALUES (?, ?, ...) umesto SET (često je manje problematično).eksplicitno parsira tipove (parseInt, parseFloat) → sprečava greške tipa “Incorrect decimal value”.ignoriše kolone pro_id, fk_usr_id, fk_stv_id → jer se one dodaju kasnije ili su auto-increment / nullable.

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
    console.error("❌ Greška u INSERT upitu:", err);
    return res.status(500).json({ error: "Greška pri upisu u bazu" });
  }
  res.json({ message: "Proizvod uspešno dodat", id: result.insertId });
});
});

                
 /*Results nam nije toliko bitno sada, ali ono sto nam je bitno kad se sve zavrsi da vratimo rezultat*/


/*Greska koja se javlja kao kl ne moze  vise poslati zahteva od jednog, to je zato sto imamo negde pogresno zatvorene zagrade u nekim kodovima ili res.json zahtev treba obrisati ako ima bespotrebno previse*/ 
    /* Http request funkcionise tako sto posaljemo zahtev serveru i dobijemo odgovor, zato treba pozvati res json da da odgovor korisniku nakon poslatog zahtev*/
   /* res.json ({"Result": "OK"});//ovo je prerano Ti sada vraćaš res.json({"Result":"OK"}) odmah posle db.query, ali query radi asinhrono.To znači: Express šalje odgovor pre nego što se INSERT završi, i ako još jednom pokušaš poslati res.json iz callback-a → dobićeš grešku Cannot set headers after they are sent.
    /*Mi nakon poslatog zahteva post metodom ocekujemo da nam se u terminalu ispisu argumenti//Treba da šalješ odgovor unutra u callbacku, nakon što se query uspešno izvrši:*/



    /*Sa bazom pricamo tako sto uzmemo konekcciju koju smo otvorili tako sto kazemo db.query, queri ima minimum 3 argumenta, prvi argument je sql upit koji zelimo da izvrsimo, ako zelimo neke stvari da ubacimo u upit kao promenljive to bi bio drugi argument, posto mi to nemamo odmah prelazimo na treci argument a to je function koji prima 3 stvari,prima gresku ako se desila, rezulatate upita i polja, polja cemo retko koristiti! Query f-ja je asihrona, zato sto prima callback */
  
/*U pravom zivotu kad budemo radili upite ne smemo bacati error ovako if(err) throw err;zato sto ako se lose iskomunicira sa bazom, ceo server ce se srusiti, sto generalno ne zelimo, zelimo da to nekako vratimo korisniku  a da server nastavi da radi, u ovom trenutku ustedece nam manje zivaca jer samo mi koristimo ovaj server pa mozemo ovako bacati error*/

/*Da vratimo rezultate ono sto smo dobili iz baze, dakle vracamo neki object, pod kljucem objekta vracamo results*/



/*Ovaj upitnik i procenat u njemu znaci prepare statement, U srednjoj zagradi saljemo niz stvari koje treba da se zamene i dodamo treci argument, zatim zatvorimo dbection query*/
   
    
/*Ako zelimo da izmenimo podatke u bazi, bice i toga onda treba da ubacimo novu metodu i po dogovoru neka to bude put metoda*/

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

/*Jedina razlika je u dbquery koji ce imati drugaciji upit, UMESTO INSERT UPDATE i JAKO JE VAZNO DA KAZEMO WHERE U UPITU, JER AKO NE STAVIMO, AUTOMATSKI CEMO SVE PODATKE IZ BAZE IZGUBITI, ODN SVI CE IMATI ISTI PODATAK, Dakle mnogo je vazno za DELETE I UPDATE staviti u upitu WHERE*/

db.query("UPDATE proizvodi SET  pro_iupac=?, pro_cena=?, pro_kolicina=?, pro_jedinicamere=?, pro_rok=?, pro_lager=? tip_hemikalije=? WHERE pro_id=?", [naziv, iupac, cena, kolicina, jedinicamere, rok, lager, tip, id], 

function(err,results,fields) {
    if(err) throw err;
    console.log(results);
    /*Results nam nije toliko bitno sada, ali ono sto nam je bitno kad se sve zavrsi da vratimo rezultat*/
    res.json ({"Result": "OK"});
}) ;

/*Greska koja se javlja kao kl ne moze  vise poslati zahteva od jednog, to je zato sto imamo negde pogresno zatvorene zagrade u nekim kodovima ili res.json zahtev treba obrisati ako ima bespotrebno previse*/ 
/* Http request funkcionise tako sto posaljemo zahtev serveru i dobijemo odgovor, zato treba pozvati res json da da odgovor korisniku nakon poslatog zahtev*/



});
/*APPI pozovemo za brisnje*/

router.delete("/proizvodi", function(req,res){
    /*Problem sa specifikacijom za DELETE, pa umseto body poslacemo podatke preko URL, tj query*/
var id= req.query.id;
/*Imala sam gresku sa upitom u smislu nije hteo da mi obrise zato sto u sintaksi nisam imala zarez na kraju upitnika , kad se obrise komapnija, server tu infromaciju ne komentarise*/
db.query("DELETE FROM proizvodi WHERE pro_id=?",[id],
function(err,result,fields){
    if(err) throw err;
    res.json({"Result":"OK"});
    /*Kad budemo radili validaciju, npr ako je result OK refresh usere ako je result error, prikazi msg */
});
});
    
module.exports = router;
