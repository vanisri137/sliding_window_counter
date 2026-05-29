# Distributed Rate Limiting System

> **Production-grade Sliding Window Counter Rate Limiter** — Redis · Spring Boot 3 · Next.js 14

A full-stack system that exposes a battle-tested rate-limiting algorithm through REST APIs and
visualises it in real time on a modern dashboard. Built as a portfolio project to demonstrate
distributed systems, Redis internals, and clean system-design thinking.

---

## Architecture

```
┌─────────────────────────────────────┐
│         Next.js 14 Frontend         │
│   TypeScript · Tailwind · Recharts  │
│                                     │
│  Dashboard Cards  Request Simulator │
│  Sliding Window Viz  History Table  │
│  Dynamic Config  Rate Chart         │
└──────────────┬──────────────────────┘
               │ REST (Axios)
               ▼
┌─────────────────────────────────────┐
│       Spring Boot 3 Backend         │
│           Java 21 · Maven           │
│                                     │
│  POST /api/request                  │
│  GET  /api/stats/:clientId          │
│  DELETE /api/reset/:clientId        │
│  GET  /api/health                   │
│  GET|PUT /api/config                │
└──────────────┬──────────────────────┘
               │ Jedis
               ▼
┌─────────────────────────────────────┐
│              Redis 7                │
│                                     │
│  Hash per client (rate_limit:user1) │
│  Field = sub-window index           │
│  Value = request count in bucket    │
│  HEXPIRE (NX) auto-expires buckets  │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  SlidingWindowCounterRateLimiter    │
│                                     │
│  Original algorithm — unchanged     │
│  Wrapped by Spring service layer    │
└─────────────────────────────────────┘
```

---

## Algorithm: Sliding Window Counter

The core algorithm divides the rolling window into fixed-size **sub-windows (buckets)**:

1. Each request maps to the current sub-window index: `currentTime / subWindowSize`
2. The count for that bucket is incremented atomically in a Redis MULTI/EXEC transaction
3. A field-level TTL (`HEXPIRE … NX`) is set on first write — old buckets expire automatically
4. Before allowing a request, the sum across all live buckets is compared against the limit

This gives a **smooth sliding window** without the fixed-boundary spikes of a simple counter,
and without the memory overhead of a sorted-set per user.

```
Time →  [  bucket 0  |  bucket 1  |  bucket 2  |  bucket 3  ]
                        ^expires        ^current
Window:  ←──────────────────────── 60 s ───────────────────→
```

---

## Features

| Feature | Details |
|---------|---------|
| **Sliding Window Counter** | Sub-window bucketing with Redis Hash + HEXPIRE |
| **Multiple Clients** | Independent limits per `clientId` |
| **Dynamic Config** | Change limit / window / sub-window at runtime via `PUT /api/config` |
| **Real-Time Dashboard** | Live stat cards, dot timeline, bar chart |
| **Request History** | Last 20 requests with timestamps and status |
| **Docker Compose** | One-command local stack (Redis + Backend) |
| **Integration Tests** | TestContainers Redis, full Spring Boot context |

---

## Screenshots

> _Add screenshots here after first deployment_

| Dashboard | Rate Limited | Window Visualization |
|-----------|-------------|----------------------|
| `screenshot-dashboard.png` | `screenshot-rate-limited.png` | `screenshot-viz.png` |

---

## API Reference

### `POST /api/request`
Send a request for a client.

```json
// Request
{ "clientId": "user1" }

// Response 200 — allowed
{ "allowed": true,  "remainingRequests": 4, "limit": 5, "windowSeconds": 60 }

// Response 429 — rate limited
{ "allowed": false, "remainingRequests": 0, "limit": 5, "windowSeconds": 60, "message": "Rate limit exceeded" }
```

### `GET /api/stats/{clientId}`
```json
{
  "clientId": "user1",
  "currentRequests": 3,
  "remainingRequests": 2,
  "limit": 5,
  "windowSeconds": 60,
  "subWindowSeconds": 10
}
```

### `DELETE /api/reset/{clientId}`
Clears Redis state for the client. Returns `204 No Content`.

### `GET /api/health`
```json
{ "status": "UP" }
```

### `GET /api/config`
```json
{ "limit": 10, "windowSeconds": 60, "subWindowSeconds": 10 }
```

### `PUT /api/config`
Reconfigure at runtime — no restart needed.
```json
// Request body
{ "limit": 20, "windowSeconds": 120, "subWindowSeconds": 15 }
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts, Axios |
| Backend | Java 21, Spring Boot 3, Maven |
| Cache / State | Redis 7 |
| Redis Client | Jedis 5 |
| Testing | JUnit 5, TestContainers, Spring MockMvc |
| Containerisation | Docker, Docker Compose |
| Deployment | Vercel (frontend) · Render / Railway (backend) |

---

## Local Setup

### Prerequisites
- Java 21, Maven 3.9+
- Node.js 20+
- Docker + Docker Compose

### Option A — Docker Compose (recommended)

```bash
git clone https://github.com/your-username/distributed-rate-limiter
cd distributed-rate-limiter

# Start Redis + Spring Boot
docker compose up --build

# In a second terminal — start the frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Option B — Manual

```bash
# 1. Start Redis
docker run -p 6379:6379 redis:7-alpine

# 2. Start Spring Boot backend
cd backend
mvn spring-boot:run

# 3. Start Next.js frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

### Run Backend Tests

```bash
cd backend
mvn test           # unit tests
mvn verify         # includes TestContainers integration tests (requires Docker)
```

---

## Deployment

### Backend — Render / Railway

1. Push `backend/` to a GitHub repo
2. Create a new **Web Service** pointing to the `backend/` folder
3. Set build command: `mvn package -DskipTests`
4. Set start command: `java -jar target/rate-limiter-1.0.0.jar`
5. Add environment variables:
   - `REDIS_HOST` → your Redis host
   - `REDIS_PORT` → `6379`

### Frontend — Vercel

```bash
cd frontend
npx vercel
# Set NEXT_PUBLIC_API_URL to your backend URL when prompted
```

---

## Future Enhancements

- [ ] WebSocket / SSE for true real-time stats push
- [ ] Per-client configuration overrides
- [ ] Prometheus metrics endpoint (`/actuator/prometheus`)
- [ ] Grafana dashboard
- [ ] Token Bucket algorithm comparison mode
- [ ] IP-based rate limiting middleware
- [ ] Admin UI for key inspection

---

## What This Demonstrates

> This project was built as a portfolio piece to showcase practical distributed systems knowledge.

- **Distributed Systems** — shared Redis state across horizontally-scaled instances
- **Redis Internals** — Hash data structure, field-level TTL via HEXPIRE
- **Spring Boot** — REST API design, DI, exception handling, CORS, dynamic config
- **Rate Limiting** — Sliding Window Counter vs Fixed Window trade-offs
- **System Design** — component separation, single-responsibility, testability
- **React / Next.js** — hooks, real-time state, data visualisation
- **Docker** — multi-stage builds, Compose orchestration
- **Testing** — TestContainers for true Redis integration tests

---

## License

MIT
