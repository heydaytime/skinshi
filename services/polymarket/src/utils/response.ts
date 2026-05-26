import superjson from "superjson";

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(superjson.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function parseJsonBody<T>(req: Request): Promise<T> {
  const text = await req.text();
  return superjson.parse(text);
}
