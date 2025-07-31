const express = require('express');
const cors = require('cors');
const axios = require('axios');
const config = require('../config');

const app = express();
const PORT = process.env.PORT || config.PORT;

app.use(cors());
app.use(express.json());

// API routes
app.get('/api/profiles', async (req, res) => {
  try {
    const response = await axios.get(`${config.SUPABASE_URL}/profile`, {
      headers: {
        'apikey': config.SUPABASE_API_KEY,
        'Authorization': `Bearer ${config.SUPABASE_API_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

app.get('/api/shift-preferences', async (req, res) => {
  try {
    const response = await axios.get(`${config.SUPABASE_URL}/shift_preference`, {
      headers: {
        'apikey': config.SUPABASE_API_KEY,
        'Authorization': `Bearer ${config.SUPABASE_API_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching shift preferences:', error);
    res.status(500).json({ error: 'Failed to fetch shift preferences' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 