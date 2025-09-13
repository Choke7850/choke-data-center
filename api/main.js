import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { createHash } from 'crypto';

// --- Helper Functions ---
const hashPassword = (password) => {
  return createHash('sha256').update(password).digest('base64');
};

const getDoc = async () => {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
};


// --- Main Handler for Vercel ---
export default async function handler(request, response) {
  // --- CORS Headers ---
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*'); // Or your specific domain
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  // --- Main Logic ---
  const { action, data } = request.body;

  try {
    const doc = await getDoc();

    switch (action) {
      case 'verifyLogin': {
        const userSheet = doc.sheetsByTitle['users'];
        const rows = await userSheet.getRows();
        const inputPasswordHash = hashPassword(data.password);

        for (const row of rows) {
          if (row.get('username') === data.username && row.get('hashed_password') === inputPasswordHash) {
            // Log success (can be added later)
            return response.status(200).json({ status: 'success', displayName: row.get('display_name') });
          }
        }
        
        // Log failure (can be added later)
        return response.status(200).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
      
      // ... (เคสอื่นๆ สามารถแปลงมาใส่ตรงนี้ได้ในลักษณะเดียวกัน) ...

      default:
        return response.status(400).json({ status: 'error', message: 'Invalid action' });
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({ status: 'error', message: 'Server Error: ' + error.message });
  }
}