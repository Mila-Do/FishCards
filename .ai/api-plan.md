# REST API Plan

## 1. Resources

The API is organized around the following main resources, each corresponding to a database table:

- **Flashcards** (`flashcards` table) - Core resource representing user-created flashcard items
- **Generations** (`generations` table) - Represents AI generation sessions that produce flashcard proposals requiring user approval
- **Generation Error Logs** (`generation_error_logs` table) - Logs errors that occur during AI generation
- **Users** (`auth.users` table) - Managed by Supabase Auth, accessed indirectly through authentication

## 2. Endpoints

### 2.1. Authentication Endpoints

Note: Authentication is handled by Supabase Auth. These endpoints are provided by Supabase and accessed through the Supabase client SDK. The API endpoints below assume the user is authenticated and include the Supabase JWT token in the Authorization header.

### 2.2. Flashcards Endpoints

#### GET /api/flashcards
Retrieve a paginated list of flashcards for the authenticated user.

**Query Parameters:**
- `page` (optional, integer, default: 1) - Page number for pagination
- `limit` (optional, integer, default: 20, max: 100) - Number of items per page
- `status` (optional, string) - Filter by status: `new`, `learning`, `review`, `mastered`
- `source` (optional, string) - Filter by source: `manual`, `ai`, `mixed`
- `sort` (optional, string, default: `created_at`) - Sort field: `created_at`, `updated_at`, `repetition_count`
- `order` (optional, string, default: `desc`) - Sort order: `asc`, `desc`

**Request Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

**Response Body (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "user_id": "uuid",
      "generation_id": 123,
      "front": "What is React?",
      "back": "A JavaScript library for building user interfaces",
      "source": "ai",
      "status": "new",
      "repetition_count": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Database or server error

#### GET /api/flashcards/:id
Retrieve a single flashcard by ID.

**Request Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

**Response Body (200 OK):**
```json
{
  "id": 1,
  "user_id": "uuid",
  "generation_id": 123,
  "front": "What is React?",
  "back": "A JavaScript library for building user interfaces",
  "source": "ai",
  "status": "new",
  "repetition_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Flashcard not found or user doesn't have access
- `500 Internal Server Error` - Database or server error

#### POST /api/flashcards
Create one or more new flashcards. This endpoint is used for:
- Creating manual flashcards
- Saving AI-generated flashcard proposals after user approval (from `POST /api/generations`)

**Request Headers:**
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

**Request Body (single or multiple flashcards):**
_Single flashcard:_
```json
{
  "front": "What is TypeScript?",
  "back": "A typed superset of JavaScript that compiles to plain JavaScript",
  "source": "manual"
}
```

_Array of flashcards:_
```json
[
  {
    "front": "What is TypeScript?",
    "back": "A typed superset of JavaScript that compiles to plain JavaScript",
    "source": "manual"
  },
  {
    "front": "What is React?",
    "back": "A JavaScript library for building user interfaces",
    "source": "ai"
  }
]
```

**Validation Rules:**
- Request body may be a single object or an array of objects.
- For each object:
    - `front` (required, string, max 200 characters)
    - `back` (required, string, max 500 characters)
    - `source` (optional, string, default: `manual`, must be one of: `manual`, `ai`, `mixed`)

**Response Body (201 Created):**
- If single flashcard was created:  
```json
{
  "id": 2,
  "user_id": "uuid",
  "generation_id": null,
  "front": "What is TypeScript?",
  "back": "A typed superset of JavaScript that compiles to plain JavaScript",
  "source": "manual",
  "status": "new",
  "repetition_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```
- If multiple flashcards were created:  
```json
[
  {
    "id": 2,
    "user_id": "uuid",
    "generation_id": null,
    "front": "What is TypeScript?",
    "back": "A typed superset of JavaScript that compiles to plain JavaScript",
    "source": "manual",
    "status": "new",
    "repetition_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": 3,
    "user_id": "uuid",
    "generation_id": 132,
    "front": "What is React?",
    "back": "A JavaScript library for building user interfaces",
    "source": "ai",
    "status": "new",
    "repetition_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**Error Responses:**
- `400 Bad Request` - Validation error (missing required fields, invalid values, or length constraints)
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Database or server error

#### PATCH /api/flashcards/:id
Update an existing flashcard.

**Request Headers:**
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "front": "Updated question?",
  "back": "Updated answer",
  "status": "learning",
  "source": "mixed"
}
```

**Validation Rules:**
- All fields are optional
- `front` (string, max 200 characters if provided)
- `back` (string, max 500 characters if provided)
- `status` (string, must be one of: `new`, `learning`, `review`, `mastered` if provided)
- `source` (string, must be one of: `manual`, `ai`, `mixed` if provided)
- `repetition_count` (integer, must be >= 0 if provided)

**Response Body (200 OK):**
```json
{
  "id": 1,
  "user_id": "uuid",
  "generation_id": 123,
  "front": "Updated question?",
  "back": "Updated answer",
  "source": "mixed",
  "status": "learning",
  "repetition_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T01:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error (invalid values, length constraints)
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Flashcard not found or user doesn't have access
- `500 Internal Server Error` - Database or server error

#### DELETE /api/flashcards/:id
Delete a flashcard.

**Request Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

**Response Body (200 OK):**
```json
{
  "message": "Flashcard deleted successfully",
  "id": 1
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Flashcard not found or user doesn't have access
- `500 Internal Server Error` - Database or server error


### 2.3. AI Generation Endpoints

#### POST /api/generations
Generate flashcard proposals from text using AI (OpenRouter.ai). The generated flashcards are proposals that require user approval before being saved to the database.

**Request Headers:**
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "source_text": "Long text content here..."
}
```

**Validation Rules:**
- `source_text` (required, string, min 1000 characters, max 10000 characters)

**Response Body (200 OK):**
```json
{
  "generation_id": 123,
  "flashcards_proposals": [
    {
      "front": "Generated question 1?",
      "back": "Generated answer 1",
      "source": "ai"
    },
    {
      "front": "Generated question 2?",
      "back": "Generated answer 2",
      "source": "ai"
    }
  ],
  "metadata": {
    "generated_count": 2,
    "source_text_length": 5000,
    "generation_duration_ms": 2500
  }
}
```

**Note:** The returned flashcards are **proposals** that have not been saved to the database. The user must review, accept (optionally edit), or reject each proposal. To save accepted proposals, use `POST /api/flashcards` with the selected flashcards.

**Error Responses:**
- `400 Bad Request` - Validation error (text length constraints)
- `401 Unauthorized` - Missing or invalid authentication token
- `429 Too Many Requests` - Rate limit exceeded for AI API
- `500 Internal Server Error` - AI API error, database error, or server error, logs recorded in 'generation_error_logs'
- `502 Bad Gateway` - AI API unavailable

**Business Logic:**
1. Validate source text length (1000-10000 characters)
2. Calculate hash of source text for deduplication
3. Call OpenRouter.ai API with the source text
4. Parse AI response to extract flashcard pairs (front/back)
5. Create generation record in database with `generated_count` set to the number of proposals
6. Return flashcard **proposals** (not yet saved to flashcards table) - these are suggestions that require user approval
7. User can then accept (as-is or edited), edit, or reject each proposal
8. To save accepted proposals, user must call `POST /api/flashcards` with the selected flashcards
9. If AI API fails, log error to generation_error_logs table and do not create generation record

#### GET /api/generations
Retrieve generation history for the authenticated user.

**Query Parameters:**
- `page` (optional, integer, default: 1) - Page number for pagination
- `limit` (optional, integer, default: 20, max: 100) - Number of items per page
- `sort` (optional, string, default: `created_at`) - Sort field: `created_at`, `updated_at`
- `order` (optional, string, default: `desc`) - Sort order: `asc`, `desc`

**Request Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

**Response Body (200 OK):**
```json
{
  "data": [
    {
      "id": 123,
      "user_id": "uuid",
      "model": "openai/gpt-4o-mini",
      "generated_count": 10,
      "accepted_unedited_count": 7,
      "accepted_edited_count": 2,
      "source_text_hash": "abc123...",
      "source_text_length": 5000,
      "generation_duration_ms": 2500,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Database or server error

#### GET /api/generations/:id
Retrieve a single generation session by ID.

**Request Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

**Response Body (200 OK):**
```json
{
  "id": 123,
  "user_id": "uuid",
  "model": "openai/gpt-4o-mini",
  "generated_count": 10,
  "accepted_unedited_count": 7,
  "accepted_edited_count": 2,
  "source_text_hash": "abc123...",
  "source_text_length": 5000,
  "generation_duration_ms": 2500,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Generation not found or user doesn't have access
- `500 Internal Server Error` - Database or server error


#### GET /api/generation-error-logs

Retrieve a paginated list of generation error logs for the authenticated user.

**Query Parameters:**
- `page` (optional, integer, default: 1) - Page number for pagination
- `limit` (optional, integer, default: 20, max: 100) - Number of items per page

**Request Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

**Response Body (200 OK):**
```json
{
  "data": [
    {
      "id": 333,
      "user_id": "uuid",
      "error_code": "GENERATION_TIMEOUT",
      "error_message": "AI model took too long to respond.",
      "raw_error": "{\"timeout\":true}",
      "created_at": "2024-01-01T00:01:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "total_pages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Database or server error


## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

The API uses **Supabase Auth** for authentication. All protected endpoints require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

### 3.2. Token Validation

1. Extract JWT token from Authorization header
2. Verify token signature and expiration using Supabase
3. Extract user ID from token payload
4. Use user ID for all database operations

### 3.3. Authorization

Authorization is enforced at two levels:

1. **API Level**: Verify user is authenticated before processing requests
2. **Database Level**: Row Level Security (RLS) policies ensure users can only access their own data:
   - `flashcards`: Users can only access flashcards where `user_id` matches their authenticated user ID
   - `generations`: Users can only access generations where `user_id` matches their authenticated user ID
   - `generation_error_logs`: Users can only access error logs where `user_id` matches their authenticated user ID

### 3.4. Implementation Details

- Authentication is handled by Supabase Auth SDK on the frontend
- API endpoints validate tokens using Supabase server-side client
- RLS policies are configured in the database to provide defense in depth
- All endpoints return `401 Unauthorized` if authentication fails

## 4. Validation and Business Logic

### 4.1. Flashcard Validation

**Create/Update Validation:**
- `front`: Required, string, max 200 characters (VARCHAR(200))
- `back`: Required, string, max 500 characters (VARCHAR(500))
- `source`: Optional, must be one of: `manual`, `ai`, `mixed` (CHECK constraint)
- `status`: Optional, must be one of: `new`, `learning`, `review`, `mastered` (CHECK constraint)
- `repetition_count`: Optional, must be >= 0 (CHECK constraint)
- `generation_id`: Optional, must reference existing generation or be null

**Business Logic:**
- `user_id` is automatically set from authenticated user (never accepted in request)
- `created_at` and `updated_at` are automatically managed by database
- When creating flashcards that were previously AI-generated proposals (with `generation_id`), update generation statistics:
  - Increment `accepted_unedited_count` for flashcards with `source: 'ai'` (accepted without editing)
  - Increment `accepted_edited_count` for flashcards with `source: 'mixed'` (AI proposals that were edited before acceptance)
  - Update `generations.updated_at`
- Note: This endpoint saves flashcards to the database. For AI-generated proposals, use `POST /api/generations` first to get proposals, then use this endpoint to save accepted ones.

### 4.2. Generation Validation

**Create Validation:**
- `source_text`: Required, string, min 1000 characters, max 10000 characters

**Model selection:**
- The AI model is selected automatically by the backend (not provided by the client).

**Business Logic:**
- Calculate `source_text_hash` (SHA-256) for deduplication and tracking
- Record `source_text_length` for statistics
- Measure `generation_duration_ms` in milliseconds
- Parse AI response to extract flashcard pairs (front/back)
- **Important:** AI generates **proposals** only - they are not automatically saved to the database
- If AI generation fails:
  - Log error to `generation_error_logs` table
  - Return appropriate error response
  - Do not create generation record
- If AI generation succeeds:
  - Create generation record with `generated_count` = number of flashcard proposals returned
  - Return flashcard **proposals** for user review (not yet saved to flashcards table)
  - User must explicitly accept, edit, or reject each proposal
  - To save accepted proposals, user calls `POST /api/flashcards` with selected flashcards
  - When flashcards are accepted via `POST /api/flashcards`, update generation statistics (`accepted_unedited_count` or `accepted_edited_count`)

### 4.3. Study Session Business Logic

**Spaced Repetition Algorithm:**
- Use external open-source library (not specified in PRD, implementation detail)
- Algorithm considers:
  - Current `status` of flashcard
  - `repetition_count`
  - User's self-assessment `quality` (0-5)
- Update flashcard after review:
  - Increment `repetition_count`
  - Update `status` based on algorithm logic:
    - `new` → `learning` after first review
    - `learning` → `review` after successful reviews
    - `review` → `mastered` after consistent successful reviews
  - Algorithm determines next review interval (stored in algorithm's state, not in database for MVP)

**Session Logic:**
- Prioritize flashcards by status: `new` > `learning` > `review` > `mastered`
- Return flashcards in random order to prevent pattern recognition
- Limit number of flashcards per session to prevent cognitive overload

### 4.4. Statistics Business Logic

**Calculation Rules:**
- Total flashcards: Count all flashcards for user
- By status: Group by `status` field
- By source: Group by `source` field
- Generation statistics:
  - Total generations: Count all generation records
  - Total generated: Sum of `generated_count` from all generations
  - Total accepted unedited: Sum of `accepted_unedited_count`
  - Total accepted edited: Sum of `accepted_edited_count`
  - Acceptance rate: (accepted_unedited + accepted_edited) / generated
- Study statistics:
  - Total reviews: Sum of `repetition_count` from all flashcards
  - Average repetition count: Average of `repetition_count`

### 4.5. Error Handling

**Standard Error Response Format:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication required or invalid token
- `NOT_FOUND` - Resource not found or user doesn't have access
- `RATE_LIMIT_EXCEEDED` - Too many requests to AI API
- `AI_API_ERROR` - Error from OpenRouter.ai API
- `DATABASE_ERROR` - Database operation failed
- `INTERNAL_SERVER_ERROR` - Unexpected server error

### 4.6. Rate Limiting and Security

**Rate Limiting:**
- AI generation endpoint (`POST /api/generations`): Limit to prevent abuse and control costs
  - Suggested: 10 requests per hour per user
  - Return `429 Too Many Requests` if exceeded
- General API endpoints: Standard rate limiting (e.g., 100 requests per minute per user)

**Security Measures:**
- All endpoints require authentication (except health check if implemented)
- RLS policies provide database-level security
- Input validation prevents SQL injection and XSS
- Request size limits to prevent DoS attacks
- CORS configuration for frontend domain only

### 4.7. Pagination

All list endpoints support pagination:
- Default page size: 20 items
- Maximum page size: 100 items (configurable per endpoint)
- Response includes pagination metadata:
  - Current page
  - Items per page
  - Total items
  - Total pages

### 4.8. Data Consistency

**Transaction Handling:**
- Batch operations (e.g., `POST /api/flashcards/batch`) use database transactions
- If any flashcard in batch fails validation, entire batch is rolled back
- Generation statistics updates are atomic with flashcard creation

**Timestamps:**
- `created_at` and `updated_at` are managed by database defaults and triggers
- `updated_at` is automatically updated on record modification

