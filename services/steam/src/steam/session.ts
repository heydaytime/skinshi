import { LoginSession, EAuthTokenPlatformType } from "steam-session";
import SteamTotp from "steam-totp";
import { SteamAuthSchema, type SteamAuth } from "../schemas/steam";

export const session = new LoginSession(EAuthTokenPlatformType.WebBrowser);
export let myAuth: SteamAuth = null as any;

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function requireEnv(name: string): string {
  const value = optionalEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function loadSteamAuthFromEnv(): SteamAuth {
  return SteamAuthSchema.parse({
    username: requireEnv("STEAM_USERNAME"),
    password: requireEnv("STEAM_PASSWORD"),
    identitySecret: requireEnv("STEAM_IDENTITY_SECRET"),
    sharedSecret: requireEnv("STEAM_SHARED_SECRET"),
    refreshToken: optionalEnv("STEAM_REFRESH_TOKEN"),
  });
}

export async function authenticate() {
  if (!myAuth) {
    console.log("Loading Steam authentication details from environment...");
    myAuth = loadSteamAuthFromEnv();
  }

  if (myAuth.refreshToken) {
    console.log("Using saved refresh token...");
    session.refreshToken = myAuth.refreshToken;
  } else {
    console.log("No refresh token, logging in with credentials...");

    // Wait for the authenticated event before proceeding
    const authPromise = new Promise<void>((resolve, reject) => {
      session.once("authenticated", () => {
        console.log("Steam authentication successful!");
        resolve();
      });
      session.once("error", (err) => {
        reject(err);
      });
    });

    const result = await session.startWithCredentials({
      accountName: myAuth.username,
      password: myAuth.password,
      steamGuardCode: SteamTotp.generateAuthCode(myAuth.sharedSecret),
    });

    if (result.actionRequired) {
      // Handle guards if needed (shouldn't happen with valid TOTP)
      throw new Error(
        `Action required: ${result.validActions.map((a) => a.type).join(", ")}`,
      );
    }

    // Wait for authenticated event before using the session
    await authPromise;

    myAuth.refreshToken = session.refreshToken;
  }
}

export async function getCookies(): Promise<string[]> {
  try {
    return await session.getWebCookies();
  } catch {
    console.log("Refresh token expired, re-authenticating...");

    myAuth.refreshToken = null as any;
    await authenticate();
    return await session.getWebCookies();
  }
}
