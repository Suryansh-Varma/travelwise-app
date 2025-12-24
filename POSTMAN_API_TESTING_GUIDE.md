# TravelWise API - Postman Testing Guide

## Base URL
```
http://localhost:5000
```

---

## 1. Health Check

**GET** `/`

**Description:** Check if the API server is running

**Request:**
```
GET http://localhost:5000/
```

**Expected Response:**
```
TravelWise API is running...
```

---

## 2. Authentication Endpoints

### 2.1 Sign Up

**POST** `/api/auth/sign-up/email`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Expected Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "message": "User created. Please verify your email."
}
```

---

### 2.2 Sign In

**POST** `/api/auth/sign-in/email`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "remember": true
}
```

**Expected Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "sessionToken": "your-session-token-here"
}
```

**Note:** Save the `sessionToken` for authenticated requests!

---

### 2.3 Get Current User

**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_SESSION_TOKEN
Content-Type: application/json
```

**Expected Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### 2.4 Verify Email

**GET** `/api/auth/verify-email?token=VERIFICATION_TOKEN`

**Query Parameters:**
- `token` (required) - Email verification token

**Expected Response:**
```json
{
  "message": "Email verified successfully"
}
```

---

## 3. Trip Endpoints

### 3.1 Generate Itinerary (Full - Uses Gemini API)

**POST** `/api/trips/generate`

**Headers:**
```
Content-Type: application/json
x-mock: false  (or omit this header)
```

**Body (JSON):**
```json
{
  "from": "Mumbai",
  "to": "Delhi",
  "startDate": "2024-12-20T10:00:00Z",
  "deadline": "2024-12-25T18:00:00Z",
  "budget": 50000,
  "userID": "user-id-here",
  "avoidNightTravel": false,
  "includeLayovers": true,
  "travelSelection": {
    "outboundId": "a_quarter",
    "returnId": "a_third",
    "outboundCost": 12500,
    "returnCost": 16667
  },
  "budgetRemaining": 20833,
  "sideLocations": [
    {
      "name": "Agra",
      "days": 2,
      "budget": 5000
    }
  ]
}
```

**Required Fields:**
- `from` (string) - Origin city
- `to` (string) - Destination city
- `startDate` (ISO 8601 date string) - Trip start date
- `deadline` (ISO 8601 date string) - Trip end date
- `budget` (number) - Total budget in rupees
- `userID` (string) - User ID

**Optional Fields:**
- `avoidNightTravel` (boolean) - Default: false
- `includeLayovers` (boolean) - Default: false
- `travelSelection` (object) - Selected travel options
- `budgetRemaining` (number) - Remaining budget after travel selection
- `sideLocations` (array) - Additional destinations

**Expected Response:**
```json
[
  {
    "_id": "trip-id-1",
    "from": "Mumbai",
    "to": "Delhi",
    "startDate": "2024-12-20T10:00:00.000Z",
    "deadline": "2024-12-25T18:00:00.000Z",
    "budget": 50000,
    "totalCost": 45000,
    "plan": [
      {
        "mode": "flight",
        "source": "Mumbai",
        "destination": "Delhi",
        "serviceNumber": "AI-101",
        "departureTime": "2024-12-20T10:00:00Z",
        "arrivalTime": "2024-12-20T12:00:00Z",
        "cost": 15000,
        "durationHrs": 2,
        "bufferMins": 90,
        "bufferNote": "Airport check-in"
      }
    ],
    "warnings": [],
    "userID": "user-id-here",
    "createdAt": "2024-12-15T10:00:00.000Z"
  }
]
```

---

### 3.2 Generate Itinerary (Mock - No Gemini API)

**POST** `/api/trips/generate`

**Headers:**
```
Content-Type: application/json
x-mock: true
```

**Body (JSON):**
```json
{
  "from": "Mumbai",
  "to": "Delhi",
  "startDate": "2024-12-20T10:00:00Z",
  "deadline": "2024-12-25T18:00:00Z",
  "budget": 50000,
  "userID": "user-id-here"
}
```

**Note:** This bypasses the Gemini API and returns a simple mock itinerary. Useful for testing without API keys.

---

### 3.3 Get User Trips

**GET** `/api/trips?userID=user-id-here`

**Headers:**
```
Authorization: Bearer YOUR_SESSION_TOKEN
Content-Type: application/json
```

**Query Parameters:**
- `userID` (required) - User ID to fetch trips for

**Expected Response:**
```json
[
  {
    "_id": "trip-id-1",
    "from": "Mumbai",
    "to": "Delhi",
    "startDate": "2024-12-20T10:00:00.000Z",
    "deadline": "2024-12-25T18:00:00.000Z",
    "budget": 50000,
    "totalCost": 45000,
    "plan": [...],
    "warnings": [],
    "userID": "user-id-here",
    "createdAt": "2024-12-15T10:00:00.000Z"
  }
]
```

---

### 3.4 Create Trip Manually

**POST** `/api/trips`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "userID": "user-id-here",
  "from": "Mumbai",
  "to": "Delhi",
  "startDate": "2024-12-20T10:00:00Z",
  "deadline": "2024-12-25T18:00:00Z",
  "budget": 50000,
  "totalCost": 45000,
  "plan": [
    {
      "mode": "flight",
      "source": "Mumbai",
      "destination": "Delhi",
      "serviceNumber": "AI-101",
      "departureTime": "2024-12-20T10:00:00Z",
      "arrivalTime": "2024-12-20T12:00:00Z",
      "cost": 15000,
      "durationHrs": 2,
      "layover": null,
      "bufferMins": 90,
      "bufferNote": "Airport check-in",
      "availability": "Available"
    }
  ],
  "warnings": []
}
```

**Expected Response:**
```json
{
  "_id": "trip-id",
  "userID": "user-id-here",
  "from": "Mumbai",
  "to": "Delhi",
  ...
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required trip parameters: from, to, startDate, deadline, budget, userID."
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "Failed to generate itineraries",
  "message": "Gemini API returned 403 Forbidden. This usually means: 1) Your API key is invalid or expired, 2) API key doesn't have access to Gemini API..."
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to generate itineraries",
  "message": "Error details here"
}
```

---

## Testing Tips

1. **Start with Mock Mode:** Use `x-mock: true` header to test without Gemini API
2. **Get User ID:** Sign up or sign in first to get a `userID`
3. **Save Session Token:** After signing in, save the `sessionToken` for authenticated requests
4. **Date Format:** Use ISO 8601 format: `"2024-12-20T10:00:00Z"`
5. **Check Server Logs:** The server console will show detailed error messages

---

## Import Collection to Postman

1. Open Postman
2. Click "Import" button
3. Select the `TravelWise_API_Postman_Collection.json` file
4. The collection will be imported with all endpoints ready to test!

---

## Environment Variables (Optional)

Create a Postman environment with:
- `baseUrl`: `http://localhost:5000`
- `sessionToken`: (will be set after sign-in)
- `userID`: (will be set after sign-in)


