var mysql = require("mysql");
const cors = require('cors');
const express = require("express");
const router = express.Router();




const conn = mysql.createConnection({
  host     : process.env.MYSQL_HOST,
  user     : process.env.MYSQL_USER,
  password : process.env.MYSQL_PASSWORD,
  database : process.env.MYSQL_DATABASE,
  port     : process.env.MYSQL_PORT
});


conn.connect((err) => {
    if (err) throw err;
    console.log("MySql Connected");
});

router.get("/", function (req, res) {
    res.json({ message: "Hello" });
});



// 1️⃣ Vraća sve piktograme
router.get("/piktogrami", (req, res) => {
    const search = req.query.search;
    let query = "SELECT * FROM piktogrami";
    let params = [];

    if (search) {
        query += " WHERE pkt_iupac LIKE ?";
        params.push("%" + search + "%");
    }

    conn.query(query, params, (err, results) => {
        if (err) {
            console.error("Greška u SQL upitu:", err);
            return res.status(500).json({ error: "Greška servera" });
        }
        res.json(results);
    });
});

// 2️⃣ Vraća proizvode za selektovani piktogram
router.get("/piktogrami/proizvodi", (req, res) => {
    const pktId = req.query.piktogram;

    if (!pktId) {
        return res.status(400).json({ error: "Nedostaje parametar piktogram" });
    }

    const query = `
       SELECT proizvodi.pro_id, proizvodi.pro_iupac
FROM proizvodi
JOIN piktogrami_proizvodi ON proizvodi.pro_id = piktogrami_proizvodi.pro_id
JOIN piktogrami ON piktogrami.pkt_id = piktogrami_proizvodi.pkt_id
WHERE piktogrami.pkt_id = ?
    `;

    conn.query(query, [pktId], (err, results) => {
        if (err) {
            console.error("Greška u SQL upitu:", err);
            return res.status(500).json({ error: "Greška servera" });
        }
        res.json(results);
    });
});


module.exports = router;
