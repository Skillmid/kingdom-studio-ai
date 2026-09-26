import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs"];

function candidateUrls(parentUrl, specifier) {
  const parentPath = fileURLToPath(parentUrl);
  const base = join(dirname(parentPath), specifier);
  const urls = [];
  if (SOURCE_EXTENSIONS.includes(extname(base))) {
    urls.push(pathToFileURL(base).href);
    return urls;
  }
  for (const extension of SOURCE_EXTENSIONS) urls.push(pathToFileURL(base + extension).href);
  for (const extension of SOURCE_EXTENSIONS) urls.push(pathToFileURL(join(base, "index" + extension)).href);
  return urls;
}

export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith(".") || specifier.startsWith("/")) && context.parentURL) {
    for (const url of candidateUrls(context.parentURL, specifier)) {
      try {
        if (existsSync(fileURLToPath(url))) return { url, shortCircuit: true };
      } catch {}
    }
  }
  return nextResolve(specifier, context);
}
