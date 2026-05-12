require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '519_auth_service', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`519_auth_service running on port ${PORT}`);
});
