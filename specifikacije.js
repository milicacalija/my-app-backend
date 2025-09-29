/*Povezivanje NOde sa MySql*, posle toga kazemo db .dbect damo f-ju i ako nesto pukne da nam izbaci exception , time ce se server srusiti, ali znamo zasto,  ili ako je sve u redu da ispise u console dbected*/
const express = require("express");
const router = express.Router();
const db = require('./database'); // konekcija iz database.js

//renutno koristiš mysql.createdbection i onda ga eksportuješ (module.exports = db) i koristiš ga u više ruta (/specifikacije GET, POST, PUT, DELETE).To u startu radi, ali čim ti frontend pošalje više upita skoro u isto vreme, Node koristi istu konekciju za sve, i tada puca sa onom greškom:

/*zatim treba napraviti konekciju uz pomoc var db taj sam malo kasnije zapisala, kod var db imamo host to je lokalhot, user, to je kod nas rooter, password koji koristim za mysql, database je naziv seme koju zelim da povezem */

/*Da bismo napravili konekciju kazemo, ako se desi glupost izbaci gresku, greske mogu biti posledica ako nesto iz podataka kao sto je username, password, schema itd nije tacno uneto, i ako se ne uhvati exception rusi se celo okruzenje servera, to nam je veoma vazno, da ne bi ispalo da server radi a nema nikakvu konekciju sa bazom!*/
db.connect((err) => {
    if(err) throw err;
    console.log("MySql dbected");

});

/*Da ne bi ispalo da server ne radi nista, ako nam neko dodje na HOME stranu, mi cemo njega da pozdravimo i kazemo HELLO! Ovo je primer najbanalnijeg servera*/
router.get("/",function(req,res){ /*F-je koje imaju zahteve, moraju da imaju HTTP req i HTTP res, to su argumenti u zagradi u f-ji*/
    res.json({message:"Hello"})
});
/*Hocu da podatke prikazem sa baze na frontendu, npr tabela kompanije, komuniciramo sa appijem preko GET metode*/

router.get("/specifikacije", function(req,res){

    /*Sad treba napraviti filter, search bar, npr ako unese korisnik er da mu prikaze sve sto sadrzi er, to se postize putem upita WHERE*/
var search = req.query.search;

/*Zatim uvodimo prolazimo kroz if naredbu, oznaka!== znaci nije/
    ali se posle predavac ispravio pa je napisao === da jeste, dakle ako jeste undefined radi normalno, znaci nismo prosledili nikakv search vrati ih sve, */
    if(search === undefined){

        db.query("SELECT*FROM specifikacije", function(err,results,fields){
            if (err) throw err;
            res.json({"data": results})
        });
    
    }
    else{/*a ako nije undefined, u uglastoj zagradi saljemo niz stvari koje treba da se zamene, treba da se stavi search na prvom mestu, zatim search na drugom mestu, a ti nam je nasa promenljiva var search, i saljemo treci argument function sa err, results, fields, zatvorimo db.query, Na pocetku preedavac je napravio gresku a toje bilo ummesto or and i prepare statement a to je '%' gde ne trabe i odmah je pukao server i izbacio gresku, sto znaci, posto upitnik zamenjuje onim sto smo poslali, a mi zelimo ono sto on zamenjuje da bude ? prosledjeno (to je ono sto se nalazi u uglastoj zagradi kod search(), onda smo napravili izmenu i napisali kod kako treba?*/
        db.query("SELECT * FROM specifikacije WHERE spe_ izgled LIKE ? OR spe_klashemikal LIKE ? ",["%"+search+"%", "%"+search+"%"],function(err,results,fields){
            if (err) throw err;
            /*Onda kazemo ako greska baci gresku, ispisi res.json results*/
            
             res.json({"data": results});
        }
        );
    }
    });

    router.post ("/specifikacije", function(req,res){
        /*Sad treba da primimo json, da hvatamo podatke*/
        var izgled = req.body.izgled; /*dakle slacemo zahtev pod imenom pib, pod ne query nego body zahtevom, zato sto post ima body za razliku od geta koji nema, getom mozemo samo slati upite u search baru pod ? dok kod post metode to mozemo preko body*/
        var klashemikal = req.body.klashemikal;
        var prvapomoc = req.body.prvapomoc;
        var ruksklad = req.body.ruksklad;
        console.log(izgled, klashemikal, prvapomoc, ruksklad,);

        /* Kako uneti stvari u bazu, to ide putem upita insert, u zagradi uglastoj saljemo argumente istim redosledom koji smo u upitu insert stavili*/
    db.query("INSERT INTO specifikacije SET spe_izgled=?, spe_klashemikal=?, spe_prvapomoc =?,spe_ruksklad=?",[izgled, klashemikal, prvapomoc, ruksklad],
    function(err,results,fields) {
        if(err) throw err;
        console.log(results);
        /*Results nam nije toliko bitno sada, ali ono sto nam je bitno kad se sve zavrsi da vratimo rezultat*/
        /*res.json ({"Result": "OK"});*/
    }) ;

     /* Http request funkcionise tako sto posaljemo zahtev serveru i dobijemo odgovor, zato treba pozvati res json da da odgovor korisniku nakon poslatog zahtev*/
     res.json ({"Result": "OK"});
     /*Mi nakon poslatog zahteva post metodom ocekujemo da nam se u terminalu ispisu argumenti*/
 });
 
 /*Napravicemo jednu metodu za izmenu podataka iz baze na frontendu, metoda put*/

router.put("/specifikacije", function(req,res){
    /*Da bi mogli uspesno da izmeni podatak, treba nam id, da znamo koga menjamo i od toga pocinjemo*/
    var id = req.body.id;
    /*Prekopiramo sve prethodne zahteve*/
    spe_izgled= req.body.izgled;
    spe_klashemikal= req.body.klashemikal;
    spe_prvapomoc= req.body.prvapomoć;
    spe_ruksklad= req.body.ruksklad;
   

/*Jedina razlika je u dbquery koji ce imati drugaciji upit, UMESTO INSERT UPDATE i JAKO JE VAZNO DA KAZEMO WHERE U UPITU, JER AKO NE STAVIMO, AUTOMATSKI CEMO SVE PODATKE IZ BAZE IZGUBITI, ODN SVI CE IMATI ISTI PODATAK, Dakle mnogo je vazno za DELETE I UPDATE staviti u upitu WHERE*/

db.query("UPDATE specifikacije SET spe_izgled=?, spe_klashemikal=?, spe_prvapomoc =?,spe_ruksklad=? WHERE spe_id=?",[spe_izgled, spe_klashemikal, spe_prvapomoc, spe_ruksklad,id], 
function(err,results,fields) {
    if(err) throw err;
    console.log(results);
    /*Results nam nije toliko bitno sada, ali ono sto nam je bitno kad se sve zavrsi da vratimo rezultat*/
    res.json ({"Result": "OK"});
}) ;

});

/*APPI pozovemo za brisnje*/

router.delete("/specifikacije", function(req,res){
    /*Problem sa specifikacijom za DELETE, pa umseto body poslacemo podatke preko URL, tj query*/
var id= req.query.id;
/*Imala sam gresku sa upitom u smislu nije hteo da mi obrise zato sto u sintaksi nisam imala zarez na kraju upitnika , kad se obrise komapnija, server tu infromaciju ne komentarise*/
db.query("DELETE FROM specifikacije WHERE spe_id=?",[id],
function(err,result,fields){
    if(err) throw err;
    res.json({"Result":"OK"});
    /*Kad budemo radili validaciju, npr ako je result OK refresh usere ako je result error, prikazi msg */
});
});
    
module.exports = router;


 
 
 
    
    
    
