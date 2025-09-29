var mysql = require("mysql");
const cors = require('cors');
var express = require("express");
var app = express();

app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' http://localhost:3026");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});



// Povezivanje na bazu podataka
db.dbect(function(err) {
    if (err) {
        console.error('Greška pri povezivanju sa bazom podataka: ' + err.stack);
        return;
    }
    console.log('Povezano sa bazom podataka kao ID ' + db.threadId);
});

// Ruta za dobavljanje podataka iz tabele `pro_odel`
router.get('/sloboprof', (req, res) => {
    const query = 'SELECT * FROM sloboprof';

    db.query(query, (error, results) => {
        if (error) {
            console.error('Greška pri izvršavanju upita: ', error);
            res.status(500).send('Greška pri dobavljanju podataka');
        } else {
            res.json(results);
        }
    });
});

// Pokretanje servera
app.listen(port, () => {
    console.log(`Server je pokrenut na portu ${port}`);
});