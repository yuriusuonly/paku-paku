import { describe, expect, test } from "bun:test";
import {
  getHomeRouteForRole,
  hasAppAccess,
  hasStaffAccess,
  isAdminRole,
  isCustomerRole,
  isStaffRole
} from "../../../../domain/auth/roles.js";

/**
 * Tests for app role rules.
 * @module test/unit/domain/auth/roles
 */

describe("auth role rules", () => {
  test("detects admin, staff, and customer roles", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("staff")).toBe(false);
    expect(isStaffRole("staff")).toBe(true);
    expect(isStaffRole("admin")).toBe(false);
    expect(isCustomerRole("customer")).toBe(true);
    expect(isCustomerRole("staff")).toBe(false);
  });

  test("allows only admin and staff into the staff area", () => {
    expect(hasStaffAccess("admin")).toBe(true);
    expect(hasStaffAccess("staff")).toBe(true);
    expect(hasStaffAccess("customer")).toBe(false);
  });

  test("allows all seeded roles to sign in", () => {
    expect(hasAppAccess("admin")).toBe(true);
    expect(hasAppAccess("staff")).toBe(true);
    expect(hasAppAccess("customer")).toBe(true);
    expect(hasAppAccess("unknown")).toBe(false);
  });

  test("maps roles to home routes", () => {
    expect(getHomeRouteForRole("admin")).toBe("/admin");
    expect(getHomeRouteForRole("staff")).toBe("/staff");
    expect(getHomeRouteForRole("customer")).toBe("/menu");
    expect(getHomeRouteForRole(null)).toBe("/menu");
  });
});
