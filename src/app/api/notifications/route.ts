import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { z } from "zod";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
	return NextResponse.json({ notifications });
}

const schema = z.object({ ids: z.array(z.string()) });

export async function PATCH(req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const json = await req.json();
	const parsed = schema.safeParse(json);
	if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
	await prisma.notification.updateMany({ where: { id: { in: parsed.data.ids }, userId: user.id }, data: { read: true } });
	return NextResponse.json({ success: true });
}
