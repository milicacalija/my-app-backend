// backend/stripe.js
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



module.exports = stripe; // ✅ izvozi stripe instancu


//Ah, sada je jasno zašto ti se čini da plaćanje nije upisano u bazu: u trenutnoj ruti uvek ubacuje status 'pending' i ne ažurira ga kada Stripe potvrdi plaćanje. Takođe, tvoja funkcija na frontendu pravi drugi POST na /save-payment sa statusom 'succeeded', ali tvoj backend kod ne razlikuje novi zahtev od prvog – samo pravi novi red u tabeli.Prvi POST sa cartItems i ostalim podacima kreira PaymentIntent i ubacuje red sa statusom pending.Drugi POST (nakon što Stripe vrati succeeded) treba da update-uje postojeći red sa stripe_payment_intent_id koji je već kreiran, a ne da pravi novi red.Evo kako možeš da izmeniš rutu /save-payment da ubacuje ili ažurira u zavisnosti od toga da li stripe_payment_intent_id već postoji: