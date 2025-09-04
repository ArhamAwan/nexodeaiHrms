import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "./auth";

describe("auth utils", () => {
	it("hashes and verifies password", () => {
		const hash = hashPassword("secret1234");
		expect(hash).toBeTypeOf("string");
		expect(verifyPassword("secret1234", hash)).toBe(true);
		expect(verifyPassword("wrong", hash)).toBe(false);
	});

	it("signs and verifies access and refresh tokens", () => {
		const payload = { uid: "u1", role: "ADMIN" as const, sessionId: "s1" };
		const at = signAccessToken(payload, "1h");
		const rt = signRefreshToken(payload, "7d");
		expect(verifyAccessToken(at)).toMatchObject(payload);
		expect(verifyRefreshToken(rt)).toMatchObject(payload);
	});
});
