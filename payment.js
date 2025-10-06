//da se aktivira stripe za placanje putem kartica , o Stripe radi u backendu (ukratko):Kreiraš Payment Intent sa željenim iznosom, valutom itd.Vraćaš Payment Intent klijent strani (frontend-u)Frontend poziva Stripe SDK da potvrdi uplatu (npr. preko stripe.confirmCardPayment) Backend može slušati webhook za potvrdu (nije obavezno ali je preporučljivo)
// routes/payment.js
const db = require('./db.local'); // ovo mora biti konekcija

//Payment.js se nikad ne pokrece kao poseban file npr node payment.js jer je to u slopu router i to se pokrece iz glavnog foldera server.js gde je uslovljena glavna ruta u komuniciranju sa payment.js , kad se pokrene server.js onda se pokrece i payment.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//payment_method iz req body brisemo i confirm možeš izostaviti u kreiranju PaymentIntenta, jer ćeš potvrdu (confirmation) da radiš sa Stripe.js na frontendu koristeći clientSecret.Backend samo kreira PaymentIntent i vraća clientSecret.Frontend onda koristi stripe.confirmCardPayment(clientSecret, {...}) da potvrdi uplatu//Nemoj potvrđivati uplatu u backend-u (confirmation_method: 'manual' i confirm: true možeš ukloniti).//Vraćaj JSON odgovor sa { clientSecret: paymentIntent.client_secret }.
//Na frontend-u često se šalju item.price i item.quantity kao stringovi. Na primer:U tom slučaju, item.price * item.quantity može dati NaN ako se implicitno ne konvertuje u broj. i zato vraca response NAN
//Ne kucas api nego samo save payment
const cors = require('cors');
//Ako koristim router ne treba app definisati jer to je definisano u fajlu glavno.js nod

// GET ruta koja vraća tip kartice za dati PaymentIntent

router.post('/save-payment', async (req, res) => {
  try {
    const { fk_pa_usr_id, fk_pa_nar_id, cartItems, status = 'pending', payment_method = 'card', currency = 'rsd' } = req.body;

    console.log('📥 Primljen request na /save-payment:', req.body);

    // Validacija
    if (!fk_pa_usr_id || !fk_pa_nar_id) {
      return res.status(400).json({ error: 'Nedostaju korisnik ili narudžbenica.' });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Korpa je prazna.' });
    }

    // Izračunavanje ukupne cene
    const ukupnaCena = cartItems.reduce((sum, item) => {
      console.log('price:', item.stv_cena, 'quantity:', item.stv_kolicina);
      return sum + item.stv_cena * item.stv_kolicina;
    }, 0);

    if (isNaN(ukupnaCena) || ukupnaCena <= 0) {
      return res.status(400).json({ error: 'Ukupna cena nije validna.' });
    }

    const amount = Math.round(ukupnaCena * 100); // Stripe u centima

    // Kreiranje Stripe PaymentIntent
    console.log('ℹ️ Kreiranje Stripe PaymentIntent-a...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    console.log('✅ Stripe PaymentIntent kreiran:', paymentIntent.id);

    // Ubacivanje u bazu
    const insertQuery = `
      INSERT INTO payments 
      (fk_pa_usr_id, fk_pa_nar_id, amount, currency, status, payment_method, stripe_payment_intent_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await new Promise((resolve, reject) => {
      db.query(insertQuery, [fk_pa_usr_id, fk_pa_nar_id, ukupnaCena, currency, status, payment_method, paymentIntent.id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    console.log('✅ Plaćanje zabeleženo u bazi, id:', result.insertId);

    return res.json({ clientSecret: paymentIntent.client_secret });
    
  } catch (err) {
    console.error('❌ Greška pri plaćanju:', err);
    return res.status(500).json({ error: err.message });
  }
});


router.get('/payment-method/:paymentIntentId', async (req, res) => {
  try {
    // 🔹 Uzmi paymentIntentId iz parametara rute
    const { paymentIntentId } = req.params;

    // 🔹 Retrieve PaymentIntent sa Stripe-a
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // 🔹 Uzmi ID payment metode
    const paymentMethodId = paymentIntent.payment_method;

    // 🔹 Retrieve payment method da dobiješ detalje o kartici
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // 🔹 Detektuj brand kartice
    const cardBrand = paymentMethod.card?.brand || 'unknown';

    // 🔹 Pošalji brand kao JSON
    res.json({ cardBrand });

  } catch (err) {
    console.error('❌ Greška pri čitanju tipa kartice:', err);
    res.status(500).json({ error: err.message });
  }
});





//ET /payment-method/:paymentIntentId – kasnije pozoveš ovaj endpoint da dobiješ pravi tip kartice (Visa, Master, AMEX itd.) i možeš update-ovati payment_method u bazi.

module.exports = router;


