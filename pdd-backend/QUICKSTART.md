# Quick Start Guide

Get the EduSync Backend running in 5 minutes for local development.

## Installation

### 1. Clone & Install
```bash
cd pdd-teju-backend
npm install
```

### 2. Setup Database
```bash
# Create .env file (SQLite for local dev)
cp .env.example .env

# Initialize database
npm run prisma:push

# (Optional) Open database GUI
npm run prisma:studio
```

### 3. Start Server
```bash
npm run dev
```

Server runs on: **http://localhost:5000/api**

---

## Test the API

### Option 1: Using cURL

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "name": "Test User"
  }'
```

Save the `token` from response.

#### Submit Survey
```bash
curl -X POST http://localhost:5000/api/survey/submit \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "focusDomain": "Frontend",
    "proficiency": "Intermediate",
    "learningHours": 10
  }'
```

#### Get Recommendations
```bash
curl -X GET http://localhost:5000/api/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Option 2: Using Postman

1. Import [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. Set base URL: `http://localhost:5000/api`
3. Register → Copy token → Use in other requests

### Option 3: Using VS Code REST Client

Create `test.rest` file:
```http
### Register
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123",
  "name": "Test User"
}

### Submit Survey
@token = <paste-token-from-register-here>
POST http://localhost:5000/api/survey/submit
Authorization: Bearer @token
Content-Type: application/json

{
  "focusDomain": "Frontend",
  "proficiency": "Intermediate",
  "learningHours": 10
}

### Get Recommendations
GET http://localhost:5000/api/recommendations
Authorization: Bearer @token
```

Install "REST Client" extension, then click "Send Request" above each block.

---

## Project Structure

```
pdd-teju-backend/
├── src/
│   ├── index.ts              # Main server file
│   ├── config/
│   │   ├── config.ts        # Environment config
│   │   └── database.ts      # Prisma client
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Auth, error handling
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Helper functions
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── dev.db              # SQLite database
├── package.json
├── tsconfig.json
├── .env                     # Environment variables
├── README.md                # Full documentation
├── API_DOCUMENTATION.md     # API endpoints
├── PRISMA_SETUP.md          # Database guide
├── RENDER_DEPLOYMENT.md     # Deployment guide
└── Dockerfile               # For Docker deployment
```

---

## Key Files

### Main Server
[src/index.ts](src/index.ts) - Express app setup, routes, middleware

### Database Schema
[prisma/schema.prisma](prisma/schema.prisma) - Tables and relationships

### Authentication
[src/services/authService.ts](src/services/authService.ts) - Register/login logic

### Recommendations Engine
[src/services/recommendationService.ts](src/services/recommendationService.ts) - Course recommendations

### API Aggregator
[src/services/apiAggregator.ts](src/services/apiAggregator.ts) - YouTube, GitHub, Dev.to integration

---

## Common Tasks

### Add New Endpoint

1. **Create route** in `src/routes/new.ts`
2. **Create controller** in `src/controllers/newController.ts`
3. **Import in** `src/index.ts`

Example:
```typescript
// src/routes/new.ts
import { Router } from "express";
import * as newController from "../controllers/newController";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.get("/", authMiddleware, newController.getData);
export default router;
```

### Access Database

Use Prisma client:
```typescript
import prisma from "../config/database";

// Query
const user = await prisma.user.findUnique({ where: { id: "123" } });

// Create
const newUser = await prisma.user.create({
  data: { name: "John", email: "john@example.com", password: "hashed" }
});

// Update
await prisma.user.update({ where: { id: "123" }, data: { name: "Jane" } });

// Delete
await prisma.user.delete({ where: { id: "123" } });
```

### Update Database Schema

1. Edit `prisma/schema.prisma`
2. Run: `npm run prisma:push`
3. Regenerate types: `npm run prisma:generate`

### Run Tests

```bash
# Unit tests (when added)
npm test

# Type check
npm run build
```

### Build for Production

```bash
npm run build
npm start
```

Compiled code goes to `dist/` directory.

---

## Debugging

### Enable Verbose Logging
```bash
NODE_ENV=development npm run dev
```

### View Database
```bash
npm run prisma:studio
```

Opens: http://localhost:5555

### Check Database Migrations
```bash
npm run prisma:migrate status
```

### Reset Database (WARNING: Deletes all data)
```bash
npx prisma migrate reset
```

---

## Frontend Integration

### React Web
Set API base URL to: `http://localhost:5000/api`

### React Native
Set API base URL to: `http://localhost:5000/api`

Example:
```typescript
const API_BASE = 'http://localhost:5000/api';

// Register
const response = await fetch(`${API_BASE}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name })
});

const { token } = await response.json();
```

---

## Environment Variables

See `.env` file:

```env
PORT=5000                              # Server port
NODE_ENV=development                   # development|production
DATABASE_URL=file:./prisma/dev.db     # SQLite for local dev
JWT_SECRET=secret-key                  # Change in production
JWT_EXPIRE=7d                          # Token expiration
CORS_ORIGIN=http://localhost:3000     # Allowed origins
```

---

## Helpful Links

- [Express.js Docs](https://expressjs.com/)
- [Prisma ORM Docs](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JWT Explained](https://jwt.io/)
- [REST API Best Practices](https://restfulapi.net/)

---

## Production Checklist

Before deploying to production:

- [ ] Update JWT_SECRET with strong random value
- [ ] Set NODE_ENV=production
- [ ] Configure PostgreSQL database
- [ ] Update CORS_ORIGIN with your domain
- [ ] Add API keys (YouTube, GitHub)
- [ ] Enable HTTPS on your server
- [ ] Set up monitoring & logging
- [ ] Configure rate limiting
- [ ] Backup database strategy
- [ ] Test all endpoints
- [ ] Load test under expected traffic

---

## Still Need Help?

1. Check [README.md](./README.md) for full documentation
2. See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoint details
3. Check [PRISMA_SETUP.md](./PRISMA_SETUP.md) for database help
4. Review [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for deployment

**Happy coding! 🚀**

