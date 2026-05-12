const amqp = require('amqplib');

let channel = null;
const QUEUE_NAME = process.env.QUEUE_NAME || '519_event_queue';

async function connectRabbitMQ(retries = 10) {
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });

      connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err.message);
        channel = null;
        setTimeout(() => connectRabbitMQ(), 5000);
      });

      console.log(`519_event_service: Connected to RabbitMQ, queue: ${QUEUE_NAME}`);
      return;
    } catch (err) {
      console.error(`RabbitMQ attempt ${i}/${retries} failed:`, err.message);
      if (i < retries) await new Promise((r) => setTimeout(r, 5000));
    }
  }
  console.error('Could not connect to RabbitMQ after max retries');
}

async function publishEvent(event) {
  if (!channel) {
    console.error('RabbitMQ channel unavailable, skipping publish');
    return;
  }
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(event)), { persistent: true });
  console.log(`Event published to ${QUEUE_NAME}: id=${event.id}, title="${event.title}"`);
}

module.exports = { connectRabbitMQ, publishEvent };
