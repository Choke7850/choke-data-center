const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { createHash } = require('crypto');

// --- Helper Functions ---
const hashPassword = (password) => {
  return createHash('sha256').update(password).digest('base64');
};

const getDoc = async () => {
  // [FIX] This new key processing method is more robust.
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
};

// --- Main Handler for Vercel ---
module.exports = async (request, response) => {
  // CORS Headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  const { action, data } = request.body;

  try {
    const doc = await getDoc();

    switch (action) {
      case 'verifyLogin': {
        const userSheet = doc.sheetsByTitle['users'];
        if (!userSheet) throw new Error("Sheet 'users' not found in the document.");
        
        await userSheet.loadHeaderRow();
        const rows = await userSheet.getRows();
        const inputPasswordHash = hashPassword(data.password);

        for (const row of rows) {
          if (row.get('username') === data.username && row.get('hashed_password') === inputPasswordHash) {
            return response.status(200).json({ status: 'success', displayName: row.get('display_name') });
          }
        }
        
        return response.status(200).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
      // Other cases can be added here
      default:
        return response.status(400).json({ status: 'error', message: 'Invalid action' });
    }
  } catch (error) {
    console.error("!!! CRITICAL HANDLER ERROR !!!:", error);
    return response.status(500).json({ status: 'error', message: 'Server Error: ' + error.message });
  }
};