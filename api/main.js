// A simple test function that does NOT connect to Google Sheets.
module.exports = (request, response) => {
  // --- CORS Headers ---
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Always return a "wrong password" message, just for testing the connection.
  return response.status(200).json({
    status: 'error',
    message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
  });
};