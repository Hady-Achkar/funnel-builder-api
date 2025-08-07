# Test Setup Guide

This directory contains the test infrastructure for the Funnel Builder API, following Prisma best practices.

## Architecture

### Core Components

1. **TestDatabase** (`test-database.ts`)
   - Manages test database lifecycle
   - Handles migrations and cleanup
   - Provides transaction support
   - Automatically detects CI environment

2. **TestFactory** (`test-factories.ts`)
   - Provides factory methods for creating test data
   - Ensures consistent test data creation
   - Handles relationships and dependencies
   - Supports bulk operations

3. **TestHelpers** (`helpers.ts`)
   - Backward-compatible helper methods
   - Mock CloudFlare responses
   - JWT token generation
   - Utility functions

## Setup Files

- `env-setup.ts` - Loads environment variables (runs first)
- `setup.ts` - Initializes database and services (runs second)

## Best Practices

### 1. Database Isolation

Each test suite runs with a clean database state:
```typescript
beforeEach(async () => {
  await testDatabase.clean(); // Cleans all tables
});
```

### 2. Test Data Creation

Use the test factory for consistent data:
```typescript
const user = await testFactory.createUser({
  email: "test@example.com",
  name: "Test User"
});

const funnel = await testFactory.createFunnel(user.id, {
  name: "My Funnel",
  status: FunnelStatus.DRAFT
});
```

### 3. Transaction Tests

For tests that need rollback:
```typescript
await TestHelpers.runInTransaction(async (tx) => {
  // All changes here will be rolled back
  await tx.user.create({ data: {...} });
});
```

### 4. Cleanup

Always clean up test data:
```typescript
afterEach(async () => {
  await testFactory.cleanupUser(userId);
});
```

## CI/CD Integration

The test setup automatically detects CI environment:
- Uses `postgresql://postgres:postgres@localhost:5432/funnel_builder_test` in CI
- Uses local PostgreSQL in development
- Runs migrations before tests
- Cleans database after each test

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens

### Optional
- `CI=true` - Set automatically in CI environments
- `DEBUG=true` - Enable Prisma query logging

## Migration Management

### Local Development
```bash
# Create new migration
prisma migrate dev --name migration_name

# Apply migrations
prisma migrate deploy

# Reset database
prisma migrate reset
```

### Testing
Migrations are automatically applied when tests run.

## Common Patterns

### Creating Test Users with Related Data
```typescript
const users = await testFactory.createUsersWithFunnels(5);
// Creates 5 users, each with 2 funnels and 3 pages per funnel
```

### Testing with Mock CloudFlare
```typescript
const mockResponse = TestHelpers.mockCloudFlareResponse(true, {
  id: "hostname-id",
  hostname: "example.com"
});
```

### JWT Token Generation
```typescript
const token = TestHelpers.generateJWTToken(userId);
```

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in `.env.test`
3. Verify database exists: `createdb funnel_builder_test`

### Migration Issues
1. Reset database: `prisma migrate reset --force`
2. Regenerate client: `prisma generate`
3. Check migration files in `prisma/migrations`

### Redis Connection Issues
1. Ensure Redis is running
2. Check REDIS_URL in `.env.test`
3. Default: `redis://localhost:6379`

## Performance Tips

1. **Use transactions for isolated tests** - Faster than full cleanup
2. **Batch test data creation** - Use bulk factory methods
3. **Minimize database queries** - Use includes and selects
4. **Run tests in parallel** - Vitest handles this automatically

## Example Test File

See `example.test.ts` for a complete example of using the test setup.