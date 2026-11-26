import { expect, test } from "bun:test";
import {
  architecture,
  hostname,
  platform,
  tmpdir,
  uptime
} from "../../../lib/system/os.js";

test("platform, architecture, and hostname return strings", () => {
  expect(typeof platform()).toBe("string");
  expect(typeof architecture()).toBe("string");
  expect(typeof hostname()).toBe("string");
});

test("uptime returns a number", () => {
  expect(typeof uptime()).toBe("number");
});

test("tmpdir returns the system temporary directory", () => {
  expect(typeof tmpdir()).toBe("string");
  expect(tmpdir().length).toBeGreaterThan(0);
});
