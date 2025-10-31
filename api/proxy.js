const axios = require('axios');


module.exports = async (req, res) => {
  // Habilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
 
  try {
    const response = await axios.get('http://98.90.166.143:8000/s3/ec2/report');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Erro no proxy:', error.message);
    res.status(500).json({ error: error.message });
  }
};
