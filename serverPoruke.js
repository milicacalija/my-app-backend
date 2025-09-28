const express = require('express');
const router = express.Router(); // Kreiramo router

// Ovde ide tvoja logika za poruke
// Primer GET rute
router.get('/', (req, res) => {
    res.json({ message: 'Poruke endpoint radi!' });
});

// Primer POST rute
router.post('/', (req, res) => {
    const { text } = req.body;
    console.log('Primljena poruka:', text);
    res.json({ status: 'ok', text });
});

// Na kraju eksportujemo router
module.exports = router;