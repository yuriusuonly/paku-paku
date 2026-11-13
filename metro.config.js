import { getDefaultConfig } from "expo/metro-config";
import { withNativeWind } from "nativewind/metro";

/**
 * Metro bundler configuration for Expo with NativeWind CSS support.
 * @module metro.config
 */

const config = getDefaultConfig(__dirname);

/**
 * Exclude generated/local Supabase state from bundling and file watching.
 * These directories are managed by the Supabase CLI/Docker and may contain
 * root-owned files that the watcher cannot access.
 *
 * @type {RegExp[]}
 */
const blockedPaths = [
  /[/\\]supabase[/\\]\.temp[/\\].*/,
  /[/\\]supabase[/\\]\.branches[/\\].*/,
  /[/\\]supabase[/\\]snippets[/\\].*/
];

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  ...blockedPaths
];

config.watcher = {
  ...config.watcher,
  additionalExts: config.watcher?.additionalExts,
  watchman: config.watcher?.watchman,
  healthCheck: config.watcher?.healthCheck,
  unstable_lazySha1: config.watcher?.unstable_lazySha1
};

/**
 * Default Metro config wrapped with NativeWind so Tailwind classes in
 * `src/shared/stylesheets/global.css` are processed by the bundler.
 *
 * @type {import("expo/metro-config").MetroConfig}
 */
export default withNativeWind(
  config,
  {
    input: "src/shared/stylesheets/global.css",
  }
);
