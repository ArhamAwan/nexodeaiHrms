import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const { searchParams } = new URL(req.url);
	if (searchParams.get("detail") === "logs") {
		const logs = await prisma.timeLog.findMany({ where: { employeeId: user.employee.id }, orderBy: { startTime: "desc" }, take: 500 });
		return NextResponse.json({ logs });
	}
	const active = await prisma.timeLog.findFirst({ where: { employeeId: user.employee.id, endTime: null }, orderBy: { startTime: "desc" } });
	return NextResponse.json({ active: !!active, startTime: active?.startTime ?? null });
}

export async function POST(_req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const active = await prisma.timeLog.findFirst({ where: { employeeId: user.employee.id, endTime: null } });
	if (active) return NextResponse.json({ error: "Already running" }, { status: 400 });
	const log = await prisma.timeLog.create({ data: { employeeId: user.employee.id, startTime: new Date() } });
	return NextResponse.json({ started: true, startTime: log.startTime });
}

export async function PATCH(_req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const active = await prisma.timeLog.findFirst({ where: { employeeId: user.employee.id, endTime: null }, orderBy: { startTime: "desc" } });
	if (!active) return NextResponse.json({ error: "No active timer" }, { status: 400 });
	const endTime = new Date();
	const durationSec = Math.max(0, Math.floor((endTime.getTime() - active.startTime.getTime()) / 1000));
	await prisma.timeLog.update({ where: { id: active.id }, data: { endTime, durationSec } });
	return NextResponse.json({ stopped: true, durationSec });
}
