# Live Polling System

A full-stack real-time polling application with Teacher and Student personas, built with React, Node.js, Socket.io, and MongoDB.

## Features

- 🗳️ **Real-time polling** — votes sync instantly via Socket.io
- ⏱️ **Server-synced timer** — students joining late see correct remaining time
- 🔄 **State recovery** — page refresh restores exact poll state
- 🛡️ **Duplicate prevention** — server-side unique constraint prevents double votes
- 📊 **Live charts** — animated vote percentage bars
- 📚 **Poll history** — DB-backed history for teachers
- 💬 **Chat** — real-time class chat between teacher and students
- 📱 **Responsive** — works on mobile and desktop

## Architecture

```
server/
  src/
    models/        — Poll, Vote (Mongoose schemas)
    services/      — PollService (all business logic)
    controllers/   — PollController (HTTP handlers)
    routes/        — REST API routes
    sockets/       — Socket event handlers (no business logic)
    middleware/    — Error handler

client/
  src/
    hooks/         — useSocket, usePollTimer, usePoll, useToast
    context/       — AppContext (global state)
    components/    — Timer, ResultsPanel, Toast, Chat, ConnectionBanner
    pages/         — RolePicker, TeacherDashboard, StudentView
    types/         — Shared TypeScript types
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Environment Variables

### server/.env
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/live-polling
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### client/.env
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Backend Setup

```bash
cd server
npm install
npm run dev
```

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

## Database Setup

Start MongoDB locally:
```bash
mongod
```
Or use MongoDB Atlas and update `MONGODB_URI` in `server/.env`.

## Running Locally

Open two terminals:
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Documentation

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/polls` | Create a new poll |
| GET | `/api/polls/active` | Get active poll |
| POST | `/api/polls/:id/vote` | Submit a vote |
| GET | `/api/polls/:id/results` | Get poll results |
| PATCH | `/api/polls/:id/end` | End a poll |
| GET | `/api/polls/history` | Poll history (paginated) |
| DELETE | `/api/polls/:id/students/:name` | Remove student from poll |

### Socket Events

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `register:teacher` | — | Register as teacher |
| `register:student` | `{ studentName }` | Register as student |
| `poll:create` | `{ question, options[], duration, createdBy }` | Create poll |
| `poll:vote` | `{ pollId, studentName, optionId }` | Submit vote |
| `poll:end` | `{ pollId }` | End poll manually |
| `chat:message` | `{ name, message, role }` | Send chat message |

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `poll:new` | `{ poll, remainingTime, serverTime }` | New poll started |
| `poll:state` | `{ poll, remainingTime, results, totalVotes, hasVoted }` | State sync on connect |
| `poll:results_update` | `{ pollId, results, totalVotes }` | Vote update broadcast |
| `poll:ended` | `{ pollId, results, totalVotes, auto }` | Poll ended |
| `students:count` | `{ count }` | Connected student count |
| `chat:message` | `{ id, name, message, role, timestamp }` | Relay chat message |

## Database Schema

### Polls Collection
```json
{
  "_id": "ObjectId",
  "question": "string",
  "options": [{ "id": "uuid", "text": "string" }],
  "duration": 60,
  "startTime": "Date",
  "endTime": "Date",
  "isActive": true,
  "createdBy": "Teacher",
  "createdAt": "Date"
}
```

### Votes Collection
```json
{
  "_id": "ObjectId",
  "pollId": "ObjectId (ref: Poll)",
  "studentName": "string",
  "optionId": "uuid",
  "votedAt": "Date"
}
```
Unique compound index: `{ pollId, studentName }` — prevents duplicate votes.

## Deployment

### Frontend (Vercel / Netlify)
```bash
cd client
npm run build
# Deploy dist/ folder
```
Set environment variable: `VITE_API_URL`, `VITE_SOCKET_URL` → your backend URL.

### Backend (Render / Railway)
Set environment variables: `PORT`, `MONGODB_URI`, `CLIENT_URL` → your frontend URL.

## Technical Highlights

- **Timer Sync**: Server sends `startTime` (epoch), client computes `remainingTime = duration - (Date.now() - startTime)`
- **Duplicate Vote Prevention**: MongoDB compound unique index `{ pollId, studentName }` prevents double votes at DB level
- **State Recovery**: On mount, client fetches `/api/polls/active` and restores UI exactly where it left off
- **Optimistic UI**: Vote UI updates immediately; reverts if server rejects
