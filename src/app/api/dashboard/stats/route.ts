import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const prisma = new PrismaClient();

export async function GET() {
	try {
		const [employees, departments, pendingLeaves] = await Promise.all([
			prisma.employee.count(),
			prisma.department.count(),
			prisma.leave.count({ where: { status: "PENDING" as any } }),
		]);

		let attendanceToday = 0;
		const user = await getCurrentUserWithEmployee();
		if (user?.employee) {
			const today = new Date();
			const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
			const att = await prisma.attendance.findUnique({ where: { employeeId_day: { employeeId: user.employee.id, day } } });
			attendanceToday = att?.checkIn ? 1 : 0;
		}

		return NextResponse.json({
			employees,
			departments,
			pendingLeaves,
			attendanceToday,
		});
	} catch (e) {
		return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
	}
}
