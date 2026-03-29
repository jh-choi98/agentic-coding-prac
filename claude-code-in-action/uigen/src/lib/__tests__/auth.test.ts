import { describe, test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

// Must be mocked before importing auth.ts (which imports "server-only")
vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ set: mockCookieSet })),
}));

// Import after mocks are registered
const { createSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("sets an auth-token cookie", async () => {
    await createSession("user-1", "user@example.com");

    expect(mockCookieSet).toHaveBeenCalledOnce();
    expect(mockCookieSet.mock.calls[0][0]).toBe("auth-token");
  });

  test("cookie token is a valid JWT containing userId and email", async () => {
    await createSession("user-1", "user@example.com");

    const token = mockCookieSet.mock.calls[0][1] as string;
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("user@example.com");
  });

  test("cookie options include httpOnly, lax sameSite, and root path", async () => {
    await createSession("user-1", "user@example.com");

    const options = mockCookieSet.mock.calls[0][2] as Record<string, unknown>;

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("cookie expires approximately 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-1", "user@example.com");
    const after = Date.now();

    const options = mockCookieSet.mock.calls[0][2] as Record<string, unknown>;
    const expires = (options.expires as Date).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expires).toBeGreaterThanOrEqual(before + sevenDaysMs);
    expect(expires).toBeLessThanOrEqual(after + sevenDaysMs);
  });

  test("cookie secure flag is false outside production", async () => {
    const original = process.env.NODE_ENV;
    // jsdom environment reports NODE_ENV as "test"
    await createSession("user-1", "user@example.com");

    const options = mockCookieSet.mock.calls[0][2] as Record<string, unknown>;
    expect(options.secure).toBe(false);

    process.env.NODE_ENV = original;
  });
});
