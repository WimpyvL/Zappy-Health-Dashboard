# Zappy-Dashboard Testing Guide

This document outlines the testing strategy for the Zappy-Dashboard application and provides instructions for running tests.

## Testing Strategy

Our testing approach covers multiple levels of testing to ensure comprehensive test coverage:

1. **Unit Tests**: Test individual components and functions in isolation
2. **Integration Tests**: Test how components work together
3. **API Tests**: Test API interactions and data fetching
4. **End-to-End Tests**: Test complete user flows

## Test Types and Examples

### Component Tests

- Located in the same directory as the component
- Test component rendering, interactions, and state changes
- Example: `src/pages/tasks/TaskModal.test.jsx`

### API Hook Tests

- Test data fetching, mutations, and error handling
- Located alongside the API hooks
- Example: `src/apis/tasks/hooks.test.js`

### Integration Tests

- Test how multiple components work together
- Located in `src/tests/integration`
- Example: `src/tests/integration/TaskManagement.test.js`

### Authentication Tests

- Test protected routes and authentication flows
- Located in `src/tests/auth`
- Example: `src/tests/auth/ProtectedRoute.test.jsx`

### Custom Hook Tests

- Test custom hooks for proper state management and side effects
- Located alongside the hooks
- Example: `src/hooks/useApi.test.js`

### End-to-End Tests

- Test complete user workflows
- Located in `src/tests/e2e`
- Example: `src/tests/e2e/TaskWorkflow.test.js`

## Test Utilities

We've created reusable test utilities to make testing easier and more consistent:

- **Test Providers**: Wrap components with necessary context providers
- **Mock Data**: Consistent mock data for testing
- **API Mocks**: Pre-configured mocks for API calls
- **Authentication Helpers**: Utilities for testing authenticated scenarios

Located in `src/utils/test-utils.js`.

## Running Tests

### Running All Tests

```bash
npm test
```

### Running a Specific Test File

```bash
npm test -- src/pages/tasks/TaskModal.test.jsx
```

### Running Tests with Coverage

```bash
npm test -- --coverage
```

### Running Tests in Watch Mode

```bash
npm test -- --watch
```

## Writing New Tests

### Component Test Example

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../utils/test-utils';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  test('renders correctly', () => {
    renderWithProviders(<YourComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    const user = userEvent.setup();
    renderWithProviders(<YourComponent />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText(/result text/i)).toBeInTheDocument();
  });
});
```

### API Test Example

```jsx
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '../../utils/test-utils';
import { useYourApiHook } from './your-api-hook';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase');

describe('useYourApiHook', () => {
  test('fetches data successfully', async () => {
    const mockData = [{ id: 1, name: 'Test' }];

    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    }));

    const { result } = renderHook(() => useYourApiHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});
```

## Mocking Supabase

For testing components that interact with Supabase, we use Jest to mock the Supabase client:

```jsx
// In your test file
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase');

// Before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Mock authentication
  supabase.auth.getSession.mockResolvedValue({
    data: {
      session: {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'test-token',
      },
    },
    error: null,
  });

  // Mock database queries
  supabase.from.mockImplementation((table) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
  }));
});
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it's implemented
2. **Use Data-Testid Sparingly**: Prefer using accessible roles, labels, and text content for queries
3. **Mock External Dependencies**: Always mock API calls and external services
4. **Keep Tests Fast**: Avoid unnecessary complexity in tests
5. **Use the Testing Library Guiding Principles**: Prioritize tests that resemble how users interact with your code
6. **One Assertion Per Test**: Ideally, each test should verify one specific behavior
7. **Use Consistent Patterns**: Follow the AAA pattern (Arrange, Act, Assert)

## Testing Libraries

- [Jest](https://jestjs.io/): Test runner and assertion library
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/): Component testing
- [user-event](https://testing-library.com/docs/user-event/intro): Simulating user events
- [Mock Service Worker](https://mswjs.io/): API mocking (optional)

## Troubleshooting

### Common Issues

- **Test timeout**: Increase timeout with `jest.setTimeout(10000)`
- **Act warnings**: Ensure all state updates are wrapped in `act()`
- **Async testing issues**: Use `waitFor` or `findBy` queries instead of synchronous `getBy` queries
