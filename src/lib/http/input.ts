export const validId = (id: unknown, max = 128): id is string =>
  typeof id === "string" && id.length <= max && /^[a-zA-Z0-9_-]+$/.test(id);

export function appOrigin(): string | undefined {
  const value = process.env.APP_ORIGIN;
  if (!value) return undefined;
  const url = new URL(value);
  if (url.origin !== value || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) {
    throw new Error("APP_ORIGIN must be a canonical origin.");
  }
  return value;
}

export function sameOrigin(request: Request) {
  const origin = appOrigin();
  return origin !== undefined && request.headers.get("origin") === origin;
}

export async function readBody(request: Request, max: number): Promise<Response> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > max)) throw new RangeError("Body too large.");
  if (!request.body) throw new TypeError("Body required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel().catch(() => undefined);
        throw new RangeError("Body too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Response(new Blob(chunks), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } });
}

export async function readJson(request: Request, max: number, allowedKeys: string[]): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw new TypeError("JSON required.");
  const value: unknown = await (await readBody(request, max)).json();
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    throw new TypeError("Invalid JSON fields.");
  }
  return value as Record<string, unknown>;
}
