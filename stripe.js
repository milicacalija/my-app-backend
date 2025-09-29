const express = require('express');
require('dotenv').config(); // ovo učitava .env vezano za stripe key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./database.js'); // tvoja konekcija ka bazi
const router = express.Router();



// Ruta za kreiranje PaymentIntent i insert u bazu
router.post('/api/save-payment', async (req, res) => {  try {
    const {
      fk_pa_usr_id,
      fk_pa_nar_id,
      cartItems,
      currency = 'rsd',
    } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Korpa je prazna.' });
    }

    if (!fk_pa_nar_id) {
      return res.status(400).json({ error: 'Nije definisana narudžbenica.' });
    }

    // Izračunaj ukupnu cenu iz cartItems
    const amount = cartItems.reduce((sum, item) => sum + (item.uk_stv_cena || 0), 0);

    // Kreiraj Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      //amount se računa direktno iz cartItems ako frontend ne šalje vrednost.
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
    });

    // Ubaci plaćanje u bazu
    const insertQuery = `
      INSERT INTO payments 
      (fk_pa_usr_id, fk_pa_nar_id, amount, currency, status, payment_method, stripe_payment_intent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
db.query(
      insertQuery,
      [fk_pa_usr_id, fk_pa_nar_id, amount, currency, 'pending', 'card', paymentIntent.id],
      (err, result) => {
        if (err) {
          console.error('Greška pri ubacivanju u bazu:', err);
          return res.status(500).json({ error: 'Greška pri ubacivanju plaćanja u bazu.' });
        } else {
          console.log('Plaćanje zabeleženo u bazi, id:', result.insertId);
          return res.json({ clientSecret: paymentIntent.client_secret });
        }
      }
    );

  } catch (err) {
    console.error('Stripe PaymentIntent error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
