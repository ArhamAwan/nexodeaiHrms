import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const end = new Date();
	const start = new Date();
	start.setDate(end.getDate() - 13);

	const logs = await prisma.timeLog.findMany({
		where: { employeeId: user.employee.id, startTime: { gte: start, lte: end } },
		orderBy: { startTime: "asc" },
	});

	const attendance = await prisma.attendance.findMany({
		where: { employeeId: user.employee.id, day: { gte: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())), lte: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())) } },
	});

	const dayKey = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
	const data: Record<string, { date: string; hours: number; present: number } > = {};
	for (let i = 0; i < 14; i++) {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		const k = dayKey(d);
		data[k] = { date: k, hours: 0, present: 0 };
	}

	for (const log of logs) {
		const k = dayKey(log.startTime);
		const sec = log.durationSec ?? (log.endTime ? Math.floor((log.endTime.getTime() - log.startTime.getTime()) / 1000) : 0);
		data[k].hours += sec / 3600;
	}
	for (const att of attendance) {
		const k = dayKey(att.day);
		if (data[k]) data[k].present += att.checkIn ? 1 : 0;
	}

	return NextResponse.json({ series: Object.values(data) });
}
