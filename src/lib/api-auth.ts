import { cookies } from "next/headers";
import { verifyRefreshToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserWithEmployee() {
	const cookieStore = await cookies();
	const token = cookieStore.get("hrms_refresh")?.value;
	if (!token) return null;
	const payload = verifyRefreshToken(token);
	if (!payload) return null;
	const user = await prisma.user.findUnique({ where: { id: payload.uid }, include: { employee: true } });
	return user;
}
