import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerSchema, hashPassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import crypto from "node:crypto";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
	try {
		const json = await req.json();
		const parsed = registerSchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
		}
		const { email, password, firstName, lastName, role } = parsed.data;

		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return NextResponse.json({ error: "Email already in use" }, { status: 409 });
		}

		const user = await prisma.user.create({
			data: {
				email,
				password: hashPassword(password),
				role: (role as any) ?? "EMPLOYEE",
				employee: { create: { firstName, lastName } },
			},
			include: { employee: true },
		});

		const sessionId = crypto.randomUUID();
		const payload = { uid: user.id, role: user.role as any, sessionId };
		const accessToken = signAccessToken(payload);
		const refreshToken = signRefreshToken(payload);

		const cookieStore = await cookies();
		cookieStore.set("hrms_refresh", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 7,
		});

		return NextResponse.json({ accessToken, user: { id: user.id, email: user.email, role: user.role, employee: user.employee } }, { status: 201 });
	} catch (err) {
		console.error("/api/auth/register error", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
