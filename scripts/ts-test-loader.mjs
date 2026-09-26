import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs"];
const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function candidateUrls(specifier) {
  const urls = [];
  if (SOURCE_EXTENSIONS.includes(extname(specifier))) {
    urls.push(pathToFileURL(specifier).href);
    return urls;
  }
  for (const extension of SOURCE_EXTENSIONS) urls.push(pathToFileURL(specifier + extension).href);
  for (const extension of SOURCE_EXTENSIONS) urls.push(pathToFileURL(join(specifier, "index" + extension)).href);
  return urls;
}

function resolveSpecifier(specifier, parentUrl) {
  if (specifier.startsWith("@/")) return join(ROOT, "src", specifier.slice(2));
  if ((specifier.startsWith(".") || specifier.startsWith("/")) && parentUrl) {
    return join(dirname(fileURLToPath(parentUrl)), specifier);
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const mapped = resolveSpecifier(specifier, context.parentURL);
  if (mapped) {
    for (const url of candidateUrls(mapped)) {
      try {
        if (existsSync(fileURLToPath(url))) return { url, shortCircuit: true };
      } catch {}
    }
  }
  return nextResolve(specifier, context);
}
