import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";
import { getCachedResponse, setCachedResponse, generateCacheKey, getCacheTTL } from "@/lib/aggressive-cache";

export async function GET(req: NextRequest) {
	try {
		const user = await getCurrentUserWithEmployee();
		if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		
		const { searchParams } = new URL(req.url);
		if (searchParams.get("detail") === "logs") {
			// Check cache for logs
			const cacheKey = generateCacheKey(req, user.id);
			const cached = getCachedResponse(cacheKey);
			
			if (cached) {
				const response = NextResponse.json(cached.data);
				response.headers.set('ETag', cached.etag);
				response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
				return response;
			}
			
			const logs = await prisma.timeLog.findMany({ 
				where: { employeeId: user.employee.id }, 
				orderBy: { startTime: "desc" }, 
				take: 500,
				select: {
					id: true,
					startTime: true,
					endTime: true,
					durationSec: true,
					isPaused: true,
					pauseStartTime: true,
					totalPauseSec: true
				}
			});
			
			const data = { logs };
			const etag = setCachedResponse(cacheKey, data, 30000); // 30 seconds cache
			
			const response = NextResponse.json(data);
			response.headers.set('ETag', etag);
			response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
			return response;
		}
		
		// For active timer, use very short cache (5 seconds)
		const cacheKey = generateCacheKey(req, user.id);
		const cached = getCachedResponse(cacheKey);
		
		if (cached) {
			const response = NextResponse.json(cached.data);
			response.headers.set('ETag', cached.etag);
			response.headers.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10');
			return response;
		}
		
		const active = await prisma.timeLog.findFirst({ 
			where: { 
				employeeId: user.employee.id, 
				endTime: null 
			}, 
			orderBy: { startTime: "desc" },
			select: {
				startTime: true,
				isPaused: true,
				pauseStartTime: true,
				totalPauseSec: true
			}
		});
		
		let data;
		if (!active) {
			data = { active: false, startTime: null, isPaused: false };
		} else {
			// Calculate current elapsed time including pauses
			let elapsedSec = 0;
			if (active.isPaused && active.pauseStartTime) {
				// Timer is paused, calculate time up to pause
				elapsedSec = Math.max(0, Math.floor((active.pauseStartTime.getTime() - active.startTime.getTime()) / 1000)) - active.totalPauseSec;
			} else {
				// Timer is running, calculate current time
				elapsedSec = Math.max(0, Math.floor((new Date().getTime() - active.startTime.getTime()) / 1000)) - active.totalPauseSec;
			}
			
			data = { 
				active: true, 
				startTime: active.startTime, 
				isPaused: active.isPaused,
				elapsedSec: Math.max(0, elapsedSec)
			};
		}
		
		// Cache for 5 seconds only
		const etag = setCachedResponse(cacheKey, data, 5000);
		
		const response = NextResponse.json(data);
		response.headers.set('ETag', etag);
		response.headers.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10');
		return response;
	} catch (error) {
		console.error("/api/time GET error", error);
		return NextResponse.json({ error: "Failed to load time data" }, { status: 500 });
	}
}

export async function POST(_req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const active = await prisma.timeLog.findFirst({ where: { employeeId: user.employee.id, endTime: null } });
	if (active) return NextResponse.json({ error: "Already running" }, { status: 400 });
	const log = await prisma.timeLog.create({ data: { employeeId: user.employee.id, startTime: new Date() } });
	return NextResponse.json({ started: true, startTime: log.startTime });
}

export async function PATCH(req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	
	const body = await req.json().catch(() => ({}));
	const { action } = body;
	
	const active = await prisma.timeLog.findFirst({ where: { employeeId: user.employee.id, endTime: null }, orderBy: { startTime: "desc" } });
	if (!active) return NextResponse.json({ error: "No active timer" }, { status: 400 });
	
	if (action === "pause") {
		// Pause the timer
		if (active.isPaused) {
			return NextResponse.json({ error: "Timer is already paused" }, { status: 400 });
		}
		
		const now = new Date();
		const pauseDuration = active.pauseStartTime ? 
			Math.floor((now.getTime() - active.pauseStartTime.getTime()) / 1000) : 0;
		
		await prisma.timeLog.update({ 
			where: { id: active.id }, 
			data: { 
				isPaused: true,
				pauseStartTime: now,
				totalPauseSec: active.totalPauseSec + pauseDuration
			} 
		});
		return NextResponse.json({ paused: true });
		
	} else if (action === "resume") {
		// Resume the timer
		if (!active.isPaused) {
			return NextResponse.json({ error: "Timer is not paused" }, { status: 400 });
		}
		
		const now = new Date();
		const pauseDuration = active.pauseStartTime ? 
			Math.floor((now.getTime() - active.pauseStartTime.getTime()) / 1000) : 0;
		
		await prisma.timeLog.update({ 
			where: { id: active.id }, 
			data: { 
				isPaused: false,
				pauseStartTime: null,
				totalPauseSec: active.totalPauseSec + pauseDuration
			} 
		});
		return NextResponse.json({ resumed: true });
		
	} else {
		// Stop the timer completely
		const endTime = new Date();
		let totalWorkSec = Math.floor((endTime.getTime() - active.startTime.getTime()) / 1000);
		
		// Subtract total pause time to get actual work time
		const finalPauseSec = active.isPaused && active.pauseStartTime ? 
			active.totalPauseSec + Math.floor((endTime.getTime() - active.pauseStartTime.getTime()) / 1000) :
			active.totalPauseSec;
		
		const durationSec = Math.max(0, totalWorkSec - finalPauseSec);
		
		await prisma.timeLog.update({ 
			where: { id: active.id }, 
			data: { 
				endTime, 
				durationSec,
				isPaused: false,
				pauseStartTime: null,
				totalPauseSec: finalPauseSec
			} 
		});
		return NextResponse.json({ stopped: true, durationSec });
	}
}
