import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "bun:test";

/**
 * Architecture boundary tests for source-layer dependency rules.
 * @module test/architecture/layers
 */

const srcRoot = path.resolve(process.cwd(), "src");

/**
 * Allowed target layers for each source layer.
 * @type {Record<string, Set<string>>}
 */
const allowedTargets = {
  app: new Set(["app", "screens", "components", "endpoints", "services", "stores", "domain", "shared"]),
  screens: new Set(["screens", "components", "stores", "services", "domain", "shared"]),
  components: new Set(["components", "stores", "domain", "shared"]),
  stores: new Set(["stores", "services", "domain", "shared"]),
  services: new Set(["services", "database", "domain", "shared"]),
  endpoints: new Set(["endpoints", "interceptors", "repositories", "domain", "shared"]),
  interceptors: new Set(["interceptors", "repositories", "domain", "shared"]),
  repositories: new Set(["repositories", "database", "domain", "shared"]),
  database: new Set(["database", "shared"]),
  domain: new Set(["domain", "shared"]),
  shared: new Set(["shared"])
};

/**
 * Recursively collects JavaScript source files.
 *
 * @param {string} directory
 * @returns {string[]}
 */
function collectFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Extracts relative import specifiers from source text.
 *
 * @param {string} source
 * @returns {string[]}
 */
function extractRelativeImports(source) {
  const pattern = /(?:from\s+|import\s*\(|import\s+)["'](\.[^"']+)["']/g;
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

describe("source layer boundaries", () => {
  test("raw hex colors are confined to the theme token module", () => {
    const themeFile = path.join(srcRoot, "shared", "constants", "theme.js");
    const violations = [];

    for (const file of collectFiles(srcRoot)) {
      if (file === themeFile) continue;
      const source = fs.readFileSync(file, "utf8");
      if (/#[0-9A-Fa-f]{3,8}/.test(source)) {
        violations.push(path.relative(srcRoot, file));
      }
    }

    expect(violations).toEqual([]);
  });

  test("relative imports only point to allowed layers", () => {
    const violations = [];

    for (const file of collectFiles(srcRoot)) {
      const relativePath = path.relative(srcRoot, file);
      const sourceLayer = relativePath.split(path.sep)[0];
      const allowed = allowedTargets[sourceLayer];
      if (!allowed) continue;

      const source = fs.readFileSync(file, "utf8");
      for (const specifier of extractRelativeImports(source)) {
        const resolved = path.normalize(path.resolve(path.dirname(file), specifier));
        if (!resolved.startsWith(`${srcRoot}${path.sep}`)) continue;

        const targetPath = path.relative(srcRoot, resolved);
        const targetLayer = targetPath.split(path.sep)[0];
        if (!allowed.has(targetLayer)) {
          violations.push(`${relativePath} -> ${targetPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
