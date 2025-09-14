const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { createHash } = require('crypto');

// --- Helper Functions ---
const hashPassword = (password) => {
  return createHash('sha256').update(password).digest('base64');
};

const getDoc = async () => {
  console.log("Attempting to initialize Google Auth...");

  // Detailed check for environment variables
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) throw new Error("ERROR: GOOGLE_SERVICE_ACCOUNT_EMAIL is missing.");
  if (!process.env.GOOGLE_PRIVATE_KEY) throw new Error("ERROR: GOOGLE_PRIVATE_KEY is missing.");
  if (!process.env.GOOGLE_SHEET_ID) throw new Error("ERROR: GOOGLE_SHEET_ID is missing.");
  
  console.log("All environment variables found. Creating JWT...");

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: JSON.parse(`"${process.env.GOOGLE_PRIVATE_KEY}"`),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  console.log("JWT created. Connecting to Google Spreadsheet...");
  
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  
  console.log("Successfully connected to spreadsheet:", doc.title);
  return doc;
};

// --- Main Handler for Vercel ---
module.exports = async (request, response) => {
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
        if (!userSheet) throw new Error("Sheet 'users' not found.");
        
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
      // ... Other cases can be added here ...
      default:
        return response.status(400).json({ status: 'error', message: 'Invalid action' });
    }
  } catch (error) {
    console.error("!!! CRITICAL HANDLER ERROR !!!:", error);
    return response.status(500).json({ status: 'error', message: 'Server Error: ' + error.message });
  }
};