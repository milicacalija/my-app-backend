/*Povezivanje NOde sa MySql*, posle toga kazemo conn .connect damo f-ju i ako nesto pukne da nam izbaci exception , time ce se server srusiti, ali znamo zasto,  ili ako je sve u redu da ispise u console connected*/
var mysql= require("mysql");
const cors = require('cors');

const express = require("express");
const router = express.Router();

/*zatim treba napraviti konekciju uz pomoc var conn taj sam malo kasnije zapisala, kod var conn imamo host to je lokalhot, user, to je kod nas rooter, password koji koristim za mysql, database je naziv seme koju zelim da povezem */
const conn = mysql.createConnection({
  host     : process.env.MYSQL_HOST,
  user     : process.env.MYSQL_USER,
  password : process.env.MYSQL_PASSWORD,
  database : process.env.MYSQL_DATABASE,
  port     : process.env.MYSQL_PORT
});


/*Da bi povezali vise node js fajlova u jedan i pozvali na server potreban nam je module export i tako zasvaki fajl js navodimo a onda preko require f-je u main js pozivaamo sve fajlove*/

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

router.get("/kompanije", function(req,res){

    /*Sad treba napraviti filter, search bar, npr ako unese korisnik er da mu prikaze sve sto sadrzi er, to se postize putem upita WHERE*/
var search = req.query.search;


    /*Zatim uvodimo prolazimo kroz if naredbu, oznaka!== znaci nije/
    ali se posle predavac ispravio pa je napisao === da jeste, dakle ako jeste undefined radi normalno, znaci nismo prosledili nikakv search vrati ih sve, */
if(search === undefined){

    /*Sa bazom pricamo tako sto uzmemo konekcciju koju smo otvorili tako sto kazemo conn.query, queri ima minimum 3 argumenta, prvi argument je sql upit koji zelimo da izvrsimo, ako zelimo neke stvari da ubacimo u upit kao promenljive to bi bio drugi argument, posto mi to nemamo odmah prelazimo na treci argument a to je function koji prima 3 stvari,prima gresku ako se desila, rezulatate upita i polja, polja cemo retko koristiti! Query f-ja je asihrona, zato sto prima callback */
    conn.query("SELECT*FROM kompanije", function(err,results,fields){

        /*U pravom zivotu kad budemo radili upite ne smemo bacati error ovako if(err) throw err;zato sto ako se lose iskomunicira sa bazom, ceo server ce se srusiti, sto generalno ne zelimo, zelimo da to nekako vratimo korisniku  a da server nastavi da radi, u ovom trenutku ustedece nam manje zivaca jer samo mi koristimo ovaj server pa mozemo ovako bacati error*/

        if (err) throw err;
        res.json({"data": results})
    });

}
else{/*a ako nije undefined, u uglastoj zagradi saljemo niz stvari koje treba da se zamene, treba da se stavi search na prvom mestu, zatim search na drugom mestu, a ti nam je nasa promenljiva var search, i saljemo treci argument function sa err, results, fields, zatvorimo conn.query, Na pocetku preedavac je napravio gresku a toje bilo ummesto or and i prepare statement a to je '%' gde ne trabe i odmah je pukao server i izbacio gresku, sto znaci, posto upitnik zamenjuje onim sto smo poslali, a mi zelimo ono sto on zamenjuje da bude ? prosledjeno (to je ono sto se nalazi u uglastoj zagradi kod search(), onda smo napravili izmenu i napisali kod kako treba?*/
    conn.query("SELECT * FROM kompanije WHERE kmp_naziv LIKE ? OR kmp_osoba LIKE ? ",["%"+search+"%", "%"+search+"%"],function(err,results,fields){
        if (err) throw err;
        /*Onda kazemo ako greska baci gresku, ispisi res.json results*/
        
         res.json({"data": results});
    }
    );
}
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

  conn.query(
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

/*Ovo se sve zovu rest full APIJI,rest full je samo dogovor,to znaci ove putanje koje imamo npr router.get/kompanije, to su imenice i tako nam se zovu apiji, to mogu biti kompanije, proizvodi,studenti, ispiti itd..a onda u zavisnosti od metode zavisi sta radimo  Recimo GET polozeni ispiti verovatno nam vraca poloznene ispite, POST polozeni ispiti pravi neki novi polozeni ispit, PUT ILI PATCH menja neke podatke o poloznemo ispitu I DELETE brise neki polozeni ispit, TO JE SAMO DOGOVOR!*

});
/*Nakon sto smo ubacili podatke u tabelu kompanije, preko frontenda, sad treba poslati infotmacije backendu to sto smo uneli u input, ovo se inace zovu restfull APPIJI, to znaci da mi pravimo dogovor kakvu zelimo putanju da komunicira sa bazom preko koje metode i sta nam ta metoda vraca, to je ona glavna razlika izmedju GET i POST metode, GET dobijamo podatke a POST pravi podatke, npr PUT metoda mozemo iskoristiti da izmenimo podatke ali msm da u ovom trenutku za moju bazu to nece biti potrebno, mozda cu iskoristiti za proizvode kad budem kreirala prodavnicu, ako mi bude zatrebao taj deo imam na predvanju DATA ACESS /4/4 posle 2.20h, vervatno cu koristiti za tabelu proizvodi!*/



/*Greska koja se javlja kao kl ne moze  vise poslati zahteva od jednog, to je zato sto imamo negde pogresno zatvorene zagrade u nekim kodovima ili res.json zahtev treba obrisati ako ima bespotrebno previse*/ 
/* Http request funkcionise tako sto posaljemo zahtev serveru i dobijemo odgovor, zato treba pozvati res json da da odgovor korisniku nakon poslatog zahtev*/






    


  


/*Ovaj upitnik i procenat u njemu znaci prepare statement, U srednjoj zagradi saljemo niz stvari koje treba da se zamene i dodamo treci argument, zatim zatvorimo connection query*/

/*APPI pozovemo za brisnje*/

router.delete("/kompanije", function(req,res){
    /*Problem sa specifikacijom za DELETE, pa umseto body poslacemo podatke preko URL, tj query*/
var id= req.query.id;
/*Imala sam gresku sa upitom u smislu nije hteo da mi obrise zato sto u sintaksi nisam imala zarez na kraju upitnika , kad se obrise komapnija, server tu infromaciju ne komentarise*/
conn.query("DELETE FROM kompanije WHERE kmp_id=?",[id],
function(err,result,fields){
    if(err) throw err;
    res.json({"Result":"OK"});
    /*Kad budemo radili validaciju, npr ako je result OK refresh usere ako je result error, prikazi msg */
});
});
    
module.exports = router;