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
  create,
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

const baseUrl = (environment.PENPOT_MCP_BACKEND_URI || "https://design.penpot.app").replace(/\/+$/, "");
const token = environment.PENPOT_TOKEN;
const mcpToken = environment.PENPOT_MCP_TOKEN;
const projectName = "paku-paku";
const remote = args.includes("--remote");

/**
 * Writes the gitignored local OpenCode override so the MCP connection uses
 * the token from .env without committing it to the project config.
 *
 * @returns {void}
 */
const syncOpenCodeConfig = () => {
  if (!mcpToken) return;

  const directory = create(join(root, ".opencode"), { directory: true });
  const file = join(directory, "opencode.json");
  const config = {
    mcp: {
      servers: {
        penpot: {
          type: "remote",
          url: `${baseUrl}/mcp/stream?userToken=${mcpToken}`,
          headers: {
            Authorization: `Bearer ${mcpToken}`
          }
        }
      }
    }
  };
  write(file, `${JSON.stringify(config, null, 2)}\n`);
};

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

  syncOpenCodeConfig();

  const teamsPayload = await rpc("get-teams");
  const teams = Array.isArray(teamsPayload)
    ? teamsPayload
    : teamsPayload?.teams || [];
  const personal = teams.find((team) => team?.isDefault || team?.is_default);

  if (!personal?.id) {
    throw new Error("Could not resolve the personal workspace.");
  }

  const projectsPayload = await rpc("get-projects", { teamId: personal.id });
  const projects = Array.isArray(projectsPayload)
    ? projectsPayload
    : projectsPayload?.projects || [];
  const existing = projects.find((project) => project?.name === projectName);
  const project = existing || await rpc("create-project", {
    teamId: personal.id,
    name: projectName
  });

  if (!project?.id) {
    throw new Error(`Could not resolve a project id for ${projectName}`);
  }

  setVariable("PENPOT_PROJECT_ID", project.id);

  if (remote) {
    setVariable("PENPOT_MCP_BACKEND_URI", baseUrl);
  }

  logInfo(`${existing ? "Linked" : "Created"} Penpot project ${projectName} in the personal workspace (${project.id}).`);
  logInfo(remote
    ? "Remote project and backend URI are linked."
    : "Use --remote to also persist the backend URI for the remote project.");
} catch (error) {
  logError(error instanceof Error ? error.message : String(error));
  exit(1);
}
