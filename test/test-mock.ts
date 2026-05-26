#!/usr/bin/env bun
/**
 * Test script for mock Steam API
 * This script tests the mock endpoints directly without running the full steam service.
 */

const MOCK_STEAMID = "76561198773889166";
const TEST_BASE_URLS = {
  api: "https://api.steampowered.com",
  login: "https://login.steampowered.com",
  community: "https://steamcommunity.com",
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  response?: any;
}

async function testEndpoint(
  name: string,
  url: string,
  expectedStatus: number = 200,
  validate?: (data: any) => boolean
): Promise<TestResult> {
  try {
    console.log(`Testing: ${name}...`);
    const response = await fetch(url);
    
    if (response.status !== expectedStatus) {
      return {
        name,
        passed: false,
        error: `Expected status ${expectedStatus}, got ${response.status}`,
      };
    }

    const data = await response.json().catch(() => null);
    
    if (validate && !validate(data)) {
      return {
        name,
        passed: false,
        error: "Validation failed",
        response: data,
      };
    }

    return { name, passed: true, response: data };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testProfileXML(): Promise<TestResult> {
  try {
    console.log("Testing: Profile XML endpoint...");
    const url = `${TEST_BASE_URLS.community}/id/mockuser/?xml=1`;
    const response = await fetch(url);
    
    if (response.status !== 200) {
      return {
        name: "Profile XML",
        passed: false,
        error: `Expected status 200, got ${response.status}`,
      };
    }

    const text = await response.text();
    
    if (!text.includes("<?xml") || !text.includes("<profile>")) {
      return {
        name: "Profile XML",
        passed: false,
        error: "Invalid XML response",
        response: text.slice(0, 200),
      };
    }

    return { name: "Profile XML", passed: true };
  } catch (error) {
    return {
      name: "Profile XML",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testInventory(): Promise<TestResult> {
  try {
    console.log("Testing: Inventory endpoint...");
    const url = `${TEST_BASE_URLS.community}/inventory/${MOCK_STEAMID}/730/2?l=english&count=100`;
    const response = await fetch(url);
    
    if (response.status !== 200) {
      return {
        name: "Inventory",
        passed: false,
        error: `Expected status 200, got ${response.status}`,
      };
    }

    const data = await response.json();
    
    if (!data.success || !data.assets || !data.descriptions) {
      return {
        name: "Inventory",
        passed: false,
        error: "Invalid inventory response structure",
        response: data,
      };
    }

    return { name: "Inventory", passed: true, response: data };
  } catch (error) {
    return {
      name: "Inventory",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runTests() {
  console.log("=== Mock Steam API Test Suite ===\n");
  console.log("NOTE: These tests require mitmproxy to be running with the mock addon.");
  console.log("Run: cd /Users/mihirbelose/ProgrammingProjects/heydaytime/skinshi/test && ./run-mock.sh\n");
  console.log("---\n");

  const results: TestResult[] = [];

  // Test Authentication Endpoints
  results.push(
    await testEndpoint(
      "RSA Public Key",
      `${TEST_BASE_URLS.api}/IAuthenticationService/GetPasswordRSAPublicKey/v1/`,
      200,
      (data) => data.response?.publickey_mod && data.response?.publickey_exp
    )
  );

  // Test Profile Endpoints
  results.push(await testProfileXML());

  // Test Inventory Endpoints
  results.push(await testInventory());

  // Test WebAPI Endpoints
  results.push(
    await testEndpoint(
      "Player Summaries",
      `${TEST_BASE_URLS.api}/ISteamUser/GetPlayerSummaries/v2/?key=mock_key&steamids=${MOCK_STEAMID}`,
      200,
      (data) => data.response?.players?.length > 0
    )
  );

  // Print results
  console.log("\n=== Test Results ===\n");
  
  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  for (const result of results) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status}: ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.response && !result.passed) {
      console.log(`   Response: ${JSON.stringify(result.response).slice(0, 100)}...`);
    }
  }

  console.log(`\n---`);
  console.log(`Total: ${results.length}, Passed: ${passed.length}, Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\n⚠️  Some tests failed. Make sure:");
    console.log("   1. mitmproxy is running with: ./run-mock.sh");
    console.log("   2. The CA certificate is installed");
    console.log("   3. Traffic is being intercepted");
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  }
}

runTests();
