# Error Handling Documentation

## Overview

The MarrakechDunes project implements a comprehensive error handling system that provides consistent error responses across all environments while maintaining security and debugging capabilities.

## Backend Error Handling

### Global Error Handler

The backend uses a centralized error handling system located in `server/error-handler.ts`:

```typescript
// Standardized error response format
{
  "status": "error",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-07T12:00:00.000Z",
  "path": "/api/activities",
  "method": "GET",
  "details": { /* Environment-specific details */ }
}
```

### Error Classes

Custom error classes provide structured error handling:

- `AppError` - Base error class
- `ValidationError` - Input validation failures (400)
- `AuthenticationError` - Authentication required (401)
- `AuthorizationError` - Access denied (403)
- `NotFoundError` - Resource not found (404)
- `RateLimitError` - Too many requests (429)
- `DatabaseError` - Database operation failures (500)

### Environment-Specific Behavior

#### Development
- Full stack traces in error responses
- Detailed logging with request context
- Validation error details included

#### Test
- Structured logging for test assertions
- Minimal error details
- Focus on error codes and messages

#### Production
- Clean error messages without sensitive details
- Full error details logged server-side only
- Security-focused error responses

### Usage Examples

```typescript
// In route handlers
app.get('/api/activities', asyncHandler(async (req, res) => {
  try {
    const activities = await storage.getActivities();
    res.json(activities);
  } catch (error) {
    throw handleDatabaseError(error);
  }
}));

// Custom error throwing
if (!user) {
  throw new AuthenticationError('Invalid credentials');
}
```

## Frontend Error Handling

### React Error Boundary

The frontend uses a React Error Boundary (`client/src/components/error-boundary.tsx`) to catch and handle JavaScript errors:

```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling logic
  }}
>
  <App />
</ErrorBoundary>
```

### API Error Handling

The frontend automatically handles API errors through the query client:

```typescript
// Automatic error handling for different status codes
switch (res.status) {
  case 401: throw new Error('Authentication required');
  case 403: throw new Error('Access denied');
  case 404: throw new Error('Resource not found');
  case 429: throw new Error('Too many requests');
  case 500: throw new Error('Server error');
}
```

### Error UI Components

- **Error Boundary**: Catches React errors and shows fallback UI
- **Toast Notifications**: Shows API error messages to users
- **Loading States**: Handles loading and error states gracefully

## Docker Error Standardization

### Why Docker Helps

Docker eliminates "works on my machine" errors by:

1. **Consistent Environment**: Same Node.js version, dependencies, and OS
2. **Isolated Dependencies**: No conflicts with host system packages
3. **Reproducible Builds**: Same build process across all environments
4. **Health Checks**: Built-in health monitoring and error detection

### Docker Configuration

#### Production Container
```dockerfile
FROM node:20-alpine AS production
# Multi-stage build for optimized production image
# Non-root user for security
# Health checks for error monitoring
```

#### Development Container
```yaml
# docker-compose.yml
services:
  backend-dev:
    # Hot reload for development
    # Volume mounts for live code changes
    # Development environment variables
```

### Usage

```bash
# Production
docker-compose up backend

# Development
docker-compose --profile dev up backend-dev

# With local MongoDB
docker-compose --profile dev --profile local up
```

## Error Monitoring

### Logging Strategy

#### Development
- Console logging with full context
- Stack traces in error responses
- Request/response logging

#### Production
- Structured JSON logging
- Error aggregation
- Performance monitoring

### Health Checks

- **Backend**: `/api/health` endpoint
- **Docker**: Built-in health checks
- **Database**: Connection monitoring

## Best Practices

### Backend
1. Always use `asyncHandler` for async routes
2. Throw specific error types instead of generic errors
3. Log errors with context (request details, user info)
4. Use environment-specific error details

### Frontend
1. Wrap components in Error Boundaries
2. Handle loading and error states in UI
3. Provide meaningful error messages to users
4. Log errors for debugging

### Docker
1. Use multi-stage builds for production
2. Run as non-root user
3. Include health checks
4. Use environment-specific configurations

## Testing Error Handling

### Backend Tests
```typescript
// Test error responses
expect(response.status).toBe(404);
expect(response.body.status).toBe('error');
expect(response.body.code).toBe('NOT_FOUND_ERROR');
```

### Frontend Tests
```typescript
// Test error boundary
render(<ErrorBoundary><FailingComponent /></ErrorBoundary>);
expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check allowed origins in CORS configuration
2. **Database Errors**: Verify connection string and network access
3. **Rate Limiting**: Check rate limit configuration
4. **Session Errors**: Verify session secret and cookie settings

### Debug Mode

Set `NODE_ENV=development` to enable:
- Detailed error responses
- Full stack traces
- Request/response logging
- Validation error details

## Security Considerations

1. **No Sensitive Data**: Never expose sensitive information in error messages
2. **Rate Limiting**: Prevent error-based attacks
3. **Input Validation**: Validate all inputs to prevent errors
4. **Error Logging**: Log errors securely without exposing sensitive data

This error handling system ensures consistent, secure, and debuggable error responses across all environments while maintaining a good user experience.
