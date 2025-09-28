/*Povezivanje NOde sa MySql*, posle toga kazemo conn .connect damo f-ju i ako nesto pukne da nam izbaci exception , time ce se server srusiti, ali znamo zasto,  ili ako je sve u redu da ispise u console connected*/
var mysql= require("mysql");
const express = require("express");
const router = express.Router();
const moment = require('moment-timezone'); // za Node.js


/*zatim treba napraviti konekciju uz pomoc var conn taj sam malo kasnije zapisala, kod var conn imamo host to je lokalhot, user, to je kod nas rooter, password koji koristim za mysql, database je naziv seme koju zelim da povezem */
const conn = mysql.createConnection({
    /*Onda saljemo objekat kao argument*/
    host: "localhost",
    user: "root",
    port:'3306',
    password:"root123",
    
    database: "hemikalije_baza"
});

module.exports = conn;
/*Da bismo napravili konekciju kazemo, ako se desi glupost izbaci gresku, greske mogu biti posledica ako nesto iz podataka kao sto je username, password, schema itd nije tacno uneto, i ako se ne uhvati exception rusi se celo okruzenje servera, to nam je veoma vazno, da ne bi ispalo da server radi a nema nikakvu konekciju sa bazom!*/
conn.connect((err) => {
    if(err) throw err;
    console.log("MySql Connected");

});




/*Da ne bi ispalo da server ne radi nista, ako nam neko dodje na HOME stranu, mi cemo njega da pozdravimo i kazemo HELLO! Ovo je primer najbanalnijeg servera*/
router.get("/",function(req,res){ /*F-je koje imaju zahteve, moraju da imaju HTTP req i HTTP res, to su argumenti u zagradi u f-ji*/
    res.json({message:"Hello"})
});
/*Hocu da podatke prikazem sa baze na frontendu, npr tabela kompanije, komuniciramo sa appijem preko GET metode*/
//GET poslednja 2 korisnika za admina
router.get("/admin/users", (req, res) => {
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
//Ah, to objašnjava zašto si dobijala “0” u frontend-u ako si koristila Number() ili nešto slično na JS strani — DECIMAL iz MySQL vraća string, ne broj.
  

  conn.query(query, (err, results) => {
    if (err) {
        results.forEach(r => console.log(r.nar_id, r.nar_cena));
      console.error("SQL greška:", err);
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

   
   // evo glreske vPrvo šalješ res.json(Object.values(usersMap)).Zatim pokušavaš da radiš JSON.parse na u.narudzbenice koje nije JSON string, pa baca grešku Unexpected token u.I pokušavaš da šalješ res.json dvaput, što ne može u Expressu – prvi res.json već završava odgovor.Tačno ✅ – nema potrebe za JSON.parse, jer narudzbenice više nisu JSON string, već normalan niz objekata nakon što ih složiš u usersMap.
  });
});
router.get("/users", function(req,res){

    /*Sad treba napraviti filter, search bar, npr ako unese korisnik er da mu prikaze sve sto sadrzi er, to se postize putem upita WHERE*/
var search = req.query.search;


    /*Zatim uvodimo prolazimo kroz if naredbu, oznaka!== znaci nije/
    ali se posle predavac ispravio pa je napisao === da jeste, dakle ako jeste undefined radi normalno, znaci nismo prosledili nikakv search vrati ih sve, */
if(search === undefined){

    conn.query("SELECT*FROM users", function(err,results,fields){
        if (err) throw err;
        res.json({"data": results})
    });

}
else{/*a ako nije undefined, u uglastoj zagradi saljemo niz stvari koje treba da se zamene, treba da se stavi search na prvom mestu, zatim search na drugom mestu, a ti nam je nasa promenljiva var search, i saljemo treci argument function sa err, results, fields, zatvorimo conn.query, Na pocetku preedavac je napravio gresku a toje bilo ummesto or and i prepare statement a to je '%' gde ne trabe i odmah je pukao server i izbacio gresku, sto znaci, posto upitnik zamenjuje onim sto smo poslali, a mi zelimo ono sto on zamenjuje da bude ? prosledjeno (to je ono sto se nalazi u uglastoj zagradi kod search(), onda smo napravili izmenu i napisali kod kako treba?*/
    conn.query("SELECT * FROM users WHERE usr_email LIKE ? OR usr_password LIKE ? ",["%"+search+"%", "%"+search+"%"],function(err,results,fields){
        if (err) throw err;
        /*Onda kazemo ako greska baci gresku, ispisi res.json results*/
        
         res.json({"data": results});
    }
    );
}
});

/*Nakon sto smo ubacili podatke u tabelu kompanije, preko frontenda, sad treba poslati infotmacije backendu to sto smo uneli u input, ovo se inace zovu restfull APPIJI, to znaci da mi pravimo dogovor kakvu zelimo putanju da komunicira sa bazom preko koje metode i sta nam ta metoda vraca, to je ona glavna razlika izmedju GET i POST metode, GET dobijamo podatke a POST pravi podatke, npr PUT metoda mozemo iskoristiti da izmenimo podatke ali msm da u ovom trenutku za moju bazu to nece biti potrebno, mozda cu iskoristiti za proizvode kad budem kreirala prodavnicu, ako mi bude zatrebao taj deo imam na predvanju DATA ACESS /4/4 posle 2.20h, vervatno cu koristiti za tabelu proizvodi!*/

router.post ("/users", function(req,res){
    /*Sad treba da primimo json, da hvatamo podatke*/
    var id = req.body.id;
    var name=req.body.name; /*dakle slacemo zahtev pod imenom pib, pod ne query nego body zahtevom, zato sto post ima body za razliku od geta koji nema, getom mozemo samo slati upite u search baru pod ? dok kod post metode to mozemo preko body*/
    var email=req.body.email;
    var password=req.body.password;
   
    var phone=req.body.phone;
    var level=req.body.level;
    

    console.log(name, email, password, phone, level);

    /* Kako uneti stvari u bazu, to ide putem upita insert, u zagradi uglastoj saljemo argumente istim redosledom koji smo u upitu insert stavili*/
    conn.query("INSERT INTO users SET usr_name=?, usr_email=?, usr_password=?, usr_phone=?,usr_level=?",[name, email, password, phone, level,], 
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

router.put("/users", function(req,res){
    /*Da bi mogli uspesno da izmeni podatak, treba nam id, da znamo koga menjamo i od toga pocinjemo*/
    var id = req.body.id;
    /*Prekopiramo sve prethodne zahteve*/
    var name =req.body.name; /*dakle slacemo zahtev pod imenom pib, pod ne query nego body zahtevom, zato sto post ima body za razliku od geta koji nema, getom mozemo samo slati upite u search baru pod ? dok kod post metode to mozemo preko body*/
    var email = req.body.email;
    var password = req.body.password;
   
    var phone =req.body.phone;
    var level =req.body.level;
    
/*Jedina razlika je u connquery koji ce imati drugaciji upit, UMESTO INSERT UPDATE i JAKO JE VAZNO DA KAZEMO WHERE U UPITU, JER AKO NE STAVIMO, AUTOMATSKI CEMO SVE PODATKE IZ BAZE IZGUBITI, ODN SVI CE IMATI ISTI PODATAK, Dakle mnogo je vazno za DELETE I UPDATE staviti u upitu WHERE*/

conn.query("UPDATE users SET usr_name=?, usr_email=?, usr_password=?, usr_phone=?,usr_level=?, WHERE usr_id=?",[name, email, password, phone, level], 
function(err,results,fields) {
    if(err) throw err;
    console.log(results);
    /*Results nam nije toliko bitno sada, ali ono sto nam je bitno kad se sve zavrsi da vratimo rezultat*/
    res.json ({"Result": "OK"});
}) ;

/*Greska koja se javlja kao kl ne moze  vise poslati zahteva od jednog, to je zato sto imamo negde pogresno zatvorene zagrade u nekim kodovima ili res.json zahtev treba obrisati ako ima bespotrebno previse*/ 
/* Http request funkcionise tako sto posaljemo zahtev serveru i dobijemo odgovor, zato treba pozvati res json da da odgovor korisniku nakon poslatog zahtev*/




});



    




    /*Sa bazom pricamo tako sto uzmemo konekcciju koju smo otvorili tako sto kazemo conn.query, queri ima minimum 3 argumenta, prvi argument je sql upit koji zelimo da izvrsimo, ako zelimo neke stvari da ubacimo u upit kao promenljive to bi bio drugi argument, posto mi to nemamo odmah prelazimo na treci argument a to je function koji prima 3 stvari,prima gresku ako se desila, rezulatate upita i polja, polja cemo retko koristiti! Query f-ja je asihrona, zato sto prima callback */
   
/*U pravom zivotu kad budemo radili upite ne smemo bacati error ovako if(err) throw err;zato sto ako se lose iskomunicira sa bazom, ceo server ce se srusiti, sto generalno ne zelimo, zelimo da to nekako vratimo korisniku  a da server nastavi da radi, u ovom trenutku ustedece nam manje zivaca jer samo mi koristimo ovaj server pa mozemo ovako bacati error*/

/*Da vratimo rezultate ono sto smo dobili iz baze, dakle vracamo neki object, pod kljucem objekta vracamo results*/
 

    


  


/*Ovaj upitnik i procenat u njemu znaci prepare statement, U srednjoj zagradi saljemo niz stvari koje treba da se zamene i dodamo treci argument, zatim zatvorimo connection query*/
    /*APPI pozovemo za brisnje*/

router.delete("/users", function(req,res){
    /*Problem sa specifikacijom za DELETE, pa umseto body poslacemo podatke preko URL, tj query*/
var id= req.query.id;
/*Imala sam gresku sa upitom u smislu nije hteo da mi obrise zato sto u sintaksi nisam imala zarez na kraju upitnika , kad se obrise komapnija, server tu infromaciju ne komentarise*/
conn.query("DELETE FROM users WHERE usr_id=?",[id],
function(err,result, fields){
    if(err) throw err;
    res.json({"Result":"OK"});
    /*Kad budemo radili validaciju, npr ako je result OK refresh usere ako je result error, prikazi msg */
});
});
    
module.exports = router;
