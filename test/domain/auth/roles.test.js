import { describe, expect, test } from "bun:test";
import { getHomeRouteForRole, hasStaffAccess, isAdminRole, isStaffRole } from "../../../src/domain/auth/roles.js";

/**
 * Tests for staff role rules.
 * @module test/domain/auth/roles
 */

describe("auth role rules", () => {
  test("detects admin and staff roles", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("staff")).toBe(false);
    expect(isStaffRole("staff")).toBe(true);
    expect(isStaffRole("admin")).toBe(false);
  });

  test("allows both roles into the staff area", () => {
    expect(hasStaffAccess("admin")).toBe(true);
    expect(hasStaffAccess("staff")).toBe(true);
    expect(hasStaffAccess("customer")).toBe(false);
  });

  test("maps roles to home routes", () => {
    expect(getHomeRouteForRole("admin")).toBe("/admin");
    expect(getHomeRouteForRole("staff")).toBe("/staff");
    expect(getHomeRouteForRole(null)).toBe("/menu");
  });
});
