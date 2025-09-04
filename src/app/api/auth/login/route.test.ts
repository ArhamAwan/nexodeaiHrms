import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import bcrypt from "bcryptjs";

vi.mock("@/generated/prisma", () => {
	class PrismaClient {
		user = {
			findUnique: vi.fn(),
		};
	}
	// @ts-ignore
	return { PrismaClient };
});

vi.mock("next/headers", () => ({
	cookies: async () => ({ set: vi.fn() }),
}));

const { PrismaClient } = await import("@/generated/prisma");

describe("auth login route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 200 and accessToken on valid credentials", async () => {
		// Arrange
		const password = "Password123!";
		const hash = bcrypt.hashSync(password, 10);
		// @ts-ignore
		PrismaClient.prototype.user.findUnique.mockResolvedValue({ id: "u1", email: "admin@hrms.local", password: hash, role: "ADMIN" });
		const req = new Request("http://localhost/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "admin@hrms.local", password }),
		});

		// Act
		// @ts-ignore
		const res = await POST(req);
		const body = await res.json();

		// Assert
		expect(res.status).toBe(200);
		expect(body.accessToken).toBeTypeOf("string");
	});

	it("returns 401 on invalid credentials", async () => {
		// @ts-ignore
		PrismaClient.prototype.user.findUnique.mockResolvedValue(null);
		const req = new Request("http://localhost/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "admin@hrms.local", password: "wrong" }),
		});
		// @ts-ignore
		const res = await POST(req);
		const body = await res.json();
		expect(res.status).toBe(401);
		expect(body.error).toBeDefined();
	});
});
