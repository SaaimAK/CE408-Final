const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');

const LOGS_DIR = process.env.LOGS_DIR || '/app/logs';
const QUEUE_NAME = process.env.QUEUE_NAME || '519_event_queue';

async function startConsumer() {
  const maxRetries = 15;

  for (let i = 1; i <= maxRetries; i++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await connection.createChannel();

      await channel.assertQueue(QUEUE_NAME, { durable: true });
      channel.prefetch(1);

      console.log(`519_notification_service: Listening on queue "${QUEUE_NAME}"`);

      channel.consume(QUEUE_NAME, (msg) => {
        if (!msg) return;

        const event = JSON.parse(msg.content.toString());

        console.log(`\n[NOTIFICATION] New event received`);
        console.log(`  ID:       ${event.id}`);
        console.log(`  Title:    ${event.title}`);
        console.log(`  Location: ${event.location || 'N/A'}`);
        console.log(`  Date:     ${event.event_date || 'N/A'}`);
        console.log(`  User ID:  ${event.user_id}`);
        console.log(`  At:       ${new Date().toISOString()}`);

        const notificationLog = {
          schema_version: '1.0',
          source: '519_notification_service',
          notification_type: 'event_created',
          notified_at: new Date().toISOString(),
          event,
        };

        const filename = path.join(LOGS_DIR, `notification_${event.id}_${Date.now()}.json`);
        fs.writeFile(filename, JSON.stringify(notificationLog, null, 2), (err) => {
          if (err) console.error('Failed to write notification log:', err.message);
        });

        channel.ack(msg);
      });

      connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err.message);
        setTimeout(startConsumer, 5000);
      });

      return;
    } catch (err) {
      console.error(`RabbitMQ connect attempt ${i}/${maxRetries} failed:`, err.message);
      if (i < maxRetries) await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.error('Failed to connect to RabbitMQ after max retries. Exiting.');
  process.exit(1);
}

module.exports = { startConsumer };
