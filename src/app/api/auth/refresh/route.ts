import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRefreshToken, signAccessToken } from "@/lib/auth";

export async function POST(_req: NextRequest) {
	const cookie = cookies().get("hrms_refresh");
	if (!cookie?.value) {
		return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
	}
	const payload = verifyRefreshToken(cookie.value);
	if (!payload) {
		return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
	}
	const accessToken = signAccessToken({ uid: payload.uid, role: payload.role, sessionId: payload.sessionId });
	return NextResponse.json({ accessToken }, { status: 200 });
}
