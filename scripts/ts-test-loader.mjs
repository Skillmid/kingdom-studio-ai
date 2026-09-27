import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs"];
const SRC_ROOT = join(fileURLToPath(new URL("..", import.meta.url)), "src");

function candidateUrls(basePath) {
  const urls = [];
  if (SOURCE_EXTENSIONS.includes(extname(basePath))) {
    urls.push(pathToFileURL(basePath).href);
    return urls;
  }
  for (const extension of SOURCE_EXTENSIONS) urls.push(pathToFileURL(basePath + extension).href);
  for (const extension of SOURCE_EXTENSIONS) urls.push(pathToFileURL(join(basePath, "index" + extension)).href);
  return urls;
}

export async function resolve(specifier, context, nextResolve) {
  let basePath;
  if (specifier.startsWith("@/")) {
    basePath = join(SRC_ROOT, specifier.slice(2));
  } else if ((specifier.startsWith(".") || specifier.startsWith("/")) && context.parentURL) {
    basePath = join(dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (basePath) {
    for (const url of candidateUrls(basePath)) {
      try {
        if (existsSync(fileURLToPath(url))) return { url, shortCircuit: true };
      } catch {}
    }
  }
  return nextResolve(specifier, context);
}
