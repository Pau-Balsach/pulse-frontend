# Pulse — Frontend

> Monitoring platform frontend built with Next.js 16. Provides a real-time dashboard, service detail pages, and a public status page.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Recharts** for latency charts
- **STOMP over SockJS** for real-time WebSocket updates
- **Docker** ready

## Features

- JWT-based authentication
- Real-time dashboard with WebSocket updates
- Service detail page with latency chart, check heatmap, and incident history
- Public status page (no login required) — shareable with anyone
- Auto-refresh every 60 seconds on the status page

## Pages

| Route | Auth | Description |
|-------|------|-------------|
| `/login` | No | Login page |
| `/dashboard` | Yes | Main dashboard with all services |
| `/dashboard/[serviceId]` | Yes | Service detail with charts |
| `/status/[projectId]` | No | Public status page |

## Getting Started

### Prerequisites

- Node.js 20+
- Pulse backend running on port 8080

### Configuration

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Run with Docker

From the backend repository root (where `docker-compose.yml` lives):

```bash
docker-compose up --build
```

This starts both backend and frontend together.

## Project Structure

```
app/
├── dashboard/
│   ├── page.tsx          # Main dashboard
│   └── [serviceId]/
│       └── page.tsx      # Service detail
├── login/
│   └── page.tsx          # Login
├── status/
│   └── [projectId]/
│       └── page.tsx      # Public status page
└── lib/
    └── api.ts            # Axios instance with JWT interceptor
```

## Screenshots

### Dashboard
Real-time monitoring of all services with uptime, latency, and incident count.

### Service Detail
Latency chart over time, check heatmap, and full incident history.

### Public Status Page
Shareable status page showing all services with uptime and response time — no login required.

## Backend

The backend repository is available at [pulse-backend](https://github.com/Pau-Balsach/pulse-backend).
