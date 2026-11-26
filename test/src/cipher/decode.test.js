import { describe, expect, test } from "bun:test";
import { decodeBase64Url, decodeHex } from "../../../src/cipher/decode.js";
import { encodeBase64Url } from "../../../src/cipher/encode.js";

/**
 * Tests for the decoding utilities.
 * @module test/cipher/decode
 */

describe("decodeBase64Url", () => {
  test("decodes a known base64url string to UTF-8 text", () => {
    expect(decodeBase64Url("aGVsbG8")).toBe("hello");
    expect(decodeBase64Url("")).toBe("");
  });

  test("round-trips UTF-8 text through the encoder", () => {
    const value = "café ☕ / + =";
    expect(decodeBase64Url(encodeBase64Url(value))).toBe(value);
  });
});

describe("decodeHex", () => {
  test("decodes byte pairs and pads odd-length input", () => {
    expect(Array.from(decodeHex("00010f10ff"))).toEqual([
      0,
      1,
      15,
      16,
      255
    ]);
    expect(Array.from(decodeHex("f"))).toEqual([15]);
  });
});
