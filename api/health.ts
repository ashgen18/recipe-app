export const config = { runtime: "edge" };

export default function handler(request: Request): Response {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  return Response.json({ ok: true, service: "recipe-app-vercel" });
}
