/**
 * Test Safety Guard
 *
 * This module prevents tests from accidentally connecting to production databases.
 * It validates the DATABASE_URL environment variable before any tests execute.
 *
 * Safety checks:
 * 1. Database name must contain "test"
 * 2. Database name must NOT match production database names
 * 3. Integration tests should use localhost
 *
 * This runs automatically via vitest.config.ts setupFiles before test execution.
 */

/**
 * Validates that tests are using a safe test database
 * Exits process if production database is detected
 */
export function validateTestDatabase(): void {
  const dbUrl = process.env.DATABASE_URL || '';

  if (!dbUrl) {
    console.error('❌ CRITICAL: DATABASE_URL is not set');
    console.error('Check your .env.test file configuration');
    process.exit(1);
  }

  // Extract database name from URL
  // Format: postgresql://user:pass@host:port/dbname?params
  const dbName = dbUrl.split('/').pop()?.split('?')[0];

  if (!dbName) {
    console.error('❌ CRITICAL: Cannot parse database name from DATABASE_URL');
    console.error(`URL: ${dbUrl}`);
    process.exit(1);
  }

  // List of FORBIDDEN database names (production/development databases)
  const forbiddenDatabases = [
    'ds-dev',                      // Azure dev database
    'ds-prod',                     // Potential production database
    'ds-production',               // Variations
    'funnel_builder',              // Local development database (without _test suffix)
    'digitalsite-prod',
    'digitalsite-production',
    'funnel-builder',              // Hyphenated version
  ];

  // Required test database patterns
  const validTestPatterns = [
    'test',
    '_test',
    '-test',
  ];

  // Check if database name contains 'test'
  const isTestDb = validTestPatterns.some(pattern =>
    dbName.toLowerCase().includes(pattern)
  );

  // CRITICAL: Fail if database name doesn't contain 'test'
  if (!isTestDb) {
    // Check if it matches forbidden patterns (more strict check for non-test databases)
    const matchesForbiddenPattern = forbiddenDatabases.some(forbidden => {
      const dbLower = dbName.toLowerCase();
      const forbiddenLower = forbidden.toLowerCase();

      // Exact match
      if (dbLower === forbiddenLower) return true;

      // Starts with forbidden pattern (e.g., "ds-dev-something")
      if (dbLower.startsWith(forbiddenLower + '-') ||
          dbLower.startsWith(forbiddenLower + '_')) return true;

      return false;
    });

    const errorType = matchesForbiddenPattern ?
      'PRODUCTION DATABASE DETECTED' :
      'NOT A TEST DATABASE';

    console.error('\n═══════════════════════════════════════════════════════════');
    console.error(`❌ CRITICAL SAFETY VIOLATION: ${errorType}`);
    console.error('═══════════════════════════════════════════════════════════');
    console.error(`\nDatabase name: ${dbName}`);
    console.error(`\nFull URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    console.error('\n⛔ Tests can only run against databases with "test" in the name!');
    console.error('\nExpected patterns:');
    console.error('  - *test (e.g., funnel_builder_test)');
    console.error('  - *_test (e.g., myapp_test)');
    console.error('  - *-test (e.g., myapp-test)');
    console.error(`\nActual: ${dbName}`);

    if (matchesForbiddenPattern) {
      console.error('\n⚠️  DANGER: This database name matches a known production pattern!');
      console.error('Forbidden patterns: ' + forbiddenDatabases.join(', '));
    }

    console.error('\nAction required:');
    console.error('1. Check your .env.test file');
    console.error('2. Rename test database to include "test"');
    console.error('3. Update DATABASE_URL in .env.test');
    console.error('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }

  // Warning for remote databases (should use localhost for tests)
  const isLocalhost = dbUrl.includes('localhost') ||
                      dbUrl.includes('127.0.0.1') ||
                      dbUrl.includes('::1');

  if (!isLocalhost) {
    console.warn('\n⚠️  WARNING: Tests connecting to REMOTE database');
    console.warn(`Database: ${dbName}`);
    console.warn(`Host: ${dbUrl.split('@')[1]?.split('/')[0]}`);
    console.warn('Recommendation: Use localhost for test databases');
    console.warn('This is acceptable if using a remote test database service\n');
  }

  // Success - safe to proceed
  console.log('✅ Database safety check passed');
  console.log(`   Database: ${dbName}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'unknown'}`);
  console.log(`   Location: ${isLocalhost ? 'localhost' : 'remote'}\n`);
}

/**
 * Validates that NODE_ENV is set to 'test'
 * This is usually set automatically by Vitest
 */
export function validateTestEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv !== 'test') {
    console.warn('⚠️  WARNING: NODE_ENV is not set to "test"');
    console.warn(`   Current value: ${nodeEnv || 'undefined'}`);
    console.warn('   This may indicate tests are running in wrong environment');
    console.warn('   Vitest should automatically set NODE_ENV=test\n');
  }
}

/**
 * Main safety check function
 * Call this before any test execution
 */
export function runTestSafetyChecks(): void {
  console.log('\n🔒 Running test safety checks...\n');

  try {
    validateTestEnvironment();
    validateTestDatabase();

    console.log('✅ All safety checks passed - tests can proceed safely\n');
  } catch (error) {
    console.error('❌ Safety check failed:', error);
    process.exit(1);
  }
}

// Run checks when this file is loaded as a setupFile in Vitest
runTestSafetyChecks();
