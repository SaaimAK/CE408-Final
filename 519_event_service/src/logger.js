const fs = require('fs');
const path = require('path');

const LOGS_DIR = process.env.LOGS_DIR || '/app/logs';

function writeEventLog(event) {
  const logEntry = {
    schema_version: '1.0',
    source: '519_event_service',
    ingested_at: new Date().toISOString(),
    event,
  };

  const filename = path.join(LOGS_DIR, `event_${event.id}_${Date.now()}.json`);

  fs.writeFile(filename, JSON.stringify(logEntry, null, 2), (err) => {
    if (err) console.error('Failed to write event log:', err.message);
    else console.log(`Event log written: ${filename}`);
  });
}

module.exports = { writeEventLog };
