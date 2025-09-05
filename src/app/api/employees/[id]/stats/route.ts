import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const employeeId = params.id;
    
    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Get attendance stats (with fallback for empty results)
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['employeeId'],
      where: { employeeId },
      _count: { id: true },
      _sum: { hoursWorked: true }
    }).catch(() => []);

    // Get recent attendance records
    const recentAttendance = await prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { day: 'desc' },
      take: 10,
      select: {
        day: true,
        checkIn: true,
        checkOut: true,
        hoursWorked: true,
        status: true
      }
    }).catch(() => []);

    // Get leave records
    const leaveStats = await prisma.leave.groupBy({
      by: ['employeeId'],
      where: { employeeId },
      _count: { id: true },
      _sum: { days: true }
    }).catch(() => []);

    const recentLeaves = await prisma.leave.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        type: true,
        startDate: true,
        endDate: true,
        days: true,
        status: true,
        reason: true,
        createdAt: true
      }
    }).catch(() => []);

    // Get time log stats
    const timeLogStats = await prisma.timeLog.groupBy({
      by: ['employeeId'],
      where: { employeeId },
      _count: { id: true },
      _sum: { duration: true }
    }).catch(() => []);

    const recentTimeLogs = await prisma.timeLog.findMany({
      where: { employeeId },
      orderBy: { startTime: 'desc' },
      take: 10,
      select: {
        startTime: true,
        endTime: true,
        duration: true,
        description: true,
        project: true
      }
    }).catch(() => []);

    const stats = {
      employee,
      attendance: {
        totalDays: attendanceStats[0]?._count?.id || 0,
        totalHours: attendanceStats[0]?._sum?.hoursWorked || 0,
        recent: recentAttendance
      },
      leaves: {
        totalLeaves: leaveStats[0]?._count?.id || 0,
        totalDays: leaveStats[0]?._sum?.days || 0,
        recent: recentLeaves
      },
      timeLogs: {
        totalLogs: timeLogStats[0]?._count?.id || 0,
        totalDuration: timeLogStats[0]?._sum?.duration || 0,
        recent: recentTimeLogs
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("/api/employees/[id]/stats error", error);
    return NextResponse.json({ error: "Failed to fetch employee stats" }, { status: 500 });
  }
}
