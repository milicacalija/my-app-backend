
require('dotenv').config(); // ovo mora biti na vrhu

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const db = require('./db.local.js'); // konekcija na bazu
const stripe = require('./stripe'); // samo koristiš ga direktno, bez app.use()
const app = express();
app.use(cors());
app.use(express.json());

// ...ostatak koda

// 🔹 CORS konfiguracija — DOZVOLJAVA FRONT SA RAILWAY-A
app.use(cors({
  origin: ['https://my-front-production.up.railway.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
//Middleware za sesije
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Stripe ključ (za Stripe biblioteke)

const kompanijeRoutes = require("./kompanije");
const narudzbeniceRoutes = require("./narudzbenice");
const piktogramiRoutes = require("./piktogrami");
const tipoviprimeneRoutes = require("./tipoviprimene");
const serverRoutes = require("./server");
const specifikacijeRoutes = require("./specifikacije");
const proizvodiRoutes = require("./proizvodi");
const usersRoutes = require("./users");
const loginRoutes = require("./login");
const nalogRoutes = require("./nalog");
const stripeRoutes = require("./stripe");
const paymentRouter = require('./payment');


const porukeRoutes = require("./poruke");
const serverPorukeRoutes = require("./serverPoruke");
const bonusRoutes = require("./bonus");
const adminRoutes = require("./admin");

// Postavljanje ruta
app.use("/kompanije", kompanijeRoutes);
app.use("/narudzbenice", narudzbeniceRoutes);
app.use("/piktogrami", piktogramiRoutes);
app.use("/tipoviprimene", tipoviprimeneRoutes);
app.use("/server", serverRoutes);
app.use("/specifikacije", specifikacijeRoutes);
app.use("/proizvodi", proizvodiRoutes);
app.use("/users", usersRoutes);
app.use("/login", loginRoutes);
app.use("/nalog", nalogRoutes);
app.use('/', paymentRouter); // tada ruta /save-payment postoji direktnoapp.use("/poruke", porukeRoutes);
app.use("/serverPoruke", serverPorukeRoutes);
app.use("/poruke", porukeRoutes);
app.use("/bonus", bonusRoutes);
app.use("/admin", adminRoutes);





// Start servera
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server pokrenut na portu ${PORT}`);
});
