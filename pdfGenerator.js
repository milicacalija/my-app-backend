//b, express, router — nisu potrebni ovde,Ovaj fajl nije Express ruta, već util fajl.Dakle, ovo obavezno izbaci jer ti ništa ne koristi i samo komplikuje kod:
const fs = require("fs");
const nodemailer = require('nodemailer');
const path = require('path');
const moment = require('moment-timezone');

const puppeteer = require('puppeteer');

async function generateOrderPDF(orderData, pdfPath) {

  
  const chemicalLogoPath = path.resolve(__dirname, 'src/assets/chemical.png');
const chemicalLogo = fs.readFileSync(chemicalLogoPath, { encoding: 'base64' });
  // HTML template za PDF
  const html = `
  <!DOCTYPE html>
  <html lang="sr">
  <head>
    <meta charset="UTF-8">
    <title>Narudžbenica #${orderData.nar_id}</title>

    
    <style>
.logo-header {
  display: flex;
  align-items: center;
}
.logo-header img {
  width: 65px;
  height: auto;
}
.logo-header p {
  font-family: 'Oswald', sans-serif;
  font-weight: 700;
  font-size: 34px;
  color: #6a1d1d;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
  margin-bottom: 8px;
}
      body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.4; }
      h1 { text-align: center; }
      h2 { text-align: right; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #000; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      .footer { margin-top: 40px; font-size: 12px; text-align: center; }
      .note { margin-top: 20px; font-size: 14px; }
    </style>
  </head>
  <body>
   <div class="logo-header">
   
      <img src="data:image/png;base64,${chemicalLogo}" alt="Chemical Logo" />
      <p>CHEMICALS</p>
    </div>

  
    <h1>Narudžbenica</h1>

    <p><strong>ID narudžbenice:</strong> ${orderData.nar_id}</p>
    <p><strong>Datum:</strong> ${orderData.nar_datum}</p>
    <p><strong>Kupac:</strong> ${orderData.kupac_ime || "-"}</p>
    <p><strong>Firma:</strong> ${orderData.kupac_firma || "-"}</p>
    <p><strong>Email:</strong> ${orderData.kupac_email || "-"}</p>
    <p><strong>Adresa isporuke:</strong> ${orderData.kupac_adresa || "-"}</p>
    <p><strong>Način plaćanja:</strong> Plaćanje pouzećem</p>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Proizvod</th>
          <th>Količina</th>
          <th>Cena</th>
          <th>Ukupno</th>
        </tr>
      </thead>
      <tbody>
        ${orderData.stavke.map((s, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${s.naziv}</td>
            <td>${s.stv_kolicina}</td>
            <td>${s.stv_cena} RSD</td>
            <td>${s.uk_stv_cena} RSD</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>Ukupno: ${orderData.nar_cena} RSD</h2>

    <p class="note">
      <strong>Napomena:</strong> Plaćanje se vrši isključivo <u>gotovinom prilikom isporuke</u>.  
      Molimo Vas da pripremite tačan iznos. 
    </p>

    <div class="footer">
      <p>Hvala što ste naš kupac!</p>
      <p>Za pitanja i podršku obratite se na: chemicals@chemistry.com</p>
    </div>
  </body>


  </html>
  `;

  // Pokretanje Puppeteer-a i kreiranje PDF-a
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  await browser.close();

  console.log(`✅ PDF kreiran: ${pdfPath}`);
  return pdfPath;
}

module.exports = generateOrderPDF;

// 2️⃣ Funkcija za slanje mejla sa PDF-om
async function sendOrderPDFEmail(toEmail, orderData) {
  const pdfPath = `./narudzbenica_${orderData.nar_id}.pdf`;
  await generateOrderPDF(orderData, pdfPath);


  
//User / pass više ne važe – Ethereal često gasi naloge posle nekog vremena.Uloguj se na Ethereal
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: "danika.tillman6@ethereal.email", // ubaci podatke sa Ethereal-a
      pass: "UDEJcBbrb7PPEACAhX"
    },
    tls: { rejectUnauthorized: false }
  });

  let info = await transporter.sendMail({
    from: `"Test App" <danika.tillman6@ethereal.email>`,
    to: toEmail,
    subject: `Narudžbenica #${orderData.nar_id}`,
    text: "U prilogu se nalazi PDF vaše narudžbenice.",
    attachments: [
      { filename: `narudzbenica_${orderData.nar_id}.pdf`, path: pdfPath }
    ]
  });
  

}
module.exports = {
  generateOrderPDF,
  sendOrderPDFEmail
};