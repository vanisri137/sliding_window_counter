# Distributed Rate Limiting System

> **Production-grade Sliding Window Counter Rate Limiter** — Redis · Spring Boot 3 · Next.js 14

A full-stack system that exposes a battle-tested Production-inspired Sliding Window Counter Rate Limiter through REST APIs and
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
│  Redis key expiration auto-removes
   stale buckets
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
3. A field-level TTL (`EXPIRE … NX`) is set on first write — old buckets expire automatically
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
| **Sliding Window Counter** | Sub-window bucketing with Redis Hash and automatic expiration |
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

### POST /api/request
Processes a request and applies rate limiting.

### GET /api/stats/{clientId}
Returns current usage statistics.

### DELETE /api/reset/{clientId}
Resets request counters for a client.

### GET /api/health
Health check endpoint.

### GET /api/config
Returns current rate limiter configuration.

### PUT /api/config
Updates rate limiter configuration at runtime.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts, Axios |
| Backend | Java 21, Spring Boot 3, Maven |
| Cache / State | Redis 7 |
| Redis Client | Jedis 5 |
| Testing | JUnit 5, TestContainers, Spring MockMvc |
| Containerisation | Docker, Docker Compose |
| Deployment | Vercel (frontend) · Render (backend) |

---

## Local Setup

### Prerequisites
- Java 21
- Node.js 20+
- Docker

### Run

```bash
git clone <repo>
cd rate-limiter-project

docker compose up --build
```
# new terminal
cd frontend
npm install
npm run dev

### Run Backend Tests

```bash
cd backend
mvn test           # unit tests
mvn verify         # includes TestContainers integration tests (requires Docker)
```

---

## Deployment

### Backend — Render 

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
- **Redis Internals** — Hash data structures, expiration policies, transactions
- **Spring Boot** — REST API design, DI, exception handling, CORS, dynamic config
- **Rate Limiting** — Sliding Window Counter vs Fixed Window trade-offs
- **System Design** — component separation, single-responsibility, testability
- **React / Next.js** — hooks, real-time state, data visualisation
- **Docker** — multi-stage builds, Compose orchestration
- **Testing** — TestContainers for true Redis integration tests

---

## License

MIT
