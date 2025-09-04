import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

export async function GET() {
	const holidays = await prisma.holiday.findMany({ orderBy: { date: "asc" } });
	return NextResponse.json({ holidays });
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
