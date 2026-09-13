const axios = require('axios');
const API_KEY = process.env.NEVAPEDIA_API_KEY || 'SKY_b7f0f8c3deef4f52';

exports.handler = async (event) => {
  const id = event.queryStringParameters?.invoice_id;
  if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'invoice_id wajib' }) };
  try {
    const { data } = await axios.get(`https://app.nevapedia.com/api/invoice/status?apikey=${API_KEY}&invoice_id=${id}`);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
