#!/usr/bin/env bun
import { raw as rawArguments } from "../system/argument.js";
import {
  debug,
  error as logError
} from "../system/console.js";
import {
  env as processEnv,
  load as loadEnvironment
} from "../system/environment.js";
import {
  join,
  parent,
  resolve
} from "../system/path.js";
import {
  chdir,
  execPath,
  exit,
  spawn
} from "../system/process.js";
import { fileUrlToPath } from "../system/uri.js";

const root = resolve(parent(parent(fileUrlToPath(import.meta.url))));

chdir(root);

const args = rawArguments();

const environment = {
  ...processEnv,
  ...(await loadEnvironment(join(root, ".env"), { optional: true }))
};

const resetSql = "begin; drop schema public cascade; create schema public; grant usage on schema public to postgres, anon, authenticated, service_role; grant all on schema public to postgres, service_role; alter default privileges in schema public grant all on tables to postgres, service_role; alter default privileges in schema public grant all on functions to postgres, service_role; alter default privileges in schema public grant all on sequences to postgres, service_role; delete from supabase_migrations.schema_migrations; commit;";

const invoke = async (command) => {
  const outcome = await debug(() => spawn(execPath, [
    "x",
    "--bun",
    "supabase",
    "--workdir",
    ".supabase",
    ...command
  ], {
    cwd: root,
    env: environment
  }));

  if (outcome.error || outcome.code !== 0) {
    logError(`supabase failed (exit ${outcome.code ?? 1})`);
    exit(outcome.code ?? 1);
  }
};

if (args[0] === "reset-remote") {
  await invoke([
    "db",
    "query",
    "--remote",
    "--yes",
    resetSql
  ]);
  await invoke([
    "db",
    "push",
    "--remote",
    "--include-seed",
    "--yes"
  ]);
} else {
  if (args[0] === "link" && !args.includes("--project-ref") && environment.SUPABASE_PROJECT_REF) {
    args.push("--project-ref", environment.SUPABASE_PROJECT_REF);
  }

  await invoke(args);
}
