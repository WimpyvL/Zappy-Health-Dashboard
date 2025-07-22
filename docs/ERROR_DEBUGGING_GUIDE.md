# Error Debugging Guide

This guide provides comprehensive information on debugging and resolving errors in the Zappy Health Dashboard application.

## Recent Error Resolution

### Issues Addressed

1. **Monitoring System Infinite Loops**
   - **Problem**: The monitoring system was creating infinite loops by trying to log its own errors
   - **Solution**: Added loop prevention checks in `src/lib/monitoring.ts`
   - **Prevention**: Always check for self-referential errors in monitoring systems

2. **React Query Retry Cascading Errors**
   - **Problem**: Failed queries were retrying indefinitely, causing error spam
   - **Solution**: Implemented smarter retry logic with rate limiting in `src/app/dashboard/layout.tsx`
   - **Prevention**: Always limit retry attempts and implement exponential backoff

3. **Missing API Endpoints**
   - **Problem**: Frontend was making requests to `/api/channel` which didn't exist
   - **Solution**: Created `src/app/api/channel/route.ts` to handle these requests
   - **Prevention**: Ensure all API endpoints referenced in frontend code exist

## Error Types and Solutions

### 1. Monitoring Errors

**Symptoms:**
- `[Error] Monitoring Error: – Object`
- Errors referencing `monitoring.ts:137`
- `intercept-console-error.js:50` errors

**Common Causes:**
- Monitoring system trying to log its own errors
- Circular dependencies in error logging
- Browser compatibility issues with monitoring APIs

**Solutions:**
```typescript
// Add loop prevention
if (error.message?.includes('monitoring') || error.stack?.includes('monitoring')) {
  console.error('Monitoring system internal error (not logged):', error);
  return;
}

// Wrap monitoring calls in try-catch
try {
  monitoring.logError(error, metadata);
} catch (monitoringError) {
  console.error('Monitoring system failed:', monitoringError);
  console.error('Original error:', error);
}
```

### 2. React Query Errors

**Symptoms:**
- `retry (layout.tsx:39:82)`
- `(anonymous function) (retryer.js:102:135)`
- Repeated query failure messages

**Common Causes:**
- Network connectivity issues
- API endpoints returning 4xx/5xx errors
- Infinite retry loops

**Solutions:**
```typescript
// Implement smart retry logic
retry: (failureCount, error: any) => {
  // Don't retry on 4xx errors except 429 (rate limit)
  if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
    return false;
  }
  return failureCount < 2; // Limit retries
},
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
```

### 3. API Endpoint Errors

**Symptoms:**
- `Failed to load resource: the server responded with a status of 400 (Bad Request)`
- `404 Not Found` for API routes
- Network tab showing failed requests

**Common Causes:**
- Missing API route files
- Incorrect request methods
- Malformed request bodies
- CORS issues

**Solutions:**
1. **Create missing endpoints:**
   ```typescript
   // src/app/api/[endpoint]/route.ts
   export async function GET(request: NextRequest) {
     try {
       // Handle GET requests
       return NextResponse.json({ status: 'ok' });
     } catch (error) {
       return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
   }
   ```

2. **Add proper error handling:**
   ```typescript
   export async function POST(request: NextRequest) {
     try {
       const body = await request.json();
       // Process request
       return NextResponse.json({ success: true });
     } catch (error) {
       return NextResponse.json(
         { error: 'Bad request', message: error.message },
         { status: 400 }
       );
     }
   }
   ```

### 4. Component Rendering Errors

**Symptoms:**
- React component stack traces
- `Cannot read property of undefined`
- Hydration mismatches

**Common Causes:**
- Undefined props or state
- Server/client rendering differences
- Missing error boundaries

**Solutions:**
1. **Add error boundaries:**
   ```tsx
   <ErrorBoundary
     onError={(error, errorInfo) => {
       handleError(error, {
         type: ErrorType.COMPONENT,
         severity: ErrorSeverity.MEDIUM,
         component: 'ComponentName',
       });
     }}
   >
     <YourComponent />
   </ErrorBoundary>
   ```

2. **Add null checks:**
   ```tsx
   const Component = ({ data }) => {
     if (!data) {
       return <div>Loading...</div>;
     }
     
     return <div>{data.property}</div>;
   };
   ```

## Debugging Tools and Techniques

### 1. Browser Developer Tools

**Console Tab:**
- Look for error messages and stack traces
- Check for warnings about deprecated APIs
- Monitor network requests in real-time

**Network Tab:**
- Identify failed API requests
- Check request/response headers
- Verify request payloads

**Application Tab:**
- Check localStorage for monitoring data
- Verify service worker status
- Check for quota exceeded errors

### 2. Monitoring Dashboard

The application includes a built-in monitoring system that stores error data in localStorage:

```javascript
// View stored errors
console.log(JSON.parse(localStorage.getItem('monitoring_events') || '[]'));

// View performance metrics
console.log(JSON.parse(localStorage.getItem('monitoring_performance') || '[]'));

// View user actions
console.log(JSON.parse(localStorage.getItem('monitoring_actions') || '[]'));
```

### 3. Error Handler Utilities

Use the error handler for consistent error management:

```typescript
import { handleError, ErrorType, ErrorSeverity } from '@/lib/error-handler';

try {
  // Risky operation
} catch (error) {
  handleError(error, {
    type: ErrorType.API,
    severity: ErrorSeverity.MEDIUM,
    component: 'ComponentName',
    action: 'actionName',
  });
}
```

## Prevention Best Practices

### 1. Error Boundaries
- Wrap all major components in error boundaries
- Provide meaningful fallback UIs
- Log errors with context information

### 2. API Error Handling
- Always handle both success and error cases
- Implement proper HTTP status codes
- Add request/response validation

### 3. Monitoring Integration
- Use the monitoring system consistently
- Avoid creating monitoring loops
- Rate limit error reporting

### 4. TypeScript Usage
- Enable strict mode in TypeScript
- Use proper type definitions
- Handle optional properties correctly

### 5. Testing
- Write unit tests for error scenarios
- Test API endpoints with various inputs
- Use error boundary testing utilities

## Common Error Patterns

### 1. Async/Await Errors
```typescript
// Bad
const fetchData = async () => {
  const response = await fetch('/api/data');
  return response.json(); // No error handling
};

// Good
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    handleError(error, {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      action: 'fetchData',
    });
    throw error;
  }
};
```

### 2. State Management Errors
```typescript
// Bad
const [data, setData] = useState();
return <div>{data.property}</div>; // Undefined error

// Good
const [data, setData] = useState(null);
if (!data) return <div>Loading...</div>;
return <div>{data.property}</div>;
```

### 3. Event Handler Errors
```typescript
// Bad
const handleClick = () => {
  someRiskyOperation();
};

// Good
const handleClick = withErrorHandling(() => {
  someRiskyOperation();
}, {
  type: ErrorType.COMPONENT,
  severity: ErrorSeverity.LOW,
  component: 'ButtonComponent',
  action: 'click',
});
```

## Troubleshooting Checklist

When encountering errors:

1. **Check the browser console** for error messages and stack traces
2. **Verify network requests** in the Network tab
3. **Check localStorage** for monitoring data
4. **Review recent code changes** that might have introduced the issue
5. **Test in different browsers** to rule out browser-specific issues
6. **Check API endpoints** exist and return expected responses
7. **Verify environment variables** are properly set
8. **Review error boundaries** are properly placed
9. **Check for infinite loops** in monitoring or retry logic
10. **Validate TypeScript types** are correctly defined

## Getting Help

If you encounter persistent errors:

1. **Document the error** with screenshots and console logs
2. **Provide reproduction steps** to recreate the issue
3. **Include environment information** (browser, OS, etc.)
4. **Check the monitoring data** for patterns or additional context
5. **Review this guide** for similar issues and solutions

## Monitoring Data Analysis

The monitoring system provides valuable debugging information:

```typescript
// Get error statistics
import errorHandler from '@/lib/error-handler';
const stats = errorHandler.getErrorStats();
console.log('Error counts:', stats.errorCounts);
console.log('Last error times:', stats.lastErrorTime);

// Clear error statistics (useful for testing)
errorHandler.clearErrorStats();
```

This data can help identify:
- Frequently occurring errors
- Error patterns and trends
- Performance bottlenecks
- User experience issues

Remember to regularly review monitoring data to proactively identify and resolve issues before they impact users.
