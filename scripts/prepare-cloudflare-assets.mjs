import { access, cp, mkdir, readdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

const buildDir = "dist";
const assetsDir = join(buildDir, "public-assets");
const excludedEntries = new Set(["_worker.js", "public-assets"]);

await access(buildDir, constants.F_OK);
await rm(assetsDir, { recursive: true, force: true });
await mkdir(assetsDir, { recursive: true });

const entries = await readdir(buildDir, { withFileTypes: true });

for (const entry of entries) {
  if (excludedEntries.has(entry.name)) {
    continue;
  }

  const sourcePath = join(buildDir, entry.name);
  const targetPath = join(assetsDir, entry.name);
  await cp(sourcePath, targetPath, { recursive: true, force: true });
}

try {
  await access(join(assetsDir, "_worker.js"), constants.F_OK);
  throw new Error("Unsafe deploy package: _worker.js is present in public assets.");
} catch (error) {
  if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
  process.stdout.write("Safe deploy package: _worker.js is not present in public assets.\n");
}

process.stdout.write(`Prepared Cloudflare assets in ${assetsDir}\n`);
