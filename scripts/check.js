#!/usr/bin/env bun
import {
  error as logError,
  info as logInfo
} from "../system/console.js";
import { read } from "../system/io.js";
import {
  join,
  list,
  parent,
  resolve
} from "../system/path.js";
import { exit } from "../system/process.js";
import { fileUrlToPath } from "../system/uri.js";

/**
 * Checks that source imports respect the flattened layering rules.
 * @module scripts/check
 */

const root = resolve(parent(parent(fileUrlToPath(import.meta.url))));
const sourceDirs = [
  "app",
  "cipher",
  "components",
  "constants",
  "database",
  "domain",
  "endpoints",
  "errors",
  "format",
  "helpers",
  "interceptors",
  "network",
  "repositories",
  "screens",
  "scripts",
  "services",
  "stores",
  "stylesheets",
  "system",
  "test",
  "validation"
];
const specifierPattern = /(?:from|import|require)\s*\(?\s*["']([^"']+)["']/g;
const failures = [];

/**
 * Records a layering violation for a source file.
 *
 * @param {string} file - Workspace-relative file path.
 * @param {string} detail - Rule that was broken.
 * @returns {void}
 */
const fail = (file, detail) => failures.push(`${file}: ${detail}`);

for (const dir of sourceDirs) {
  for (const name of list(join(root, dir), {
    force: true,
    recursive: true
  })) {
    if (!name.endsWith(".js")) continue;

    const file = `${dir}/${name}`;
    const absolute = join(root, file);
    const content = read(absolute, "utf8");
    const code = content.replace(/\/\*[\s\S]*?\*\//g, "");
    const depth = file.split("/").length - 1;
    let match;

    while ((match = specifierPattern.exec(code)) !== null) {
      const specifier = match[1];

      if (specifier.includes("node:") && dir !== "system" && dir !== "test") {
        fail(file, `node: imports are only allowed in system/* (found ${specifier})`);
      }
      if (specifier.includes("@supabase/supabase-js") && dir !== "database") {
        fail(file, `Supabase client imports are only allowed in database/* (found ${specifier})`);
      }
      if (specifier.startsWith(".")) {
        const ups = (specifier.match(/^\.\.\//g) || []).length;
        if (ups > depth) {
          fail(file, `relative import escapes the workspace root (${specifier})`);
        }
      }
    }

    if (content.includes("sr" + "c/")) {
      fail(file, "stale " + "sr" + "c/ path reference");
    }
  }
}

for (const dir of [
  "endpoints",
  "interceptors"
]) {
  for (const name of list(join(root, dir), {
    force: true
  })) {
    if (name === "index.js") {
      fail(`${dir}/${name}`, "barrel index.js files are not allowed in this layer");
    }
  }
}

if (failures.length) {
  logError(`Architecture check failed with ${failures.length} issue(s):`);
  for (const failure of failures) logError(`  ${failure}`);
  exit(1);
}

logInfo(`Architecture check passed across ${sourceDirs.length} directories.`);
