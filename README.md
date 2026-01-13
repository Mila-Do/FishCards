# FishCards

An intelligent flashcard learning platform that leverages AI to accelerate the creation and management of educational flashcards, making spaced repetition learning more accessible and efficient.

## Project Description

FishCards addresses the time-consuming challenge of manually creating high-quality flashcards for spaced repetition learning. By integrating Large Language Models (LLMs) via API, the platform enables users to quickly generate flashcard suggestions from any text input (such as textbook excerpts), dramatically reducing the effort required to build comprehensive study materials.

The application provides a complete flashcard management ecosystem including AI-powered generation, manual creation, editing capabilities, and learning sessions powered by proven spaced repetition algorithms.

## Tech Stack

### Frontend

- **Astro 5** - Fast, efficient web applications with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static typing for better IDE support and code quality
- **Tailwind CSS 4** - Utility-first CSS framework for rapid styling
- **Shadcn/ui** - Accessible React component library for consistent UI

### Backend

- **Supabase** - Complete backend-as-a-service solution providing:
  - PostgreSQL database
  - Multi-language SDKs
  - Built-in user authentication
  - Open source, self-hostable

### AI Integration

- **OpenRouter.ai** - Access to multiple LLM providers (OpenAI, Anthropic, Google, etc.) with:
  - Cost-effective model selection
  - Financial limits on API keys

### CI/CD & Hosting

- **GitHub Actions** - Automated CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker containers

### Testing

- **Vitest** - Fast unit testing framework with native ES modules support
- **React Testing Library** - Simple and complete React components testing
- **Playwright** - Reliable end-to-end testing for web applications
- **MSW (Mock Service Worker)** - API mocking for integration tests
- **Lighthouse CI** - Automated performance and accessibility audits

## Getting Started Locally

### Prerequisites

- Node.js 22.14.0 (use nvm or similar version manager)
- Bun package manager (recommended)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd FishCards
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Start the development server:

   ```bash
   bun run dev
   ```

4. Open [http://localhost:4321](http://localhost:4321) in your browser.

## Available Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `bun run dev`       | Start the development server         |
| `bun run build`     | Build the project for production     |
| `bun run preview`   | Preview the production build locally |
| `bun run astro`     | Run Astro CLI commands               |
| `bun run lint`      | Run ESLint to check code quality     |
| `bun run lint:fix`  | Automatically fix ESLint issues      |
| `bun run format`    | Format code using Prettier           |
| `bun run check-mvp` | Run MVP validation checks            |
| `bun run test`      | Run unit tests with Vitest           |
| `bun run test:ui`   | Run tests with Vitest UI interface   |
| `bun run test:e2e`  | Run end-to-end tests with Playwright |
| `bun run test:coverage` | Generate test coverage reports     |

## Testing

### Test Structure

The project uses a comprehensive testing strategy with multiple layers:

- **Unit Tests** (`src/test/unit/`): Test individual functions and components in isolation
- **Integration Tests** (`src/test/integration/`): Test component and API interactions
- **E2E Tests** (`src/test/e2e/`): Full user workflow testing with Playwright

### Running Tests

#### All Tests
```bash
# Run all tests once
bun run test

# Run tests in watch mode (recommended during development)
bun run test:watch

# Run tests with UI interface
bun run test:ui
```

#### Specific Test Suites

```bash
# Unit tests only
bun run test:unit

# Integration tests only
bun run test:integration

# E2E tests only
bun run test:e2e

# E2E tests with debug mode
bun run test:e2e:debug

# E2E tests in headed mode (visible browser)
bun run test:e2e:headed
```

#### API Client Tests

The API client (`src/lib/api-client.ts`) has comprehensive unit test coverage (91.89%). To run only these tests:

```bash
# Run API client tests specifically
npx vitest run src/test/unit/api/api-client.test.ts

# Run with coverage for API client
npx vitest run --coverage src/test/unit/api/api-client.test.ts

# Run in watch mode during API client development
npx vitest watch src/test/unit/api/api-client.test.ts
```

#### Test Coverage

Generate detailed coverage reports:

```bash
# Generate coverage report for all tests
bun run test:coverage

# Generate coverage for specific test file
npx vitest run --coverage src/test/unit/api/api-client.test.ts
```

### Test Coverage Goals

| Module | Target Coverage | Current Status |
|--------|----------------|----------------|
| API Client | 85%+ | ✅ 91.89% |
| Utility Functions | 80%+ | ✅ 95%+ |
| React Components | 70%+ | In Progress |
| E2E Flows | 100% | In Progress |

### Writing Tests

#### Unit Tests (Vitest + React Testing Library)
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

#### API Integration Tests (MSW)
```typescript
import { rest } from "msw";
import { server } from "@/test/__mocks__/server";

describe("API Integration", () => {
  it("fetches data successfully", async () => {
    server.use(
      rest.get("/api/data", (req, res, ctx) => {
        return res(ctx.json({ success: true, data: [] }));
      })
    );

    const result = await apiCall("GET", "/api/data");
    expect(result.success).toBe(true);
  });
});
```

#### E2E Tests (Playwright)
```typescript
import { test, expect } from "@playwright/test";

test("user can create flashcard", async ({ page }) => {
  await page.goto("/");
  await page.fill('[data-testid="front-input"]', "Question");
  await page.fill('[data-testid="back-input"]', "Answer");
  await page.click('[data-testid="save-button"]');

  await expect(page.getByText("Flashcard created")).toBeVisible();
});
```

## API Documentation

The FishCards API provides REST endpoints for managing flashcards and AI generations. All endpoints require JWT authentication via Bearer token.

### Flashcards API

| Method   | Endpoint              | Description                                     |
| -------- | --------------------- | ----------------------------------------------- |
| `GET`    | `/api/flashcards`     | Get paginated list of flashcards with filtering |
| `POST`   | `/api/flashcards`     | Create one or multiple flashcards               |
| `GET`    | `/api/flashcards/:id` | Get single flashcard by ID                      |
| `PATCH`  | `/api/flashcards/:id` | Update existing flashcard                       |
| `DELETE` | `/api/flashcards/:id` | Delete flashcard by ID                          |

### Generations API

| Method | Endpoint               | Description                        |
| ------ | ---------------------- | ---------------------------------- |
| `GET`  | `/api/generations`     | Get paginated list of generations  |
| `POST` | `/api/generations`     | Create new AI flashcard generation |
| `GET`  | `/api/generations/:id` | Get single generation by ID        |

### Additional Endpoints

| Method | Endpoint                     | Description               |
| ------ | ---------------------------- | ------------------------- |
| `GET`  | `/api/generation-error-logs` | Get generation error logs |

### Documentation & Testing

- **Postman Collection**: See `POSTMAN_REQUESTS.md` for complete API examples
- **Authentication**: JWT tokens via Supabase Auth
- **Response Format**: JSON with consistent error handling
- **Rate Limiting**: Built-in protection against abuse

## Project Scope

### MVP Features

- **User Authentication**: Registration and login system
- **AI Flashcard Generation**: Generate flashcards from text input (1000-10000 characters)
- **Manual Flashcard Creation**: Create custom flashcards with front/back content
- **Flashcard Management**: Edit and delete existing flashcards
- **Learning Sessions**: Spaced repetition algorithm integration
- **Data Privacy**: GDPR-compliant user data storage and management
- **Statistics**: Track AI-generated vs. accepted flashcards

### Out of Scope (Future Enhancements)

- Mobile applications (web-only for MVP)
- Gamification features
- Flashcard sharing between users
- Custom spaced repetition algorithms
- Advanced search functionality
- Public API
- Document import (PDF, DOCX, etc.)
- Advanced notifications

## Project Status

🚧 **MVP in Development**

The project is currently in active development of the Minimum Viable Product (MVP). Core features are being implemented and tested. Key success metrics target 75% acceptance rate for AI-generated flashcards and 75% of new flashcards being created via AI assistance.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
