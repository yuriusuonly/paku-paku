#!/usr/bin/env bun
import { raw as rawArguments } from "../lib/system/argument.js";
import {
  debug,
  error as logError
} from "../lib/system/console.js";
import {
  env as processEnv,
  load as loadEnvironment
} from "../lib/system/environment.js";
import {
  join,
  parent,
  resolve
} from "../lib/system/path.js";
import {
  chdir,
  exit,
  spawn
} from "../lib/system/process.js";
import { fileUrlToPath } from "../lib/system/uri.js";

const root = resolve(parent(parent(fileUrlToPath(import.meta.url))));

chdir(root);

const args = rawArguments();

const environment = {
  ...processEnv,
  ...(await loadEnvironment(join(root, ".env"), { optional: true }))
};

if ((args[0] === "secret" || args[0] === "workflow") && !args.includes("--repo") && environment.GITHUB_REPOSITORY) {
  args.push("--repo", environment.GITHUB_REPOSITORY);
}

const outcome = await debug(() => spawn("gh", args, {
  cwd: root,
  env: environment
}));

if (outcome.error || outcome.code !== 0) {
  logError(`gh failed (exit ${outcome.code ?? 1})`);
  exit(outcome.code ?? 1);
}
