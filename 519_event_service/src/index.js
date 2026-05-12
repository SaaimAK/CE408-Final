require('dotenv').config();
const express = require('express');
const { connectRabbitMQ } = require('./publisher');
const eventRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '519_event_service', timestamp: new Date().toISOString() });
});

app.use('/events', eventRoutes);

connectRabbitMQ();

app.listen(PORT, () => {
  console.log(`519_event_service running on port ${PORT}`);
});
