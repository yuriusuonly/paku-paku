import config from "../shared/config.js";
import logo from "../../png/logo.png";
import maskableLogo from "../../png/logo-maskable.png";

/**
 * PWA manifest web API route (`src/app/manifest.json+api.js`): serves a
 * Web App Manifest generated from shared config and the app logo.
 * @module app/manifest+api
 */

/**
 * Manifest icon entry rendered in the manifest's `icons` array.
 *
 * @typedef {object} ManifestIcon
 * @property {string} src Icon asset URI.
 * @property {string} sizes Icon size specifier (e.g. `"1024x1024"`).
 * @property {string} type Icon MIME type.
 * @property {string} purpose Icon purpose hint (`"any"` or `"maskable"`).
 */

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
 * The `any` icon keeps the transparent badge for normal use; the `maskable`
 * icon is full-bleed so platforms can crop it to their preferred shape without
 * clipping the bento mark.
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
      src: logo.uri,
      sizes: "1024x1024",
      type: "image/png",
      purpose: "any"
    },
    {
      src: maskableLogo.uri,
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
