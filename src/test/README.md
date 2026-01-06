# Testing Guide

## Overview

This project uses a comprehensive testing setup with:

- **Vitest** - Fast unit testing with ES modules support
- **React Testing Library** - Component testing with real user interactions
- **Playwright** - End-to-end testing with Chromium
- **MSW** - API mocking for integration tests

## Test Structure

```
src/test/
├── unit/           # Unit tests for functions and components
├── integration/    # Integration tests with mocked APIs
├── e2e/           # End-to-end tests with Playwright
├── __mocks__/     # MSW handlers and server setup
├── setup.ts       # Global test setup and utilities
└── test-utils.tsx # Custom render function with providers
```

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
bun run test

# Run with UI
bun run test:ui

# Run in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage

# Run specific test suite
bun run test:unit
bun run test:integration
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
bun run test:e2e

# Run with UI mode
bun run test:e2e:ui

# Run in headed mode (visible browser)
bun run test:e2e:headed

# Debug tests
bun run test:e2e:debug
```

## Writing Tests

### Unit Tests

Use `describe` blocks for grouping and follow Arrange-Act-Assert pattern:

```ts
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Component Tests

Use the custom render function from `test-utils.tsx`:

```tsx
import { render, screen, fireEvent } from '../test-utils';
import MyComponent from './MyComponent';

it('should render and handle clicks', () => {
  const mockFn = vi.fn();
  render(<MyComponent onClick={mockFn} />);
  
  fireEvent.click(screen.getByRole('button'));
  expect(mockFn).toHaveBeenCalled();
});
```

### Integration Tests with MSW

Mock API responses for isolated testing:

```ts
import { server } from '../__mocks__/server';
import { http, HttpResponse } from 'msw';

beforeEach(() => {
  server.use(
    http.get('/api/data', () => {
      return HttpResponse.json({ success: true });
    })
  );
});
```

### E2E Tests with Playwright

Use Page Object Model for maintainable tests:

```ts
import { test } from '@playwright/test';
import { HomePage } from './pages/HomePage';

test('should navigate correctly', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.expectToBeVisible();
});
```

## Best Practices

### General
- Write descriptive test names that explain what is being tested
- Use Arrange-Act-Assert pattern for clarity
- Keep tests isolated and independent
- Mock external dependencies

### Unit Tests
- Test one thing at a time
- Use `vi.fn()` for function mocks
- Use `vi.spyOn()` to monitor existing functions
- Prefer inline snapshots for complex objects

### Component Tests
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility features
- Mock heavy dependencies

### E2E Tests
- Use Page Object Model for reusable page interactions
- Test critical user journeys
- Use data-testid sparingly, prefer semantic selectors
- Include visual regression tests for UI changes
- Test across different viewport sizes

## Debugging

### Vitest
- Use `test.only()` to run single tests
- Use `--reporter=verbose` for detailed output
- Check coverage reports in `coverage/` folder

### Playwright
- Use `--debug` flag to pause execution
- Use trace viewer for failed test analysis
- Screenshots are captured automatically on failure