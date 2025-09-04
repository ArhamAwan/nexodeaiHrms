import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

export const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	role: z.enum(["ADMIN", "HR", "EMPLOYEE", "MANAGER"]).optional(),
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

export type JwtPayload = {
	uid: string;
	role: "ADMIN" | "HR" | "EMPLOYEE" | "MANAGER";
	sessionId: string;
};

const accessSecret = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

export function hashPassword(password: string): string {
	const salt = bcrypt.genSaltSync(10);
	return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, hash: string): boolean {
	return bcrypt.compareSync(password, hash);
}

export function signAccessToken(payload: JwtPayload, expiresIn = "15m"): string {
	return jwt.sign(payload, accessSecret, { expiresIn });
}

export function signRefreshToken(payload: JwtPayload, expiresIn = "7d"): string {
	return jwt.sign(payload, refreshSecret, { expiresIn });
}

export function verifyAccessToken(token: string): JwtPayload | null {
	try {
		return jwt.verify(token, accessSecret) as JwtPayload;
	} catch {
		return null;
	}
}

export function verifyRefreshToken(token: string): JwtPayload | null {
	try {
		return jwt.verify(token, refreshSecret) as JwtPayload;
	} catch {
		return null;
	}
}
