export type UserRole = "ADMIN" | "HR" | "EMPLOYEE" | "MANAGER";

export function isRoleAtLeast(role: UserRole, required: UserRole | UserRole[]): boolean {
	const order: UserRole[] = ["EMPLOYEE", "HR", "MANAGER", "ADMIN"];
	const userRank = order.indexOf(role);
	const requiredRoles = Array.isArray(required) ? required : [required];
	return requiredRoles.some((r) => userRank >= order.indexOf(r));
}

export function requireRole<T>(role: UserRole, allowed: UserRole | UserRole[], onPass: () => Promise<T> | T): Promise<T> | T {
	if (!isRoleAtLeast(role, allowed)) {
		throw new Error("FORBIDDEN");
	}
	return onPass();
}
