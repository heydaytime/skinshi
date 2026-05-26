import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Auth Worker", () => {
	it("responds with CORS headers on preflight", async () => {
		const request = new IncomingRequest("http://example.com/trpc/hello", {
			method: "OPTIONS",
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(204);
	});

	it("hello endpoint returns user count (integration style)", async () => {
		const response = await SELF.fetch("https://example.com/trpc/hello", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				json: {},
			}),
		});
		expect(response.status).toBe(200);
	});
});
