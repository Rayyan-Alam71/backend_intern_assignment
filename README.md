# Task Management API

A scalable REST API with JWT authentication and role-based access control, featuring a React frontend for demo purposes.

## Tech Stack

**Backend:** Node.js + Express + TypeScript + Prisma (PostgreSQL)
**Frontend:** React + TypeScript + Tailwind CSS

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/primetrade"
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

## Setup

### Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev    # runs on port 5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # runs on port 5173
```

## API Endpoints

### Auth Module (`/api/v1/auth`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/register` | Public | Register user |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/me` | Private | Get current user info |

### Tasks Module (`/api/v1/tasks`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | user + admin | Get tasks (admin sees all) |
| POST | `/` | user + admin | Create task |
| PUT | `/:id` | owner or admin | Update task |
| DELETE | `/:id` | owner or admin | Delete task |

## API Documentation

Swagger docs available at: `http://localhost:5000/api/docs`

## Scalability Note

**Current:** Monolithic Express app, PostgreSQL via Prisma, single server.

**To scale:**
- Split auth and tasks into separate microservices
- Add Redis caching for task list reads
- Load balance with Nginx / AWS ALB across multiple instances
- Containerize with Docker + Docker Compose
- Use a message queue (BullMQ) for async jobs



claude --resume f839bb6d-7a5e-4495-9684-5b3ed5a816ed