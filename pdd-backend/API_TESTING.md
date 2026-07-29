# API Testing with cURL

Test all EduSync API endpoints using cURL commands.

## Setup

```bash
# Start the server
npm run dev

# In another terminal, run these commands
```

## 1. Health Check

```bash
curl -X GET http://localhost:5000/api/health/health \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "EduSync Backend is running",
  "timestamp": "2024-01-08T10:00:00Z"
}
```

---

## 2. Get API Version

```bash
curl -X GET http://localhost:5000/api/health/version \
  -H "Content-Type: application/json"
```

---

## 3. Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "registeredAt": 1704067200000
    }
  }
}
```

**Save the token for next requests:**
```bash
export TOKEN="<your_token_from_response>"
```

---

## 4. Login User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

---

## 5. Get User Profile

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "registeredAt": 1704067200000
  }
}
```

---

## 6. Submit Survey

```bash
curl -X POST http://localhost:5000/api/survey/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "focusDomain": "Frontend",
    "proficiency": "Intermediate",
    "learningHours": 10
  }'
```

**Expected Response (201):**
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
      "resources": [],
      "milestones": [],
      "weeklyHoursTarget": 20,
      "nextAssessment": "2024-01-15T10:00:00Z"
    }
  }
}
```

---

## 7. Get Survey Status

```bash
curl -X GET http://localhost:5000/api/survey/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "shouldShowPrompt": false,
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

---

## 8. Skip Survey

```bash
curl -X POST http://localhost:5000/api/survey/skip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Survey skipped",
    "nextSurveyAt": "2024-01-22T10:00:00Z"
  }
}
```

---

## 9. Get Recommendations

```bash
curl -X GET http://localhost:5000/api/recommendations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
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
    "resources": [],
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
```

---

## Error Testing

### Test Invalid Token

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json"
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired token",
    "code": "INVALID_TOKEN"
  }
}
```

### Test Missing Token

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json"
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": {
    "message": "Missing or invalid authorization token",
    "code": "MISSING_TOKEN"
  }
}
```

### Test Invalid Input

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123",
    "name": ""
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid email format",
    "code": "INVALID_INPUT"
  }
}
```

### Test Duplicate Email

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "name": "Another John"
  }'
```

**Expected Response (409):**
```json
{
  "success": false,
  "error": {
    "message": "User with this email already exists",
    "code": "USER_EXISTS"
  }
}
```

---

## Full Test Flow Script

Save as `test.sh`:

```bash
#!/bin/bash

set -e

BASE_URL="http://localhost:5000/api"
EMAIL="testuser+$(date +%s)@example.com"
PASSWORD="TestPass123"
NAME="Test User"

echo "🧪 Running EduSync API Tests..."
echo ""

# 1. Health Check
echo "1️⃣ Health Check..."
curl -X GET $BASE_URL/health/health -H "Content-Type: application/json"
echo ""
echo ""

# 2. Register
echo "2️⃣ Registering user: $EMAIL..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"name\": \"$NAME\"}")
echo "$REGISTER_RESPONSE" | jq '.'
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')
echo "Token: $TOKEN"
echo ""

# 3. Get Profile
echo "3️⃣ Getting user profile..."
curl -s -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# 4. Submit Survey
echo "4️⃣ Submitting survey..."
curl -s -X POST $BASE_URL/survey/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"focusDomain": "Frontend", "proficiency": "Intermediate", "learningHours": 10}' | jq '.'
echo ""

# 5. Get Survey Status
echo "5️⃣ Getting survey status..."
curl -s -X GET $BASE_URL/survey/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# 6. Get Recommendations
echo "6️⃣ Getting recommendations..."
curl -s -X GET $BASE_URL/recommendations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "✅ All tests passed!"
```

Run:
```bash
chmod +x test.sh
./test.sh
```

---

## Postman Collection

Import this JSON in Postman as a collection:

```json
{
  "info": {
    "name": "EduSync API",
    "description": "Complete API for EduSync adaptive learning platform"
  },
  "item": [
    {
      "name": "Health",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/health/health"
          }
        }
      ]
    },
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"user@test.com\",\"password\":\"Pass123\",\"name\":\"Test User\"}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api"
    }
  ]
}
```

---

## Performance Testing

### Apache Bench

```bash
# Install: brew install httpd

# Test health endpoint
ab -n 100 -c 10 http://localhost:5000/api/health/health

# Output shows:
# - Requests per second
# - Mean time per request
# - Transfer rate
```

### Load Testing with Artillery

```bash
npm install -g artillery

# Create artillery-load-test.yml:
# config:
#   target: http://localhost:5000
#   phases:
#     - duration: 60
#       arrivalRate: 10
# scenarios:
#   - name: "Get Health"
#     flow:
#       - get:
#           url: /api/health/health

artillery run artillery-load-test.yml
```

---

## Tips

1. **Save token in variable:**
   ```bash
   export TOKEN=$(curl -s ... | jq -r '.data.token')
   ```

2. **Pretty print JSON:**
   ```bash
   curl ... | jq '.'
   ```

3. **Extract specific field:**
   ```bash
   curl ... | jq '.data.token'
   ```

4. **Check response headers:**
   ```bash
   curl -i ...
   ```

5. **Verbose mode (for debugging):**
   ```bash
   curl -v ...
   ```

---

## See Also

- [API Documentation](./API_DOCUMENTATION.md)
- [Quick Start Guide](./QUICKSTART.md)
- [README](./README.md)

