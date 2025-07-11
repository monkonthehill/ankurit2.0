const functions = require('firebase-functions');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

exports.submitOrder = functions.https.onRequest(async (req, res) => {
  // 1. Validate request
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 2. Prepare Google Sheets connection
  const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  // 3. Process order
  try {
    await doc.useServiceAccountAuth(serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    
    await sheet.addRow({
      'Date': new Date().toISOString(),
      'Plant': req.body.plant,
      'Variety': req.body.variety,
      'Customer': req.body.name,
      'WhatsApp': req.body.whatsapp,
      'Address': req.body.address,
      'Quantity': req.body.quantity,
      'Notes': req.body.notes || ''
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});