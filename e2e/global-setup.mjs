import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import testAuth from "./support/test-auth.cjs";

const { createAuthCookie, testOwnerId } = testAuth;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const authStatePath = resolve(root, "test-results/e2e-auth-state.json");

export default async function globalSetup() {
  const cookie = createAuthCookie(testOwnerId);
  await mkdir(dirname(authStatePath), { recursive: true });
  await writeFile(
    authStatePath,
    JSON.stringify(
      {
        cookies: [
          {
            ...cookie,
            domain: "localhost",
            path: "/",
            expires: -1,
            httpOnly: false,
            secure: false,
            sameSite: "Lax",
          },
        ],
        origins: [],
      },
      null,
      2,
    ),
  );
}
