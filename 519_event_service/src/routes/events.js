const express = require('express');
const pool = require('../db');
const { publishEvent } = require('../publisher');
const { writeEventLog } = require('../logger');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// POST /events — create a new event (protected)
router.post('/', verifyToken, async (req, res) => {
  const { title, description, location, event_date } = req.body;
  const userId = req.user.userId;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (title, description, location, event_date, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || null, location || null, event_date || null, userId]
    );

    const event = result.rows[0];

    // Asynchronously publish to RabbitMQ (lakehouse ingestion trigger)
    publishEvent({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      event_date: event.event_date,
      user_id: event.user_id,
      created_at: event.created_at,
    });

    // Write JSON log file for analytical/lakehouse-style ingestion
    writeEventLog(event);

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (err) {
    console.error('Create event error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /events — view all events (protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.location, e.event_date, e.created_at,
              u.id AS user_id, u.username
       FROM events e
       JOIN users u ON e.user_id = u.id
       ORDER BY e.created_at DESC`
    );

    res.json({
      count: result.rows.length,
      events: result.rows,
    });
  } catch (err) {
    console.error('Get events error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
