const requiredEnvVars = [
  "STEAM_USERNAME",
  "STEAM_PASSWORD",
  "STEAM_IDENTITY_SECRET",
  "STEAM_SHARED_SECRET",
] as const;

const missing = requiredEnvVars.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required Steam env vars: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Steam auth env vars are present.");
