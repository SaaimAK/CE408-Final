# DataHive Inc. — Backend Microservices System
### CE408L Cloud Computing Lab | Final Examination | Spring 2026
**Ghulam Ishaq Khan Institute of Engineering Sciences and Technology**
> Instructor: Dr. Safia Baloch | Roll No: 519

---

## Overview

DataHive Inc. is a cloud-native, distributed backend system built for an online event management platform. The system is designed to migrate away from third-party SaaS analytics and operate on a fully self-hosted private cloud infrastructure, reducing costs while maintaining data sovereignty.

The system implements a lightweight **lakehouse ingestion pipeline** where users can register, login, and create events. Every event creation triggers asynchronous notifications via RabbitMQ and writes structured JSON logs to simulate a real-world analytical data ingestion workflow.

---

## Architecture

```
Client
  │
  ├──► 519_auth_service (Port 3001)    ──► PostgreSQL (users)
  │
  └──► 519_event_service (Port 3002)   ──► PostgreSQL (events)
             │
             │  Publishes (AMQP)
             ▼
       519_event_queue (RabbitMQ)
             │
             │  Consumes (AMQP)
             ▼
  519_notification_service (Port 3003) ──► JSON Log Files (519_logs volume)
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API development |
| PostgreSQL | Relational data storage |
| RabbitMQ | Asynchronous message broker |
| JWT (jsonwebtoken) | Stateless authentication |
| Docker + Docker Compose | Containerized deployment |
| bcryptjs | Password hashing |

---

## Services

### 1. `519_auth_service` — Authentication Service (Port 3001)
Handles user registration and login. Issues JWT tokens used to authenticate requests across other services.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login and receive JWT token | No |
| GET | `/health` | Health check | No |

### 2. `519_event_service` — Event Service (Port 3002)
Manages event creation and retrieval. On every new event, it publishes a message to RabbitMQ and writes a JSON log file for analytical ingestion.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/events` | Create a new event | JWT |
| GET | `/events` | View all events | JWT |
| GET | `/health` | Health check | No |

### 3. `519_notification_service` — Notification Service (Port 3003)
Asynchronously consumes messages from the `519_event_queue` RabbitMQ queue. Logs received notifications to the console and writes notification JSON logs to the shared volume.

---

## Project Structure

```
CE408-Final/
├── docker-compose.yml                  # Orchestrates all 5 containers
├── init.sql                            # PostgreSQL schema (users + events tables)
├── .gitignore
│
├── 519_auth_service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                    # Express app entry point
│       ├── db.js                       # PostgreSQL connection pool
│       └── routes/
│           └── auth.js                 # Register + Login routes
│
├── 519_event_service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                    # Express app entry point
│       ├── db.js                       # PostgreSQL connection pool
│       ├── publisher.js                # RabbitMQ message publisher
│       ├── logger.js                   # JSON log file writer
│       ├── middleware/
│       │   └── auth.js                 # JWT verification middleware
│       └── routes/
│           └── events.js               # Create + View event routes
│
├── 519_notification_service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                    # Express app entry point
│       └── consumer.js                 # RabbitMQ message consumer
│
└── DataHive_Report.html                # Technical report (see below)
```

---

## Running the Project

### Prerequisites
- Docker + Docker Compose (or WSL2 with Docker Engine)
- Node.js v18+

### Option A — Full Docker Deployment
```bash
docker compose up --build
```
All 5 containers (postgres, rabbitmq, auth, event, notification) will start automatically.

### Option B — Local Testing (Infrastructure in Docker, Services with Node)

**1. Start infrastructure only:**
```bash
docker compose up -d 519_postgres 519_rabbitmq
```

**2. Start each service in a separate terminal:**
```bash
# Terminal 1
cd 519_auth_service && npm install && npm start

# Terminal 2
cd 519_event_service && npm install && npm start

# Terminal 3
cd 519_notification_service && npm install && npm start
```

---

## Testing the APIs

### Register a user
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@datahive.com","password":"pass123"}'
```

### Login and save token
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@datahive.com","password":"pass123"}' | jq -r '.token')
```

### Create an event
```bash
curl -X POST http://localhost:3002/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"DataHive Launch","description":"Kickoff event","location":"Karachi","event_date":"2026-06-01"}'
```

### View all events
```bash
curl http://localhost:3002/events \
  -H "Authorization: Bearer $TOKEN"
```

### RabbitMQ Management UI
Open `http://localhost:15672` in browser — login with `datahive` / `datahive123`

---

## Infrastructure

| Container | Image | Port | Purpose |
|---|---|---|---|
| 519_postgres | postgres:15 | 5432 | Relational database |
| 519_rabbitmq | rabbitmq:3-management | 5672 / 15672 | Message broker + management UI |
| 519_auth_service | Custom (node:18-alpine) | 3001 | Auth REST API |
| 519_event_service | Custom (node:18-alpine) | 3002 | Event REST API |
| 519_notification_service | Custom (node:18-alpine) | 3003 | Async consumer |

All containers are connected via a Docker bridge network named `519_network`. A shared named volume `519_logs` is mounted into the Event and Notification services for JSON log file storage.

---

## Documents

### `DataHive_Report.html` — Technical Report
A detailed technical report covering two core aspects of the system:

**1. Distributed Systems Communication**
- Full microservices architecture breakdown
- Synchronous REST communication with JWT authentication
- Asynchronous RabbitMQ messaging between Event and Notification services
- Docker bridge networking and inter-container DNS resolution
- Fault tolerance and connection retry logic
- System communication diagrams

**2. Basic Analytical Data Ingestion Workflow**
- Lakehouse-style ingestion pipeline design
- Step-by-step event creation to JSON log file flow
- Dual-layer storage strategy (PostgreSQL + raw JSON files)
- Shared Docker volume as a simulated data lake layer
- Comparison of implementation against production lakehouse tools (S3, Kafka, Spark, Delta Lake)
- Sample log file structures with field explanations

> To open the report: Right-click `DataHive_Report.html` → Open with Microsoft Word → Save As `.docx`

---

## Naming Convention
All resources follow the exam naming convention using the last 3 digits of the student roll number:
- Containers: `519_auth_service`, `519_event_service`, `519_notification_service`, `519_postgres`, `519_rabbitmq`
- Docker network: `519_network`
- Docker volumes: `519_postgres_data`, `519_logs`
- RabbitMQ queue: `519_event_queue`

---

## Author
**Roll No:** 519
**Course:** CE408L Cloud Computing Lab
**Institution:** Ghulam Ishaq Khan Institute of Engineering Sciences and Technology
**Semester:** Spring 2026
