// server.js
const express = require('express');
const router = express.Router(); // Kreiramo router
// Uvoz ruta
const nalogRoutes = require('./nalog'); // rute za korisnike
const porukeRouter = require('./poruke'); // rute za poruke

// Test ruta
router.get("/", (req, res) => {
  res.json({ message: "Hello" });
});

// Uključivanje podruta
router.use('/nalog', nalogRoutes);
router.use('/poruke', porukeRouter);

// Eksportujemo router
module.exports = router;



//Problemi, Dupliraš MySQL konekciju.Već si napravila database.js za konekciju, a ovde u server.js opet praviš novu. To pravi konfuziju (i može da pravi greške ako koristiš različite baze, mi_baza i hemikalije_baza).👉 Rešenje: izbaci konekciju iz server.js, koristi samo database.js.Dupli cors().Imaš dva puta app.use(cors());. Nije greška, ali nepotrebno.PORT promenljiva.Definišeš i const port = 3012; i const PORT = process.env.PORT || 3013;.👉 Zadrži samo jedan (PORT sa process.env.PORT je bolja praksa).


