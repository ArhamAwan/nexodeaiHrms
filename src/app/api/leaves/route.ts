import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { z } from "zod";
import { notifyManagersOfEmployee, notifyUser } from "@/lib/notify";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const prisma = new PrismaClient();

const schema = z.object({
	type: z.enum(["SICK", "CASUAL", "ANNUAL", "UNPAID", "COMP_OFF"]),
	fromDate: z.string(),
	toDate: z.string(),
});

export async function GET(_req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const leaves = await prisma.leave.findMany({ where: { employeeId: user.employee.id }, orderBy: { createdAt: "desc" } });
	return NextResponse.json({ leaves });
}

export async function POST(req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const json = await req.json();
	const parsed = schema.safeParse(json);
	if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
	const leave = await prisma.leave.create({ data: { employeeId: user.employee.id, type: parsed.data.type as any, fromDate: new Date(parsed.data.fromDate), toDate: new Date(parsed.data.toDate) } });
	await notifyManagersOfEmployee(user.employee.id, `New leave request from ${user.email}`);
	const hrs = await prisma.user.findMany({ where: { role: { in: ["HR", "ADMIN"] as any } }, select: { id: true } });
	await Promise.all(hrs.map((u) => notifyUser(u.id, `New leave request from ${user.email}`)));
	return NextResponse.json({ leave }, { status: 201 });
}
