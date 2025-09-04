import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  const actives = await prisma.timeLog.findMany({
    where: { endTime: null },
    select: { employeeId: true, startTime: true, employee: { select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } } } },
    orderBy: { startTime: "desc" },
  });
  const now = Date.now();
  const data = actives.map((a) => ({
    employeeId: a.employeeId,
    name: `${a.employee.firstName} ${a.employee.lastName}`.trim(),
    email: a.employee.user?.email ?? "",
    startTime: a.startTime,
    elapsedSec: Math.max(0, Math.floor((now - a.startTime.getTime()) / 1000)),
  }));
  return NextResponse.json({ active: data });
}


