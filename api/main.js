const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { createHash } = require('crypto');

// --- [สำคัญ] ข้อมูลลับทั้งหมดถูกใส่ไว้ตรงนี้แล้ว ---
const GOOGLE_SHEET_ID = "1-fCgt_-FON6NnN3WhIqqWqPKOMaGYRGibX6rCuPNO4E";
const GOOGLE_SERVICE_ACCOUNT_EMAIL = "vercel-sheet-connector@bold-script-471700-p3.iam.gserviceaccount.com";
const RAW_GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCWTLmjP6zizQO7\\nFbrtIY0cReaWs0S96YLLoJT+3X+6/LedtFg6NdP6EB2s5dqgqZj/w4ti2nrc94E7\\nRwqOrx35zA350zAlMyBKOB2nkx8NJMIXkgUBnXypOUlxzhhI2uDqqdmO9XnxEPwx\\n1xkuzlw23suOWF6x9Irz1jR/oNKqkkWhDqlgThixmYbHjTVOL++3yA2gfcWZOY1D\\n8KNSk75vJ7jXeTLZVj08exq1EUYTs8og4v8YQsDmVOn125PX/Yn1KvXQNEe7hBds\\noQB8cbDZVVkEofXTqyAMVRmP+8bum764UGiVD78aBzK2DZhOlXpKEg6kNECuFjRi\\np/zFX9lHAgMBAAECggEAARSvEoNFneeKDd/OfiA50hdRf7hKTBNQV6aEVH9mK72x\\nH/cDTlCUxxp5eT7/WUtTSIOOAtxVKMGe4KWFCwGgGHdk/2y5t4rDqtw8caDF76mI\\nXq6oTuweohjkdCFqLjM2MKhZeZw+pyXbB4C41lUEj98QuEOWOfML0YmscRB7hr5\\nbq+7BvSFQkZ5cDYLBOxEatq+NGzfnmZb8NkwsdWo1NIVBvRUD+XTsscrQrwuCWkF\\ne8mItIsMMPy2ccDDmEGCF5W9BmZPA8a4bk37qdJtXFRkcaGL5+FAOK7elDPDzpig\\nEn/6w2UJEAtkF8j9lvcqsDrOt2JS5DTBwLVU6tWwAQKBgQDQxpMr+I3vQVe5uk8+\\nRlnHTu06HsR7GA+UG/OSFlPml6iVT7KfJFF4fQjT8kKq+wH7rIzjQWklzzArrZz1\\nz6V8WtqPw4247tVwh1Itf6y0/RBmtixOtcO4i2Q2jZg7LdrOxH76H/gV6vtQXNTG\\n4AIljn7FDR04dyoOj66dKgPeYQKBgQC4TAYEC41HuOVQh/4vflj8PqTq30LyNTmw\\ngBDFtzetzZ4ikn8DMG/aJcpBYYfdlzsZRkC0lmREwCJJYyTMfau3R9aV+XT/1v+5\\nf9k2QPeZxTGQOD4aGFZck5uPKv4CkbQ6gG6SjOfOuHqf1UZ9s+Sa/Ipg5L9HCa5x\\nE93S397IpwKBgQDQpFK6E8kMvPmFtAqziqz4QQlVFyB2f+I5uwFdEpFAlnm01hQF\\ndM8yoYor/iTgKL+fm56lEl6ZmYhjbjq5cY3JTCa2m9DLa2vE7IeUzs5zhaBZdV+s\\nPXxetnctCa6EHdxY3QikwUQ160LC2jMOmRmsHM7V8LguEPDn4nG3wSBioQKBgA5k\\ncXvTYx8cw1u8ow8WcOCSC9MDyHidy3mLJsQqAMEj85uDkUOwfqusk9TzRub5LnZU\\n1CzGKeJslsDgazlE/yn7BDkGGCr6oVHdOBtSi4OIsMwweDkVeXkVVeqiUt/kfQys\\nhvYO5vNv2LOutiiO6eVon23dr0pe6S6PfJ1BOma1AoGAc5eLTCfbpuLTJElaaTQT\\nWMBX1VklcDaFtrNLGzfy89hWossEpuJ9by24NNcebIMjnKIVZ+Sedko6EhMHsopX\\nHOvAD3vDSDz+HU/4Nn0XhURaRpizKa1r6Z342tEfgngB4KzyrqgsT7DHzIJwjyob\\nGy2eNpPva2JZuiSyhUIbv4U=\\n-----END PRIVATE KEY-----";

// --- Helper Functions ---
const hashPassword = (password) => {
  return createHash('sha256').update(password).digest('base64');
};

const getDoc = async () => {
  // [FIX] This correctly formats the private key by replacing all '\\n' with actual newlines.
  const formattedPrivateKey = RAW_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const serviceAccountAuth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: formattedPrivateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
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
      // ... เคสอื่นๆ สามารถนำโค้ดจาก Back-End ตัวเต็มก่อนหน้านี้มาใส่ตรงนี้ได้ ...
      default:
        return response.status(400).json({ status: 'error', message: 'Invalid action' });
    }
  } catch (error) {
    console.error("!!! CRITICAL HANDLER ERROR !!!:", error);
    return response.status(500).json({ status: 'error', message: 'Server Error: ' + error.message });
  }
};