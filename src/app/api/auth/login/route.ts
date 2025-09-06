import { NextRequest, NextResponse } from "next/server";
import { loginSchema, verifyPassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const json = await req.json();
		const parsed = loginSchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid input" }, { status: 400 });
		}
		const { email, password } = parsed.data;
		const user = await prisma.user.findUnique({ where: { email }, include: { employee: true } });
		if (!user || !verifyPassword(password, user.password)) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}
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
		return NextResponse.json({ accessToken, user: { id: user.id, email: user.email, role: user.role, employee: user.employee } }, { status: 200 });
	} catch (e) {
		console.error("/api/auth/login error", e);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
