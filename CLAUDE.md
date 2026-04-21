# CLAUDE.md – Backend Intern Assignment (Primetrade.ai)

## Project Overview

Build a **Scalable REST API with JWT Auth + Role-Based Access Control**, with a simple React frontend to demo the APIs.

**Stack:**
- **Backend:** Node.js + Express + TypeScript + Prisma (PostgreSQL)
- **Frontend:** React + TypeScript + Tailwind CSS

---

## Project Structure

```
backend_intern_assignment/
├── backend/                        # Express + TypeScript + Prisma (scaffolded)
│   ├── src/
│   │   ├── config/                 # env config, prisma client instance
│   │   ├── middleware/             # authenticate, authorize, errorHandler, validate
│   │   ├── modules/
│   │   │   ├── auth/               # register, login controllers + routes
│   │   │   └── tasks/             # CRUD controllers + routes
│   │   ├── routes/                # v1 route aggregator
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma          # User + Task models
│   ├── .env.example
│   └── package.json
├── frontend/                      # React + TypeScript + Tailwind (scaffolded)
│   ├── src/
│   │   ├── pages/                 # Login, Register, Dashboard
│   │   ├── components/            # TaskCard, Navbar, ProtectedRoute
│   │   ├── api/                   # axios instance with JWT interceptor
│   │   └── App.tsx
│   └── package.json
├── GOAL.md
├── CLAUDE.md
└── README.md
```

---

## Backend – What to Build

### Auth Module (`/api/v1/auth`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/register` | Public | Register user (role: `USER` default) |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/me` | Private | Get current user info |

- Hash passwords with **bcryptjs** (saltRounds: 10)
- Sign JWT with `process.env.JWT_SECRET`, expiry `7d`
- Role: `USER` or `ADMIN` (Prisma enum)

### Tasks Module (`/api/v1/tasks`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | user + admin | Get own tasks (admin sees all) |
| POST | `/` | user + admin | Create task |
| PUT | `/:id` | owner or admin | Update task |
| DELETE | `/:id` | owner or admin | Delete task |

### Middleware

- `authenticate.ts` – verify JWT, attach `req.user`
- `authorize.ts` – check role (`authorize("ADMIN")`)
- `validate.ts` – zod or express-validator rules per route
- `errorHandler.ts` – global error handler, consistent JSON shape

### Response Format

```json
// Success
{ "success": true, "data": { } }

// Error
{ "success": false, "message": "...", "errors": [] }
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(USER)
  tasks     Task[]
  createdAt DateTime @default(now())
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      Status   @default(TODO)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
}

enum Role   { USER ADMIN }
enum Status { TODO IN_PROGRESS DONE }
```

---

## Frontend – What to Build

3 pages, keep it simple:

1. **`/register`** – name, email, password → POST `/auth/register` → redirect to login
2. **`/login`** – email, password → POST `/auth/login` → save JWT to `localStorage` → redirect to dashboard
3. **`/dashboard`** (protected) – list tasks, add/edit/delete, show user name + role

Key things:
- Axios instance in `api/axios.ts` — attach `Authorization: Bearer <token>` via interceptor
- `ProtectedRoute` component — redirect to `/login` if no token
- Show inline success/error messages from API responses
- Logout clears `localStorage` and redirects to `/login`
- Style with Tailwind — keep it clean, no need to over-design

---

## Security Checklist

- [x] `bcryptjs` for password hashing
- [x] JWT secret in `.env`, never hardcoded
- [x] Input validation on all POST/PUT routes
- [x] Role check middleware before admin-only actions
- [x] `helmet` + `cors` on Express app
- [x] `.env` in `.gitignore`

---

## API Versioning

All routes under `/api/v1/`. Future breaking changes → add `/api/v2/`, both coexist.

---

## Packages

### Backend (additions to scaffold)
```bash
bcryptjs jsonwebtoken zod cors helmet morgan swagger-ui-express
@types/bcryptjs @types/jsonwebtoken @types/cors
```

### Frontend (additions to scaffold)
```bash
axios react-router-dom react-hot-toast
```

---

## Swagger Docs

- Serve at `/api/docs` via `swagger-ui-express`
- Document all routes: method, path, body, response, auth required
- Enable Bearer token input in Swagger UI

---

## Scalability Note (for README)

> **Current:** Monolithic Express app, PostgreSQL via Prisma, single server.
>
> **To scale:**
> - Split auth and tasks into separate microservices
> - Add Redis caching for task list reads
> - Load balance with Nginx / AWS ALB across multiple instances
> - Containerize with Docker + Docker Compose
> - Use a message queue (BullMQ) for async jobs

---

## README Must Include

- [ ] Project description (2–3 lines)
- [ ] Tech stack
- [ ] `.env.example` variables explained
- [ ] Setup: `npm install` → `npx prisma migrate dev` → `npm run dev`
- [ ] API endpoints table
- [ ] Swagger URL
- [ ] Scalability note

---

## Quick Commands

```bash
# Backend
cd backend && npm install
npx prisma migrate dev --name init
npm run dev                          # port 5000

# Frontend
cd frontend && npm install
npm run dev                          # port 5173
```

```env
# backend/.env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/primetrade"
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
```