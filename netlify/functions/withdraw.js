const axios = require('axios');
const API_KEY = process.env.NEVAPEDIA_API_KEY || 'SKY_b7f0f8c3deef4f52';

exports.handler = async (event) => {
  const { amount, method, account_number, instant } = event.queryStringParameters || {};
  if (!amount || !method || !account_number)
    return { statusCode: 400, body: JSON.stringify({ error: 'data kurang' }) };
  try {
    const { data } = await axios.get(
      `https://app.nevapedia.com/api/withdraw?apikey=${API_KEY}&amount=${amount}&method=${method}&account_number=${account_number}&instant=${instant || 'false'}`
    );
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
