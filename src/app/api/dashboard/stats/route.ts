import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";
import { getCachedResponse, setCachedResponse, generateCacheKey, getCacheTTL } from "@/lib/aggressive-cache";

export async function GET(req: NextRequest) {
	try {
		// Check cache first
		const user = await getCurrentUserWithEmployee();
		const cacheKey = generateCacheKey(req, user?.id);
		const cached = getCachedResponse(cacheKey);
		
		if (cached) {
			const response = NextResponse.json(cached.data);
			response.headers.set('ETag', cached.etag);
			response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
			return response;
		}
		
		// Run all queries in parallel for maximum speed
		const [employees, departments, pendingLeaves, attendanceToday] = await Promise.all([
			prisma.employee.count(),
			prisma.department.count(),
			prisma.leave.count({ where: { status: "PENDING" as any } }),
			// Get attendance in parallel
			user?.employee ? (async () => {
				const today = new Date();
				const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
				const att = await prisma.attendance.findUnique({ 
					where: { employeeId_day: { employeeId: user.employee.id, day } },
					select: { checkIn: true }
				});
				return att?.checkIn ? 1 : 0;
			})() : Promise.resolve(0)
		]);

		const data = {
			employees,
			departments,
			pendingLeaves,
			attendanceToday,
		};

		// Cache the response
		const etag = setCachedResponse(cacheKey, data, getCacheTTL('/api/dashboard/stats'));
		
		const response = NextResponse.json(data);
		response.headers.set('ETag', etag);
		response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
		return response;
	} catch (error) {
		console.error("/api/dashboard/stats GET error", error);
		return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
	}
}
