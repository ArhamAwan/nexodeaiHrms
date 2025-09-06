import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";

export async function GET() {
	try {
		const holidays = await prisma.holiday.findMany({ 
			orderBy: { date: "asc" },
			select: {
				id: true,
				name: true,
				date: true,
				createdAt: true
			}
		});
		
		const response = NextResponse.json({ holidays });
		// Cache holidays for 1 hour since they don't change frequently
		response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
		return response;
	} catch (error) {
		console.error("/api/holidays GET error", error);
		return NextResponse.json({ error: "Failed to load holidays" }, { status: 500 });
	}
}

const schema = z.object({ name: z.string().min(1), date: z.string() });

export async function POST(req: NextRequest) {
	const role = req.headers.get("x-user-role") as any;
	return requireRole(role, ["HR", "ADMIN"], async () => {
		const json = await req.json();
		const parsed = schema.safeParse(json);
		if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
		const created = await prisma.holiday.create({ data: { name: parsed.data.name, date: new Date(parsed.data.date) } });
		return NextResponse.json({ holiday: created }, { status: 201 });
	});
}
