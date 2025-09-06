import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

// In Next 15, params may be async; we await it to avoid runtime warning
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: employeeId } = await params;
    
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

    // Execute all queries in parallel for better performance
    const [
      attendancePresentCount,
      attendanceRecentRaw,
      leavesAll,
      leavesRecent,
      timeLogAgg,
      recentTimeLogsRaw
    ] = await Promise.all([
      // Count days present
      prisma.attendance.count({ where: { employeeId, status: 'PRESENT' } }).catch(() => 0),
      // Recent attendance; compute hours on the fly
      prisma.attendance.findMany({
        where: { employeeId },
        orderBy: { day: 'desc' },
        take: 10,
        select: {
          day: true,
          checkIn: true,
          checkOut: true,
          status: true
        }
      }).catch(() => [] as any[]),
      // All leaves to compute total days
      prisma.leave.findMany({
        where: { employeeId },
        select: { fromDate: true, toDate: true }
      }).catch(() => [] as any[]),
      // Recent leaves for UI
      prisma.leave.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          type: true,
          fromDate: true,
          toDate: true,
          status: true,
          createdAt: true
        }
      }).catch(() => [] as any[]),
      // Aggregate time logs
      prisma.timeLog.aggregate({
        where: { employeeId, durationSec: { not: null } },
        _sum: { durationSec: true },
        _count: { _all: true }
      }).catch(() => ({ _sum: { durationSec: 0 }, _count: { _all: 0 } })),
      // Recent time logs
      prisma.timeLog.findMany({
        where: { employeeId },
        orderBy: { startTime: 'desc' },
        take: 10,
        select: {
          startTime: true,
          endTime: true,
          durationSec: true
        }
      }).catch(() => [] as any[])
    ]);

    // Compute hours for recent attendance
    const recentAttendance = attendanceRecentRaw.map((r) => {
      const hoursWorked = r.checkIn && r.checkOut ? Math.max(0, (r.checkOut.getTime() - r.checkIn.getTime()) / 3600000) : null;
      return { ...r, hoursWorked };
    });

    // Compute total leave days
    const totalLeaveDays = leavesAll.reduce((acc, l) => {
      const start = new Date(l.fromDate);
      const end = new Date(l.toDate);
      const diff = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
      return acc + diff;
    }, 0);

    const recentLeaves = leavesRecent.map((l) => ({
      type: l.type,
      startDate: l.fromDate,
      endDate: l.toDate,
      days: Math.max(0, Math.ceil((new Date(l.toDate).getTime() - new Date(l.fromDate).getTime()) / 86400000) + 1),
      status: l.status,
      reason: null,
      createdAt: l.createdAt
    }));

    const recentTimeLogs = recentTimeLogsRaw.map((t) => ({
      startTime: t.startTime,
      endTime: t.endTime,
      duration: t.durationSec ?? null,
      description: null,
      project: null
    }));

    const stats = {
      employee,
      attendance: {
        totalDays: attendancePresentCount || 0,
        totalHours: (timeLogAgg._sum.durationSec || 0) / 3600,
        recent: recentAttendance
      },
      leaves: {
        totalLeaves: leavesAll.length,
        totalDays: totalLeaveDays,
        recent: recentLeaves
      },
      timeLogs: {
        totalLogs: timeLogAgg._count._all || 0,
        totalDuration: timeLogAgg._sum.durationSec || 0,
        recent: recentTimeLogs
      }
    };

    const response = NextResponse.json(stats);
    // Cache for 2 minutes since employee stats don't change frequently
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error("/api/employees/[id]/stats error", error);
    return NextResponse.json({ error: "Failed to fetch employee stats" }, { status: 500 });
  }
}
