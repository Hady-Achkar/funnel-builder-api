/**
 * Test Migration Script
 *
 * Migrates a single test user (ahmadalmuhtar@gmail.com) from old database
 * to verify the migration system works correctly before bulk migration
 *
 * Usage:
 * npx ts-node scripts/migrate-test-user.ts
 */

import { PrismaClient } from '../src/generated/prisma-client';
import { MigrateOldUserService } from '../src/services/migration/old-user';
import { oldUserDataSchema, OldUserData } from '../src/types/migration/old-user';

// Old database connection
const oldDbClient = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://digitalsite_admin:Test%401234%23@digitalsite-prod-db.postgres.database.azure.com:5432/postgres?sslmode=require',
    },
  },
});

// Test user email
const TEST_USER_EMAIL = 'ahmadalmuhtar@gmail.com';

async function testMigration() {
  console.log('='.repeat(70));
  console.log('OLD USER MIGRATION - TEST SCRIPT');
  console.log('='.repeat(70));
  console.log(`\nTest User: ${TEST_USER_EMAIL}\n`);

  try {
    // 1. Fetch user from old database
    console.log('1. Fetching user from old database...');
    const oldUserRaw: any[] = await oldDbClient.$queryRawUnsafe(`
      SELECT
        id,
        username,
        email,
        firstname,
        lastname,
        usertype,
        is_paid,
        stripe_customer_id,
        balance,
        created_at,
        updated_at,
        trial_end_date,
        maximum_funnels_allowed,
        maximum_subdomains_allowed,
        maximum_custom_domains_allowed,
        maximum_admins_allowed
      FROM up_users
      WHERE email = '${TEST_USER_EMAIL}'
      LIMIT 1;
    `);

    if (oldUserRaw.length === 0) {
      console.error(`❌ User not found in old database: ${TEST_USER_EMAIL}`);
      process.exit(1);
    }

    const oldUser = oldUserRaw[0];
    console.log('✅ User found in old database');
    console.log('\nOld User Data:');
    console.table({
      Email: oldUser.email,
      Username: oldUser.username,
      'First Name': oldUser.firstname,
      'Last Name': oldUser.lastname,
      'User Type': oldUser.usertype,
      'Is Paid': oldUser.is_paid,
      Balance: oldUser.balance,
      'Created At': oldUser.created_at,
      'Trial End Date': oldUser.trial_end_date,
    });

    // 2. Validate old user data
    console.log('\n2. Validating user data...');
    const validatedOldUser: OldUserData = oldUserDataSchema.parse(oldUser);
    console.log('✅ User data validated successfully');

    // 3. Migrate user
    console.log('\n3. Migrating user to new system...');
    const result = await MigrateOldUserService.migrateUser(validatedOldUser);

    // 4. Display results
    console.log('\n' + '='.repeat(70));
    console.log('MIGRATION RESULT');
    console.log('='.repeat(70));

    if (result.success) {
      console.log('\n✅ Migration successful!\n');
      console.table({
        'User ID': result.userId,
        Email: result.email,
        Plan: result.plan,
        'Workspace Created': result.workspaceCreated ? 'Yes' : 'No',
        'Workspace ID': result.workspaceId || 'N/A',
        Message: result.message,
      });

      if (result.temporaryPassword) {
        console.log('\n📋 CREDENTIALS (for testing):');
        console.log('─'.repeat(70));
        console.log(`Email: ${result.email}`);
        console.log(`Password: ${result.temporaryPassword}`);
        console.log('─'.repeat(70));
        console.log('\n⚠️  NOTE: User should change this password after first login');
      }

      console.log('\n📧 Welcome email sent to user (check SendGrid logs)');
    } else {
      console.log('\n❌ Migration failed\n');
      console.table({
        Email: result.email,
        Message: result.message,
        Error: result.error || 'N/A',
      });
    }

    console.log('\n' + '='.repeat(70));
  } catch (error: any) {
    console.error('\n❌ MIGRATION ERROR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await oldDbClient.$disconnect();
  }
}

// Run migration
testMigration();
