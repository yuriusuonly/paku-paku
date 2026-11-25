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
  read,
  write
} from "../system/io.js";
import {
  create,
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
const cli = join(root, "node_modules", "expo", "bin", "cli");

// The Expo dev server and static server ignore URL_PORT in the environment,
// so the port must be passed explicitly. The container relies on the same
// launcher with URL_PORT injected as a real env var instead of a .env file.
if ((args[0] === "start" || args[0] === "serve") && environment.URL_PORT && !args.includes("--port")) {
  args.push("--port", environment.URL_PORT);
}

const outcome = await debug(() => spawn(execPath, [cli, ...args], {
  cwd: root,
  env: environment
}));

if (outcome.error || outcome.code !== 0) {
  logError(`expo failed (exit ${outcome.code ?? 1})`);
  exit(outcome.code ?? 1);
}

// Static web exports do not carry the logo assets into the client bundle.
if (args[0] === "export") {
  const destination = create(join(root, "build", "client", "png"), { directory: true });

  for (const name of [
    "logo.png",
    "logo-maskable.png"
  ]) {
    write(join(destination, name), read(join(root, "png", name)));
  }
}
