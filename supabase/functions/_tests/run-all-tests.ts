/**
 * Test Runner - Execute All Test Suites
 * 
 * Usage: deno run --allow-env --allow-net --allow-read supabase/functions/_tests/run-all-tests.ts
 */

console.log("🧪 CareerIQ Edge Functions - Comprehensive Test Suite\n");
console.log("=" .repeat(60));

const testSuites = [
  {
    name: "Schema Validation",
    file: "./schema-validation.test.ts",
    description: "Validates Zod schemas for all 8 hardened functions"
  },
  {
    name: "JSON Extraction",
    file: "./json-extraction.test.ts",
    description: "Tests robust JSON parsing from various AI response formats"
  },
  {
    name: "Error Handling",
    file: "./error-handling.test.ts",
    description: "Verifies retry logic, backoff, and error classification"
  },
  {
    name: "Integration",
    file: "./integration.test.ts",
    description: "End-to-end tests for complete function flows"
  }
];

let totalPassed = 0;
let totalFailed = 0;
const startTime = Date.now();

for (const suite of testSuites) {
  console.log(`\n📋 ${suite.name}`);
  console.log(`   ${suite.description}`);
  console.log("-".repeat(60));
  
  try {
    const command = new Deno.Command("deno", {
      args: ["test", "--allow-env", "--allow-net", suite.file],
      stdout: "inherit",
      stderr: "inherit"
    });
    
    const { code } = await command.output();
    
    if (code === 0) {
      console.log(`✅ ${suite.name} - PASSED\n`);
      totalPassed++;
    } else {
      console.log(`❌ ${suite.name} - FAILED\n`);
      totalFailed++;
    }
  } catch (error) {
    console.error(`❌ ${suite.name} - ERROR: ${error.message}\n`);
    totalFailed++;
  }
}

const duration = Date.now() - startTime;

console.log("\n" + "=".repeat(60));
console.log("📊 Test Summary");
console.log("=".repeat(60));
console.log(`Total Test Suites: ${testSuites.length}`);
console.log(`Passed: ${totalPassed} ✅`);
console.log(`Failed: ${totalFailed} ❌`);
console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
console.log("=".repeat(60));

if (totalFailed === 0) {
  console.log("\n🎉 All tests passed! The hardening pattern is working correctly.\n");
  Deno.exit(0);
} else {
  console.log("\n⚠️  Some tests failed. Please review the errors above.\n");
  Deno.exit(1);
}
