#!/usr/bin/env bun
import { raw as rawArguments } from "../system/argument.js";
import {
  error as logError,
  info as logInfo
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
  join,
  parent,
  resolve
} from "../system/path.js";
import { exit } from "../system/process.js";
import { fileUrlToPath } from "../system/uri.js";

/**
 * Penpot workspace sync launcher.
 * @module scripts/penpot
 */

const root = resolve(parent(parent(fileUrlToPath(import.meta.url))));
const environmentFile = join(root, ".env");
const args = rawArguments();

const values = await loadEnvironment(environmentFile, { optional: true });
const environment = {
  ...processEnv,
  ...values
};

const baseUrl = (environment.PENPOT_URL || "https://design.penpot.app").replace(/\/+$/, "");
const token = environment.PENPOT_TOKEN;
const workspaceName = "paku-paku";
const remote = args.includes("--remote");

/**
 * Calls a Penpot RPC command with the personal access token.
 *
 * @param {string} method - RPC method name.
 * @param {object} [body] - Command parameters.
 * @returns {Promise<object>} Parsed response payload.
 */
const rpc = async (method, body = {}) => {
  const response = await fetch(`${baseUrl}/api/rpc/command/${method}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Token ${token}`
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.error?.message || payload?.error?.code || JSON.stringify(payload);
    throw new Error(`${method} failed (${response.status}): ${detail}`);
  }

  return payload;
};

/**
 * Updates a KEY=value entry in .env, appending it when absent.
 *
 * @param {string} name - Variable name.
 * @param {string} value - New value.
 * @returns {void}
 */
const setVariable = (name, value) => {
  const content = read(environmentFile, "utf8");
  const pattern = new RegExp(`^${name}=.*$`, "m");
  const line = `${name}="${value}"`;
  write(environmentFile, pattern.test(content)
    ? content.replace(pattern, line)
    : `${content.trimEnd()}\n${line}\n`);
};

try {
  if (!token) {
    throw new Error("Missing PENPOT_TOKEN in .env");
  }

  const teamsPayload = await rpc("get-teams");
  const teams = Array.isArray(teamsPayload)
    ? teamsPayload
    : teamsPayload?.teams || [];
  const existing = teams.find((team) => team?.name === workspaceName);
  const team = existing || await rpc("create-team", { name: workspaceName });

  if (!team?.id) {
    throw new Error(`Could not resolve a workspace id for ${workspaceName}`);
  }

  setVariable("PENPOT_WORKSPACE_ID", team.id);

  if (remote) {
    setVariable("PENPOT_MCP_REMOTE_MODE", "true");
  }

  logInfo(`${existing ? "Linked" : "Created"} Penpot workspace ${workspaceName} (${team.id}).`);
  logInfo(remote
    ? "Local MCP configured in remote mode against the workspace backend."
    : "Use --remote to also link the local MCP server to this workspace.");
} catch (error) {
  logError(error instanceof Error ? error.message : String(error));
  exit(1);
}
