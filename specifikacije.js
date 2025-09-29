/*Povezivanje NOde sa MySql*, posle toga kazemo db .dbect damo f-ju i ako nesto pukne da nam izbaci exception , time ce se server srusiti, ali znamo zasto,  ili ako je sve u redu da ispise u console dbected*/
const express = require('express');
const router = express.Router();
const db = require('./database'); // import konekcije
const logger = require('./logger');
router.get("/specifikacije", function(req,res){

    
var search = req.query.search;


    if(search === undefined){

        db.query("SELECT*FROM specifikacije", function(err,results,fields){
            if (err) throw err;
            res.json({"data": results})
        });
    
    }
    else{
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
        var izgled = req.body.izgled; 
        var klashemikal = req.body.klashemikal;
        var prvapomoc = req.body.prvapomoc;
        var ruksklad = req.body.ruksklad;
+
      
    db.query("INSERT INTO specifikacije SET spe_izgled=?, spe_klashemikal=?, spe_prvapomoc =?,spe_ruksklad=?",[izgled, klashemikal, prvapomoc, ruksklad],
    function(err,results,fields) {
        if(err) throw err;
        logger.log(results);
       
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
   



db.query("UPDATE specifikacije SET spe_izgled=?, spe_klashemikal=?, spe_prvapomoc =?,spe_ruksklad=? WHERE spe_id=?",[spe_izgled, spe_klashemikal, spe_prvapomoc, spe_ruksklad,id], 
function(err,results,fields) {
    if(err) throw err;
    logger.log(results);
    /*Results nam nije toliko bitno sada, ali ono sto nam je bitno kad se sve zavrsi da vratimo rezultat*/
    res.json ({"Result": "OK"});
}) ;

});

/*APPI pozovemo za brisnje*/

router.delete("/specifikacije", function(req,res){
    /*Problem sa specifikacijom za DELETE, pa umseto body poslacemo podatke preko URL, tj query*/
var id= req.query.id;

db.query("DELETE FROM specifikacije WHERE spe_id=?",[id],
function(err,result,fields){
    if(err) throw err;
    res.json({"Result":"OK"});
    /*Kad budemo radili validaciju, npr ako je result OK refresh usere ako je result error, prikazi msg */
});
});
    
module.exports = router;


 
 
 
    
    
    
