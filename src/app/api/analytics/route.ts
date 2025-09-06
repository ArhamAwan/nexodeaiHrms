import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";
import { getCachedResponse, setCachedResponse, generateCacheKey, getCacheTTL } from "@/lib/aggressive-cache";

export async function GET(req: NextRequest) {
	try {
		const user = await getCurrentUserWithEmployee();
		if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		// Check cache first
		const cacheKey = generateCacheKey(req, user.id);
		const cached = getCachedResponse(cacheKey);
		
		if (cached) {
			const response = NextResponse.json(cached.data);
			response.headers.set('ETag', cached.etag);
			response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=240');
			return response;
		}

		const end = new Date();
		const start = new Date();
		start.setDate(end.getDate() - 13);

		// Run queries in parallel for better performance
		const [logs, attendance] = await Promise.all([
			prisma.timeLog.findMany({
				where: { employeeId: user.employee.id, startTime: { gte: start, lte: end } },
				orderBy: { startTime: "asc" },
				select: {
					startTime: true,
					endTime: true,
					durationSec: true
				}
			}),
			prisma.attendance.findMany({
				where: { 
					employeeId: user.employee.id, 
					day: { 
						gte: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())), 
						lte: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())) 
					} 
				},
				select: {
					day: true,
					checkIn: true
				}
			})
		]);

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

		const responseData = { series: Object.values(data) };
		
		// Cache the response
		const etag = setCachedResponse(cacheKey, responseData, getCacheTTL('/api/analytics'));
		
		const response = NextResponse.json(responseData);
		response.headers.set('ETag', etag);
		response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=240');
		return response;
	} catch (error) {
		console.error("/api/analytics GET error", error);
		return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
	}
}
