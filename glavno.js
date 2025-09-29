
const express = require('express');
const session = require('express-session');
const cors = require("cors");
require('dotenv').config(); // ucitava .env


const app = express();

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(session({
    secret: 'moja_tajna_sifra', // session secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Stripe ključ (za Stripe biblioteke)
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Importovanje ruta
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
const porukeRoutes = require("./poruke");
const serverPorukeRoutes = require("./serverPoruke");
const bonusRoutes = require("./bonus");

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
app.use("/stripe", stripeRoutes);
app.use("/poruke", porukeRoutes);
app.use("/serverPoruke", serverPorukeRoutes);
app.use("/bonus", bonusRoutes);

// Start servera
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server pokrenut na portu ${PORT}`);
});
