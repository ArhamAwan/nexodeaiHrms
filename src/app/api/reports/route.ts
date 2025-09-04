import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const prisma = new PrismaClient();

const schema = z.object({
	type: z.enum(["DAILY", "WEEKLY", "MONTHLY", "PROJECT", "CUSTOM"]),
	content: z.string().min(1),
});

export async function GET(_req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const reports = await prisma.report.findMany({ where: { employeeId: user.employee.id }, orderBy: { submissionDate: "desc" } });
	return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const json = await req.json();
	const parsed = schema.safeParse(json);
	if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
	const report = await prisma.report.create({ data: { employeeId: user.employee.id, type: parsed.data.type as any, content: parsed.data.content } });
	return NextResponse.json({ report }, { status: 201 });
}
