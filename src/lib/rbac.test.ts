import { describe, it, expect } from "vitest";
import { isRoleAtLeast } from "./rbac";

describe("rbac", () => {
	it("role ordering works", () => {
		expect(isRoleAtLeast("ADMIN", "MANAGER")).toBe(true);
		expect(isRoleAtLeast("MANAGER", "HR")).toBe(true);
		expect(isRoleAtLeast("HR", "MANAGER")).toBe(false);
		expect(isRoleAtLeast("EMPLOYEE", "ADMIN")).toBe(false);
	});

	it("array allowed roles works", () => {
		expect(isRoleAtLeast("MANAGER", ["ADMIN", "MANAGER"]) ).toBe(true);
		expect(isRoleAtLeast("HR", ["ADMIN", "MANAGER"]) ).toBe(false);
	});
});
