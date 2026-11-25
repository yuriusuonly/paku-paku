import { afterEach, describe, expect, mock, test } from "bun:test";

const originalFetch = globalThis.fetch;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("services/audit", () => {
  test("getAuditLogs fetches logs with admin token and limit", async () => {
    const payload = { logs: [{ id: "l1" }] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/audit-logs?limit=25");
      expect(options.headers.Authorization).toBe("Bearer admin");
      return jsonResponse(payload);
    });
    const { getAuditLogs } = await import("../../services/audit.js");
    await expect(getAuditLogs("admin", { limit: 25 })).resolves.toEqual(payload);
  });

  test("propagates forbidden errors", async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ error: { code: "forbidden", message: "Administrator access required." } }, 403)
    );
    const { getAuditLogs } = await import("../../services/audit.js");
    await expect(getAuditLogs("bad")).rejects.toEqual({
      status: 403,
      code: "forbidden",
      message: "Administrator access required."
    });
  });
});
