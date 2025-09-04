import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth";

const PUBLIC_PATHS = [
	"/",
	"/login",
	"/api/auth/login",
	"/api/auth/register",
	"/api/auth/refresh",
	"/api/auth/logout",
];

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
		const res = NextResponse.next();
		res.headers.set("x-pathname", pathname);
		return res;
	}
	const authHeader = req.headers.get("authorization");
	const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
	let payload = token ? verifyAccessToken(token) : null;
	if (!payload) {
		const refresh = req.cookies.get("hrms_refresh")?.value;
		if (refresh) {
			payload = verifyRefreshToken(refresh);
		}
	}
	if (!payload) {
		return NextResponse.redirect(new URL("/login", req.url));
	}
	const res = NextResponse.next();
	res.headers.set("x-user-id", payload.uid);
	res.headers.set("x-user-role", payload.role);
	res.headers.set("x-pathname", pathname);
	return res;
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
