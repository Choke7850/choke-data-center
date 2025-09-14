const { JWT } = require('google-auth-library');
const { google } = require('googleapis');

// --- [สำคัญ] ข้อมูลลับทั้งหมดถูกใส่ไว้ตรงนี้แล้ว ---
const GOOGLE_SERVICE_ACCOUNT_EMAIL = "vercel-sheet-connector@bold-script-471700-p3.iam.gserviceaccount.com";
const GOOGLE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCWTLmjP6zizQO7\nFbrtIY0cReaWs0S96YLLoJT+3X+6/LedtFg6NdP6EB2s5dqgqZj/w4ti2nrc94E7\nRwqOrx35zA350zAlMyBKOB2nkx8NJMIXkgUBnXypOUlxzhhI2uDqqdmO9XnxEPwx\n1xkuzlw23suOWF6x9Irz1jR/oNKqkkWhDqlgThixmYbHjTVOL++3yA2gfcWZOY1D\n8KNSk75vJ7jXeTLZVj08exq1EUYTs8og4v8YQsDmVOn125PX/Yn1KvXQNEe7hBds\noQB8cbDZVVkEofXTqyAMVRmP+8bum764UGiVD78aBzK2DZhOlXpKEg6kNECuFjRi\np/zFX9lHAgMBAAECggEAARSvEoNFneeKDd/OfiA50hdRf7hKTBNQV6aEVH9mK72x\nH/cDTlCUxxp5eT7/WUtTSIOOAtxVKMGe4KWFCwGgGHdk/2y5t4rDqtw8caDF76mI\nXq6oTuweohjkdCFqLjM2MKhZeZw+pyXbB4C41lUEj98QuEOWOfML0YmscRB7hr5\nbq+7BvSFQkZ5cDYLBOxEatq+NGzfnmZb8NkwsdWo1NIVBvRUD+XTsscrQrwuCWkF\ne8mItIsMMPy2ccDDmEGCF5W9BmZPA8a4bk37qdJtXFRkcaGL5+FAOK7elDPDzpig\nEn/6w2UJEAtkF8j9lvcqsDrOt2JS5DTBwLVU6tWwAQKBgQDQxpMr+I3vQVe5uk8+\nRlnHTu06HsR7GA+UG/OSFlPml6iVT7KfJFF4fQjT8kKq+wH7rIzjQWklzzArrZz1\nz6V8WtqPw4247tVwh1Itf6y0/RBmtixOtcO4i2Q2jZg7LdrOxH76H/gV6vtQXNTG\n4AIljn7FDR04dyoOj66dKgPeYQKBgQC4TAYEC41HuOVQh/4vflj8PqTq30LyNTmw\ngBDFtzetzZ4ikn8DMG/aJcpBYYfdlzsZRkC0lmREwCJJYyTMfau3R9aV+XT/1v+5\nf9k2QPeZxTGQOD4aGFZck5uPKv4CkbQ6gG6SjOfOuHqf1UZ9s+Sa/Ipg5L9HCa5x\nE93S397IpwKBgQDQpFK6E8kMvPmFtAqziqz4QQlVFyB2f+I5uwFdEpFAlnm01hQF\ndM8yoYor/iTgKL+fm56lEl6ZmYhjbjq5cY3JTCa2m9DLa2vE7IeUzs5zhaBZdV+s\nPXxetnctCa6EHdxY3QikwUQ160LC2jMOmRmsHM7V8LguEPDn4nG3wSBioQKBgA5k\ncXvTYx8cw1u8ow8WcOCSC9MDyHidy3mLJsQqAMEj85uDkUOwfqusk9TzRub5LnZU\n1CzGKeJslsDgazlE/yn7BDkGGCr6oVHdOBtSi4OIsMwweDkVeXkVVeqiUt/kfQys\nhvYO5vNv2LOutiiO6eVon23dr0pe6S6PfJ1BOma1AoGAc5eLTCfbpuLTJElaaTQT\nWMBX1VklcDaFtrNLGzfy89hWossEpuJ9by24NNcebIMjnKIVZ+Sedko6EhMHsopX\nHOvAD3vDSDz+HU/DSDz+HU/4Nn0XhURaRpizKa1r6Z342tEfgngB4KzyrqgsT7DHzIJwjyob\nGy2eNpPva2JZuiSyhUIbv4U=\n-----END PRIVATE KEY-----`;

module.exports = async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') return response.status(200).end();

  try {
    const auth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive'], // [สำคัญ] เปลี่ยน Scope เป็น Drive
    });

    const drive = google.drive({ version: 'v3', auth });
    
    // ID ของโฟลเดอร์หลักที่คุณแชร์ไว้
    const parentFolderId = '1ierKIqQjXnZvfEg7TDJqJmUKyJKBHsAW'; 

    await drive.files.create({
      requestBody: {
        name: `Test_Folder_From_Vercel_${new Date().getTime()}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      },
    });

    return response.status(200).json({ status: 'success', message: 'สร้างโฟลเดอร์ทดสอบใน Google Drive สำเร็จ!' });
  } catch (error) {
    console.error("!!! DRIVE TEST ERROR !!!:", error);
    return response.status(500).json({ status: 'error', message: 'Server Error: ' + error.message });
  }
};