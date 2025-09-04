import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const prisma = new PrismaClient();

export async function POST(_req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const today = new Date();
	const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
	let attendance = await prisma.attendance.findUnique({ where: { employeeId_day: { employeeId: user.employee.id, day } } });
	if (!attendance) {
		attendance = await prisma.attendance.create({ data: { employeeId: user.employee.id, day, checkIn: new Date() } });
		return NextResponse.json({ status: "checked_in", attendance });
	}
	if (!attendance.checkOut) {
		attendance = await prisma.attendance.update({ where: { id: attendance.id }, data: { checkOut: new Date() } });
		return NextResponse.json({ status: "checked_out", attendance });
	}
	return NextResponse.json({ status: "already_completed", attendance });
}
