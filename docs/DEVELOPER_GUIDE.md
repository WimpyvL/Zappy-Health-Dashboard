# 🚀 Zappy Health Dashboard - Developer Guide

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Quality Tools](#code-quality-tools)
- [Testing](#testing)
- [Git Hooks](#git-hooks)
- [Available Scripts](#available-scripts)
- [Best Practices](#best-practices)

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Telehealth

# Install dependencies
npm install

# Set up environment variables
cp .env.development .env

# Start development server
npm run dev
```

## 🔄 Development Workflow

### 1. Code Quality Enforcement

This project uses automated code quality tools that run on every commit:

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Pre-commit file processing

### 2. Pre-commit Hooks

Every commit automatically:

- ✅ Runs ESLint and fixes auto-fixable issues
- ✅ Formats code with Prettier
- ✅ Only processes staged files (fast!)

### 3. Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run all tests with coverage
npm run test:coverage

# Format all files
npm run format

# Check formatting without fixing
npm run check-format

# Lint code
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Type checking (TypeScript)
npm run type-check

# Validate entire codebase
npm run validate
```

## 🛠 Code Quality Tools

### ESLint Configuration

- **Base**: React App + Jest + Prettier
- **Rules**: Enforces React best practices
- **Auto-fix**: Many issues fixed automatically

### Prettier Configuration

- **File**: `.prettierrc.json`
- **Scope**: JS, JSX, TS, TSX, CSS, MD, JSON
- **Integration**: Works with ESLint

### Lint-staged Configuration

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,md,json}": ["prettier --write"]
}
```

## 🧪 Testing

### Test Structure

```
src/
├── components/
│   └── __tests__/
├── hooks/
│   └── __tests__/
├── utils/
│   └── __tests__/
└── tests/
    ├── integration/
    └── e2e/
```

### Testing Commands

```bash
# Run tests in watch mode
npm test

# Run all tests once
npm run test:all

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npx playwright test
```

### Testing Best Practices

- Write unit tests for utilities and hooks
- Write integration tests for complex components
- Use React Testing Library for component tests
- Mock external dependencies

## 🪝 Git Hooks

### Pre-commit Hook

Located in `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### What happens on commit:

1. **Staged files identified**
2. **ESLint runs** on JS/JSX/TS/TSX files
3. **Auto-fixable issues corrected**
4. **Prettier formats** all applicable files
5. **Commit proceeds** if no unfixable errors

### Bypassing hooks (emergency only):

```bash
git commit --no-verify -m "Emergency commit"
```

## 📜 Available Scripts

| Script                  | Description              |
| ----------------------- | ------------------------ |
| `npm start`             | Start development server |
| `npm run build`         | Build for production     |
| `npm run build:staging` | Build for staging        |
| `npm test`              | Run tests in watch mode  |
| `npm run test:all`      | Run all tests once       |
| `npm run test:coverage` | Run tests with coverage  |
| `npm run format`        | Format all files         |
| `npm run check-format`  | Check formatting         |
| `npm run lint`          | Lint code                |
| `npm run lint:fix`      | Lint and auto-fix        |
| `npm run type-check`    | TypeScript type checking |
| `npm run validate`      | Run all quality checks   |
| `npm run prepare`       | Set up Husky (auto-run)  |

## ✨ Best Practices

### Code Style

- Use **functional components** with hooks
- Prefer **const assertions** for immutable data
- Use **TypeScript** for type safety
- Follow **React best practices**

### Component Structure

```jsx
import React, { memo } from 'react';
import PropTypes from 'prop-types';

const MyComponent = memo(({ prop1, prop2 }) => {
  // Component logic here

  return <div>{/* JSX here */}</div>;
});

MyComponent.displayName = 'MyComponent';

MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

export default MyComponent;
```

### Performance Optimizations

- Use **React.memo** for components that re-render frequently
- Use **useMemo** and **useCallback** for expensive computations
- Implement **code splitting** for large components
- Optimize **bundle size** regularly

### Git Workflow

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Make changes** with frequent commits
3. **Pre-commit hooks** ensure quality
4. **Push branch**: `git push origin feature/my-feature`
5. **Create Pull Request**
6. **Code review** and merge

### Error Handling

- Use **ErrorBoundary** components for error isolation
- Implement **proper error logging**
- Provide **user-friendly error messages**
- Handle **async errors** appropriately

### File Organization

```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── services/      # API and external services
├── contexts/      # React contexts
├── constants/     # Application constants
└── types/         # TypeScript type definitions
```

## 🔧 Troubleshooting

### Common Issues

**Pre-commit hook fails:**

```bash
# Check what's failing
npm run validate

# Fix formatting
npm run format

# Fix linting issues
npm run lint:fix
```

**TypeScript errors:**

```bash
# Check types
npm run type-check

# Fix type issues in your code
```

**Test failures:**

```bash
# Run tests to see failures
npm test

# Update snapshots if needed
npm test -- --updateSnapshot
```

### Getting Help

- Check this guide first
- Review error messages carefully
- Use `npm run validate` to check all quality gates
- Ask team members for code review help

## 🎯 Performance Monitoring

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### Performance Metrics

- Monitor **Core Web Vitals**
- Use **React DevTools Profiler**
- Track **bundle size** changes
- Monitor **test coverage**

---

## 📞 Support

For questions about this developer setup:

1. Check this guide
2. Review existing code patterns
3. Ask in team chat
4. Create an issue for documentation improvements

Happy coding! 🚀
