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
import { read } from "../lib/system/io.js";
import {
  join,
  list,
  parent,
  resolve
} from "../lib/system/path.js";
import {
  chdir,
  execPath,
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

// Accept either token name; eas-cli reads EXPO_TOKEN.
if (environment.EAS_TOKEN) {
  environment.EXPO_TOKEN = environment.EAS_TOKEN;
}

// Hosted deploys must inline the hosted Supabase client config, not local.
if (args[0] === "deploy") {
  environment.EXPO_PUBLIC_SUPABASE_TARGET = "hosted";

  const jsDir = join(root, "build", "client", "_expo", "static", "js");
  for (const name of list(jsDir, {
    force: true,
    recursive: true
  })) {
    if (!name.endsWith(".js")) continue;
    if (read(join(jsDir, name), "utf8").includes("127.0.0.1:54321")) {
      logError("Refusing to deploy: the export still contains the local Supabase URL.");
      exit(1);
    }
  }
}

const outcome = await debug(() => spawn(execPath, ["x", "--bun", "eas-cli", ...args], {
  cwd: root,
  env: environment
}));

if (outcome.error || outcome.code !== 0) {
  logError(`eas failed (exit ${outcome.code ?? 1})`);
  exit(outcome.code ?? 1);
}
