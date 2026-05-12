require('dotenv').config();
const express = require('express');
const { startConsumer } = require('./consumer');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '519_notification_service', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`519_notification_service running on port ${PORT}`);
});

startConsumer().catch((err) => {
  console.error('Consumer startup failed:', err.message);
  process.exit(1);
});
