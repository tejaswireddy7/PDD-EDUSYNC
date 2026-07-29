# EduSync Backend - REST API

Production-ready REST API backend for the EduSync adaptive learning platform using Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL/SQLite.

## 🚀 Features

- **JWT Authentication** - Secure user authentication with JWT tokens and bcrypt password hashing
- **Adaptive Learning Engine** - Dynamic course recommendations based on 4 focus domains and 3 proficiency tiers
- **Multi-Provider API Aggregator** - Integrates YouTube, GitHub, Dev.to, and Wikipedia/Coursera for fresh content
- **Survey System** - Onboarding survey with 7-day cooldown and skip functionality
- **Intelligent Caching** - Database cache with API fallback strategy
- **TypeScript** - Full type safety with strict mode enabled
- **Production-Ready** - Error handling, validation, logging, and graceful shutdown

## 📋 Prerequisites

- **Node.js** 16+ (LTS recommended)
- **npm** 7+ or **yarn**
- **PostgreSQL** 12+ (for production) or **SQLite** (for local development)

## 🛠️ Installation

### 1. Clone and Install Dependencies

\`\`\`bash
cd pdd-teju-backend
npm install
\`\`\`

### 2. Configure Environment Variables

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your configuration:

\`\`\`env
# Server
PORT=5000
NODE_ENV=development

# Database (SQLite for local dev)
DATABASE_URL="file:./prisma/dev.db"

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# External APIs (Optional)
YOUTUBE_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8081
\`\`\`

### 3. Initialize Prisma & Database

\`\`\`bash
# Generate Prisma client
npm run prisma:generate

# Create database and tables
npm run prisma:push

# (Optional) Create migration files
npm run prisma:migrate
\`\`\`

### 4. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires JWT)

### Survey

- `POST /api/survey/submit` - Submit survey answers
- `POST /api/survey/skip` - Skip current survey
- `GET /api/survey/status` - Get survey status and whether prompt should show

### Recommendations

- `GET /api/recommendations` - Get personalized recommendations

### Health

- `GET /api/health` - Health check
- `GET /api/version` - API version

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:

\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

### Example Request

\`\`\`bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
\`\`\`

## 📡 API Examples

### 1. Register User

\`\`\`bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "name": "John Doe"
  }'
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "name": "John Doe",
      "email": "user@example.com",
      "registeredAt": 1704067200000
    }
  }
}
\`\`\`

### 2. Submit Survey

\`\`\`bash
curl -X POST http://localhost:5000/api/survey/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "focusDomain": "Frontend",
    "proficiency": "Intermediate",
    "learningHours": 10
  }'
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "surveyId": "clp...",
    "nextResuveyAt": "2024-01-15T10:00:00Z",
    "recommendations": {
      "courses": [...],
      "resources": [...],
      "milestones": [...],
      "weeklyHoursTarget": 20,
      "nextAssessment": "2024-01-15T10:00:00Z"
    }
  }
}
\`\`\`

### 3. Get Recommendations

\`\`\`bash
curl -X GET http://localhost:5000/api/recommendations \
  -H "Authorization: Bearer <token>"
\`\`\`

## 🗄️ Database Schema

### Users Table
- id (CUID)
- name, email (unique), password (hashed)
- registeredAt, createdAt, updatedAt

### Surveys Table
- id, userId (FK)
- focusDomain, proficiency, learningHours
- nextSurveyAt, skippedAt
- createdAt

### Recommendations Table
- id, userId (FK)
- focusDomain, proficiency
- courses, resources, milestones (JSON)
- weeklyHoursTarget, nextAssessment
- createdAt, updatedAt

### CachedResources Table
- id, userId (optional, FK)
- focusDomain, proficiency, resourceType
- sourceAPI, title, description, url, duration, difficulty
- expiresAt, createdAt

### ApiCallLogs Table
- id, apiProvider, endpoint
- focusDomain, proficiency
- status, errorMessage
- createdAt

## 🔄 Focus Domains & Proficiency Tiers

### Focus Domains
- **Frontend** - React, Vue, Angular, Next.js, TypeScript
- **Backend** - Node.js, Express, Databases, APIs, DevOps
- **Mobile** - React Native, Flutter, Mobile Architecture
- **AI** - Machine Learning, Deep Learning, LLMs, NLP

### Proficiency Tiers
- **Beginner** - Starting their journey
- **Intermediate** - Can build projects independently
- **Advanced** - Expert-level knowledge

## 🌐 External API Integration

### APIs Used (Free Tier)
1. **YouTube Data API v3** - Video tutorials
2. **GitHub Search API** - Roadmaps and repositories
3. **Dev.to API** - Development articles (no auth needed)
4. **Wikipedia MediaWiki API** - Glossaries and definitions

### Caching Strategy
- Database caches API responses for 1 hour (configurable)
- Automatic fallback to cached data if API fails
- Duplicate removal and result deduplication
- Rate limit handling

## 🛠️ Development Commands

\`\`\`bash
# Development server (with auto-reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Prisma commands
npm run prisma:generate      # Generate Prisma client
npm run prisma:migrate       # Create migration files
npm run prisma:push          # Push schema to database
npm run prisma:studio        # Open Prisma Studio GUI

# Linting and formatting
npm run lint                 # Run ESLint
npm run format               # Run Prettier
\`\`\`

## 📦 Production Deployment

### Build & Start

\`\`\`bash
npm run build
npm start
\`\`\`

### Environment Variables for Production

\`\`\`env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/edusync
JWT_SECRET=use-a-strong-randomly-generated-secret
YOUTUBE_API_KEY=your_production_key
GITHUB_TOKEN=your_production_token
CORS_ORIGIN=https://edusync.example.com
\`\`\`

### Deployment Options

- **Render** - Recommended for quick deployment
- **Railway** - Database + backend in one place
- **Vercel** - Serverless functions (requires restructuring)
- **AWS EC2** - Full control and scalability
- **Digital Ocean** - App Platform for managed deployment
- **Heroku** - Simple deployment (paid tier)

### Docker Deployment (Optional)

Create a `Dockerfile`:

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
\`\`\`

Build and run:

\`\`\`bash
docker build -t edusync-backend .
docker run -p 5000:5000 --env-file .env edusync-backend
\`\`\`

## 🐛 Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env
- For SQLite, ensure `prisma/` directory exists

### CORS Issues
- Update CORS_ORIGIN in .env to match your frontend URL
- Development: `http://localhost:3000,http://localhost:8081`

### JWT Token Expiration
- Default expiration: 7 days
- Change JWT_EXPIRE in .env (e.g., "24h", "30d")
- Adjust frontend refresh token logic accordingly

### API Rate Limiting
- YouTube: 10,000 quota units/day
- GitHub: 60 requests/hour (unauthenticated)
- Dev.to: 20 requests/minute
- Wikipedia: 5 requests/second

## 📊 Performance Tips

1. **Database Indexing** - Indexes on userId, focusDomain, proficiency
2. **Response Caching** - Client-side cache recommendations for 1 hour
3. **API Rate Limiting** - Implement rate limiting middleware for production
4. **Database Connection Pooling** - Prisma handles this automatically
5. **Lazy Load Resources** - Load recommendations on-demand

## 📝 Frontend Integration

The API responses match the frontend state models exactly:

- `UserProfile` - Registration and profile data
- `SurveyAnswers` - Survey form inputs
- `RecommendedCourse` - Course recommendations
- `RecommendedResource` - External resources
- `CareerMilestone` - Learning milestones
- `RecommendationOutput` - Complete recommendation set

## 📄 License

MIT

## 🤝 Support

For issues or questions:
1. Check existing GitHub issues
2. Review API documentation above
3. Check environment configuration
4. Review logs in development mode

---

**Built with ❤️ for the EduSync adaptive learning platform**
