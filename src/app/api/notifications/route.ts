import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
	try {
		const user = await getCurrentUserWithEmployee();
		if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		
		const notifications = await prisma.notification.findMany({ 
			where: { userId: user.id }, 
			orderBy: { createdAt: "desc" }, 
			take: 50,
			select: {
				id: true,
				message: true,
				read: true,
				createdAt: true
			}
		});
		
		const response = NextResponse.json({ notifications });
		// Cache notifications for 30 seconds since they can change frequently
		response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
		return response;
	} catch (error) {
		console.error("/api/notifications GET error", error);
		return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
	}
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
