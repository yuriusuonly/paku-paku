import config from "../shared/constants/config.js";
import logo from "../../png/logo.png";
import maskableLogo from "../../png/logo-maskable.png";

/**
 * PWA manifest web API route (`src/app/manifest.json+api.js`): serves a
 * Web App Manifest generated from shared config and the app icons.
 * @module app/manifest+api
 */

/**
 * Manifest icon entry rendered in the manifest's `icons` array.
 *
 * @typedef {object} ManifestIcon
 * @property {string} src Icon asset URL.
 * @property {string} sizes Icon size specifier (e.g. `"1024x1024"`).
 * @property {string} type Icon MIME type.
 * @property {string} purpose Icon purpose hint (`"any"` or `"maskable"`).
 */

/**
 * Whether the manifest is being generated for the static production export.
 *
 * Development serves the source PNGs through Expo's `unstable_path` asset
 * middleware; production uses the copies that `bun run expo:build` places in
 * `build/client/png/`.
 *
 * @type {boolean}
 */
const isProduction = process.env.NODE_ENV === "production";

/**
 * Manifest document for `/manifest.json` (name, description, display, icons).
 *
 * @typedef {object} PwaManifest
 * @property {string} [name] Full app name from shared config.
 * @property {string} [short_name] Short app name from shared config.
 * @property {string} [description] App description from shared config.
 * @property {string} start_url Start path for launched sessions.
 * @property {string} display Display mode for installed contexts.
 * @property {ManifestIcon[]} icons Icon entries declared to installers.
 *
 * @see https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest
 */

/**
 * Default Web App Manifest built from shared config and the repo logo.
 *
 * The `any` icon uses the full-size bento box with a transparent background;
 * the `maskable` icon keeps the same design with padding for the safe zone.
 *
 * @type {PwaManifest}
 */
const manifest = {
  name: config.title,
  short_name: config.title,
  description: config.description,
  start_url: ".",
  display: "standalone",
  icons: [
    {
      src: isProduction ? "/png/logo.png" : logo.uri,
      sizes: "1024x1024",
      type: "image/png",
      purpose: "any"
    },
    {
      src: isProduction ? "/png/logo-maskable.png" : maskableLogo.uri,
      sizes: "1024x1024",
      type: "image/png",
      purpose: "maskable"
    }
  ]
};

/**
 * GET handler for `/manifest.json`.
 *
 * @returns {Response} JSON Web App Manifest payload.
 */
export function GET() {
  return Response.json(manifest);
}
