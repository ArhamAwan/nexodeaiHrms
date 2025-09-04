import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { z } from "zod";
import { notifyUser } from "@/lib/notify";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	let where: any = { status: "PENDING" };
	if (user.role === "MANAGER") {
		const reports = await prisma.employee.findMany({ where: { managerId: user.employee.id } });
		where.employeeId = { in: reports.map((r) => r.id) };
	}
	const leaves = await prisma.leave.findMany({ where, include: { employee: { include: { user: true } } }, orderBy: { createdAt: "desc" } });
	return NextResponse.json({ leaves });
}

const patchSchema = z.object({ id: z.string(), action: z.enum(["APPROVE", "REJECT"]) });

export async function PATCH(req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const json = await req.json();
	const parsed = patchSchema.safeParse(json);
	if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
	const { id, action } = parsed.data;
	const leave = await prisma.leave.update({ where: { id }, data: { status: action === "APPROVE" ? ("APPROVED" as any) : ("REJECTED" as any), approverId: user.employee.id }, include: { employee: { include: { user: true } } } });
	if (leave.employee?.user) {
		await notifyUser(leave.employee.user.id, `Your leave request was ${action === "APPROVE" ? "approved" : "rejected"}.`);
	}
	return NextResponse.json({ leave });
}
