import { describe, expect, test } from "bun:test";
import {
  encodeBase64Url,
  encodeHex
} from "../../cipher/encode.js";

/**
 * Tests for the encoding utilities.
 * @module test/cipher/encode
 */

describe("encodeBase64Url", () => {
  test("encodes UTF-8 text without padding or URL-unsafe characters", () => {
    expect(encodeBase64Url("hello")).toBe("aGVsbG8");
    expect(encodeBase64Url("")).toBe("");
    expect(encodeBase64Url("café ☕")).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("encodeHex", () => {
  test("pads each byte to two lowercase hex digits", () => {
    const bytes = new Uint8Array([
      0,
      1,
      15,
      16,
      255
    ]);
    expect(encodeHex(bytes)).toBe("00010f10ff");
    expect(encodeHex(new Uint8Array())).toBe("");
  });
});
