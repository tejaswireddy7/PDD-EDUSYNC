# EduSync API Documentation

## Base URL

```
Development:  http://localhost:5000/api
Production:   https://your-deployment.com/api
```

## Authentication

All endpoints except `/auth/register` and `/auth/login` require JWT authentication.

### Header Format

```
Authorization: Bearer <jwt_token>
```

### Token Payload

```json
{
  "userId": "string",
  "email": "string",
  "iat": number,
  "exp": number
}
```

### Token Expiration

- Default: 7 days
- On expiration: User must re-login
- Scope: Can be configured via JWT_EXPIRE env var

---

## Endpoints

### 1. Authentication Endpoints

#### Register User
- **Endpoint:** `POST /auth/register`
- **Auth Required:** No
- **Rate Limit:** 5 requests per hour per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

**Validation:**
- Email: Valid email format, unique in database
- Password: Minimum 6 characters
- Name: Non-empty string

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "name": "John Doe",
      "email": "user@example.com",
      "registeredAt": 1704067200000
    }
  }
}
```

**Error Responses:**
- `400` - Missing fields or invalid format
- `409` - User already exists

---

#### Login User
- **Endpoint:** `POST /auth/login`
- **Auth Required:** No
- **Rate Limit:** 10 requests per hour per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "name": "John Doe",
      "email": "user@example.com",
      "registeredAt": 1704067200000
    }
  }
}
```

**Error Responses:**
- `401` - Invalid email or password
- `404` - User not found

---

#### Get User Profile
- **Endpoint:** `GET /auth/profile`
- **Auth Required:** Yes
- **Method:** GET

**Response (200):**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "user@example.com",
    "registeredAt": 1704067200000
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `404` - User not found

---

### 2. Survey Endpoints

#### Submit Survey
- **Endpoint:** `POST /survey/submit`
- **Auth Required:** Yes

**Request Body:**
```json
{
  "focusDomain": "Frontend",
  "proficiency": "Intermediate",
  "learningHours": 10
}
```

**Valid Values:**

Focus Domains:
- `Frontend` - React, Vue, Angular, Next.js, TypeScript
- `Backend` - Node.js, Express, Databases, DevOps
- `Mobile` - React Native, Flutter, Cross-platform
- `AI` - Machine Learning, Deep Learning, LLMs

Proficiency Levels:
- `Beginner` - Starting their learning journey
- `Intermediate` - Can build projects independently
- `Advanced` - Expert-level knowledge

Learning Hours:
- Range: 1-40 (hours per week)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "surveyId": "clp4x7z9k0001a7e2q5n5n5n5",
    "nextResuveyAt": "2024-01-15T10:00:00Z",
    "nextSkipAt": "2024-01-15T10:00:00Z",
    "recommendations": {
      "courses": [
        {
          "title": "React.js Fundamentals",
          "subject": "Frontend Framework",
          "progress": 0,
          "time": "5 weeks",
          "difficulty": "Intermediate",
          "ai": false,
          "colors": ["#61DAFB", "#282C34"]
        }
      ],
      "resources": [
        {
          "title": "React Documentation",
          "type": "devto",
          "duration": "Variable"
        }
      ],
      "milestones": [
        {
          "title": "React component library",
          "description": "Build reusable React components",
          "status": "active"
        }
      ],
      "weeklyHoursTarget": 20,
      "nextAssessment": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid field values
- `401` - Missing or invalid token

---

#### Skip Survey
- **Endpoint:** `POST /survey/skip`
- **Auth Required:** Yes
- **Description:** Delay survey by 7 more days

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Survey skipped",
    "nextSurveyAt": "2024-01-22T10:00:00Z"
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `404` - No survey found

---

#### Get Survey Status
- **Endpoint:** `GET /survey/status`
- **Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shouldShowPrompt": true,
    "latestSurvey": {
      "id": "clp4x7z9k0001a7e2q5n5n5n5",
      "focusDomain": "Frontend",
      "proficiency": "Intermediate",
      "learningHours": 10,
      "nextSurveyAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Response (200 - No Survey):**
```json
{
  "success": true,
  "data": {
    "shouldShowPrompt": true,
    "latestSurvey": null
  }
}
```

---

### 3. Recommendations Endpoints

#### Get Recommendations
- **Endpoint:** `GET /recommendations`
- **Auth Required:** Yes
- **Cache:** Results cached for 1 hour

**Response (200):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "title": "React.js Fundamentals",
        "subject": "Frontend Framework",
        "progress": 0,
        "time": "5 weeks",
        "difficulty": "Intermediate",
        "ai": false,
        "colors": ["#61DAFB", "#282C34"]
      },
      {
        "title": "TypeScript for React",
        "subject": "Type Safety",
        "progress": 0,
        "time": "4 weeks",
        "difficulty": "Intermediate",
        "ai": false,
        "colors": ["#3178C6", "#E34C26"]
      }
    ],
    "resources": [
      {
        "title": "React Tutorial: Build a Todo App",
        "type": "youtube",
        "duration": "2 hours"
      },
      {
        "title": "React Hooks Explained",
        "type": "devto",
        "duration": "Variable"
      },
      {
        "title": "freeCodeCamp React Course",
        "type": "github",
        "duration": "12 hours"
      }
    ],
    "milestones": [
      {
        "title": "React component library",
        "description": "Build reusable React components",
        "status": "active"
      },
      {
        "title": "State management mastery",
        "description": "Master Redux or Context API",
        "status": "locked"
      }
    ],
    "weeklyHoursTarget": 20,
    "nextAssessment": "2024-01-15T10:00:00Z"
  }
}
```

**Response (200 - No Survey Yet):**
```json
{
  "success": true,
  "data": {
    "message": "No recommendations available. Please complete the survey first.",
    "recommendations": null
  }
}
```

---

### 4. Health Endpoints

#### Health Check
- **Endpoint:** `GET /health/health`
- **Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "message": "EduSync Backend is running",
  "timestamp": "2024-01-08T10:00:00Z"
}
```

---

#### API Version
- **Endpoint:** `GET /health/version`
- **Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "version": "1.0.0",
  "api": "EduSync Adaptive Learning Platform API"
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| INVALID_CREDENTIALS | 401 | Email or password is incorrect |
| INVALID_TOKEN | 401 | JWT token is invalid or expired |
| MISSING_TOKEN | 401 | Authorization header missing |
| USER_NOT_FOUND | 404 | User does not exist |
| USER_EXISTS | 409 | Email already registered |
| INVALID_INPUT | 400 | Request validation failed |
| SURVEY_NOT_FOUND | 404 | Survey record not found |
| DATABASE_ERROR | 500 | Database operation failed |
| API_ERROR | 502 | External API call failed |
| NOT_FOUND | 404 | Endpoint does not exist |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Rate Limiting

### Current Limits (Per IP Address)

- Register: 5 requests/hour
- Login: 10 requests/hour
- Other endpoints: 100 requests/hour

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704093600
```

---

## Request/Response Examples

### cURL Examples

#### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "name": "John Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

#### Get Profile (with token)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```

#### Submit Survey
```bash
curl -X POST http://localhost:5000/api/survey/submit \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
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
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```

### JavaScript/Fetch Examples

#### Register
```javascript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123',
    name: 'John Doe'
  })
});

const data = await response.json();
const token = data.data.token;
```

#### Get Recommendations
```javascript
const response = await fetch('http://localhost:5000/api/recommendations', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data.courses);
```

---

## API Response Codes

| Status Code | Meaning |
|------------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Auth required/failed |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Server Error - Internal error |
| 502 | Bad Gateway - External API error |

---

## Data Types

### UserProfile
```typescript
{
  name: string;           // User's full name
  email: string;          // User's email address
  registeredAt: number;   // Unix timestamp of registration
}
```

### SurveyAnswers
```typescript
{
  focusDomain: "Frontend" | "Backend" | "Mobile" | "AI";
  proficiency: "Beginner" | "Intermediate" | "Advanced";
  learningHours: number;  // 1-40 hours per week
}
```

### RecommendedCourse
```typescript
{
  title: string;                                    // Course title
  subject: string;                                  // Subject area
  progress: number;                                 // 0-100
  time: string;                                     // Duration e.g., "5 weeks"
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  ai: boolean;                                      // AI-generated content
  colors: string[];                                 // Color palette for UI
}
```

### RecommendedResource
```typescript
{
  title: string;          // Resource title
  type: string;           // "youtube" | "github" | "devto" | "coursera"
  duration: string;       // Duration e.g., "2 hours", "Variable"
}
```

### CareerMilestone
```typescript
{
  title: string;          // Milestone title
  description: string;    // Description
  status: "completed" | "active" | "locked";
}
```

---

## CORS Configuration

Default allowed origins:
- `http://localhost:3000` (React web)
- `http://localhost:8081` (React Native)

To allow additional origins, update CORS_ORIGIN in .env:
```env
CORS_ORIGIN=https://app.example.com,https://mobile.example.com
```

---

## Contact & Support

For API issues or questions:
1. Check this documentation
2. Review error codes and responses
3. Check server logs: `npm run dev` with NODE_ENV=development
4. Verify .env configuration

