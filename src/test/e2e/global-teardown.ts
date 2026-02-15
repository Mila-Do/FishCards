/**
 * Global teardown for E2E tests
 * Cleans up Supabase database after all tests complete
 *
 * This script:
 * 1. Identifies test users by email pattern
 * 2. Deletes all data associated with test users
 * 3. Deletes test user accounts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables from .env.test
config({ path: ".env.test" });

async function globalTeardown() {
  // eslint-disable-next-line no-console
  console.log("\n🧹 Starting global teardown - cleaning up test data...\n");

  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    // eslint-disable-next-line no-console
    console.error("❌ Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.test");
    // eslint-disable-next-line no-console
    console.error("⚠️  Skipping database cleanup");
    return;
  }

  // Create admin client with Service Role Key (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Step 1: Get predefined test user ID from environment
    const predefinedTestUserId = process.env.E2E_USERNAME_ID;
    const predefinedTestEmail = process.env.E2E_USERNAME;

    if (!predefinedTestUserId) {
      // eslint-disable-next-line no-console
      console.warn("⚠️  E2E_USERNAME_ID not found in .env.test - will only clean dynamic test users");
    }

    // Step 2: Get all users and filter test users
    // eslint-disable-next-line no-console
    console.log("🔍 Identifying test users...");

    const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Failed to list users: ${usersError.message}`);
    }

    // Filter test users by STRICT criteria
    const testUsers = allUsers.users.filter((user) => {
      const email = user.email || "";
      const userId = user.id;

      // Criteria 1: Predefined test user by ID (most secure)
      if (predefinedTestUserId && userId === predefinedTestUserId) {
        return true;
      }

      // Criteria 2: Dynamic E2E test users by email pattern (timestamp-based)
      if (/^test-e2e-\d{13,}@example\.com$/.test(email)) {
        return true;
      }

      // Additional safety: check against predefined email if ID matches
      if (predefinedTestEmail && email === predefinedTestEmail) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️  Found test email ${email} but ID mismatch. Skipping for safety.`);
        return false;
      }

      return false;
    });

    if (testUsers.length === 0) {
      // eslint-disable-next-line no-console
      console.log("✅ No test users found - database is clean");
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`📋 Found ${testUsers.length} test user(s) to clean up`);
    // eslint-disable-next-line no-console
    testUsers.forEach((user) => console.log(`   - ${user.email} (${user.id})`));

    const testUserIds = testUsers.map((user) => user.id);

    // Safety check: Ensure we have valid test user IDs
    if (testUserIds.length === 0) {
      // eslint-disable-next-line no-console
      console.log("✅ No test user IDs to process");
      return;
    }

    // Step 3: Delete flashcards (has FK to generations)
    // eslint-disable-next-line no-console
    console.log("\n🗑️  Deleting flashcards...");
    const { error: flashcardsError, count: flashcardsCount } = await supabase
      .from("flashcards")
      .delete({ count: "exact" })
      .in("user_id", testUserIds);

    if (flashcardsError) {
      // eslint-disable-next-line no-console
      console.error(`⚠️  Error deleting flashcards: ${flashcardsError.message}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`✅ Deleted ${flashcardsCount || 0} flashcard(s)`);
    }

    // Step 4: Delete generation error logs
    // eslint-disable-next-line no-console
    console.log("🗑️  Deleting generation error logs...");
    const { error: errorLogsError, count: errorLogsCount } = await supabase
      .from("generation_error_logs")
      .delete({ count: "exact" })
      .in("user_id", testUserIds);

    if (errorLogsError) {
      // eslint-disable-next-line no-console
      console.error(`⚠️  Error deleting error logs: ${errorLogsError.message}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`✅ Deleted ${errorLogsCount || 0} error log(s)`);
    }

    // Step 5: Delete generations
    // eslint-disable-next-line no-console
    console.log("🗑️  Deleting generations...");
    const { error: generationsError, count: generationsCount } = await supabase
      .from("generations")
      .delete({ count: "exact" })
      .in("user_id", testUserIds);

    if (generationsError) {
      // eslint-disable-next-line no-console
      console.error(`⚠️  Error deleting generations: ${generationsError.message}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`✅ Deleted ${generationsCount || 0} generation(s)`);
    }

    // Step 6: Delete test users (with additional safety checks)
    // eslint-disable-next-line no-console
    console.log("\n👤 Deleting test user accounts...");
    let deletedUsers = 0;

    for (const user of testUsers) {
      // Final safety check before deletion
      const isTestUser = user.id === predefinedTestUserId || /^test-e2e-\d{13,}@example\.com$/.test(user.email || "");

      if (!isTestUser) {
        // eslint-disable-next-line no-console
        console.error(`🚨 SAFETY BLOCK: Refusing to delete non-test user ${user.email} (${user.id})`);
        continue;
      }

      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteUserError) {
        // eslint-disable-next-line no-console
        console.error(`⚠️  Error deleting user ${user.email}: ${deleteUserError.message}`);
      } else {
        deletedUsers++;
        // eslint-disable-next-line no-console
        console.log(`   ✓ Deleted: ${user.email}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`✅ Deleted ${deletedUsers} user account(s)`);

    // Summary
    // eslint-disable-next-line no-console
    console.log("\n✨ Global teardown completed successfully!");
    // eslint-disable-next-line no-console
    console.log("📊 Summary:");
    // eslint-disable-next-line no-console
    console.log(`   - Users deleted: ${deletedUsers}`);
    // eslint-disable-next-line no-console
    console.log(`   - Flashcards deleted: ${flashcardsCount || 0}`);
    // eslint-disable-next-line no-console
    console.log(`   - Generations deleted: ${generationsCount || 0}`);
    // eslint-disable-next-line no-console
    console.log(`   - Error logs deleted: ${errorLogsCount || 0}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("\n❌ Global teardown failed:");
    // eslint-disable-next-line no-console
    console.error(error);
    // eslint-disable-next-line no-console
    console.error("\n⚠️  Some test data may remain in the database\n");
    // Don't throw - we don't want to fail the test suite
  }
}

export default globalTeardown;
