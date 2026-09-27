import { createHmac } from "node:crypto";

export function createHs256Jwt(
  accessKey: string,
  secretKey: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  ttlSeconds = 1800,
): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: accessKey,
      exp: nowSeconds + ttlSeconds,
      nbf: nowSeconds - 5,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", secretKey).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}
