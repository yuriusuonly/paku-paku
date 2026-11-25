import { describe, expect, test } from "bun:test";
import {
  ArgumentError,
  argumentError
} from "../../errors/argument.js";
import {
  ConsoleError,
  consoleError
} from "../../errors/console.js";
import {
  EnvironmentError,
  environmentError
} from "../../errors/environment.js";
import {
  IoError,
  ioError
} from "../../errors/io.js";
import { normalizeError } from "../../errors/normalize.js";
import {
  PathError,
  pathError
} from "../../errors/path.js";
import {
  ProcessError,
  processError
} from "../../errors/process.js";
import {
  UriError,
  uriError
} from "../../errors/uri.js";

/**
 * Centralized error types used by the system wrappers and their factory data.
 *
 * @type {Array<[string, Function, Function, string]>}
 */
const SYSTEM_TYPES = [
  ["ArgumentError", ArgumentError, argumentError, "argument_error"],
  ["ConsoleError", ConsoleError, consoleError, "console_error"],
  ["EnvironmentError", EnvironmentError, environmentError, "environment_error"],
  ["IoError", IoError, ioError, "io_error"],
  ["PathError", PathError, pathError, "path_error"],
  ["ProcessError", ProcessError, processError, "process_error"],
  ["UriError", UriError, uriError, "uri_error"]
];

/**
 * Tests for error normalization.
 * @module test/errors/normalize
 */

describe("normalizeError", () => {
  test("returns app errors unchanged", () => {
    const appError = Object.assign(new Error("Denied"), {
      isAppError: true,
      status: 403,
      code: "forbidden",
      expose: true
    });
    expect(normalizeError(appError)).toBe(appError);
  });

  test("wraps unknown errors as internal app errors", () => {
    const cause = new Error("boom");
    const normalized = normalizeError(cause);
    expect(normalized).toBeInstanceOf(Error);
    expect(normalized.isAppError).toBe(true);
    expect(normalized.status).toBe(500);
    expect(normalized.code).toBe("internal_error");
    expect(normalized.expose).toBe(false);
    expect(normalized.cause).toBe(cause);
  });

  test("wraps non-error thrown values", () => {
    const normalized = normalizeError("nope");
    expect(normalized.isAppError).toBe(true);
    expect(normalized.status).toBe(500);
    expect(normalized.code).toBe("internal_error");
  });

  test("passes centralized system errors through unchanged", () => {
    for (const [, , factory] of SYSTEM_TYPES) {
      const error = factory("system failure");
      expect(normalizeError(error)).toBe(error);
    }
  });
});

describe("system error factories", () => {
  test("build centralized app errors with a stable contract", () => {
    for (const [name, ErrorClass, factory, code] of SYSTEM_TYPES) {
      const cause = new Error("upstream");
      const error = factory(`message for ${name}`, cause);

      expect(error).toBeInstanceOf(ErrorClass);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe(name);
      expect(error.message).toBe(`message for ${name}`);
      expect(error.code).toBe(code);
      expect(error.status).toBe(500);
      expect(error.expose).toBe(false);
      expect(error.isAppError).toBe(true);
      expect(error.cause).toBe(cause);
    }
  });
});
