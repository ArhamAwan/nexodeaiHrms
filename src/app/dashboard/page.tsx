"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Play, Pause, Coffee, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { deduplicatedFetch } from "@/lib/cache";
import LazyChart from "@/components/LazyChart";
import TimerReportModal from "@/components/TimerReportModal";

export default function DashboardPage() {
	const [stats, setStats] = useState<{ employees: number; departments: number; pendingLeaves: number; attendanceToday: number } | null>(null);
	const [timer, setTimer] = useState<{ active: boolean; startTime: string | null; isPaused: boolean; elapsedSec: number }>({ 
		active: false, 
		startTime: null, 
		isPaused: false, 
		elapsedSec: 0 
	});
	const [elapsed, setElapsed] = useState<number>(0);
	const [checking, setChecking] = useState(false);
	const [timing, setTiming] = useState(false);
	const [showReportModal, setShowReportModal] = useState(false);
	const [pendingStopData, setPendingStopData] = useState<{ durationSec: number } | null>(null);
	const [loading, setLoading] = useState(true);
	const [series, setSeries] = useState<any[]>([]);
	const [timeRange, setTimeRange] = useState<"90d" | "30d" | "7d">("90d");
	const [holidays, setHolidays] = useState<any[]>([]);
	const [myLeaves, setMyLeaves] = useState<any[]>([]);
	const [calendarDate, setCalendarDate] = useState<Date>(new Date());

	const loadAll = useCallback(async () => {
		try {
			// Load critical data first
			const [stats, time, analytics] = await Promise.all([
				deduplicatedFetch("/api/dashboard/stats", { credentials: "include" }),
				deduplicatedFetch("/api/time", { credentials: "include" }),
				deduplicatedFetch("/api/analytics", { credentials: "include" })
			]);
			
			setStats(stats);
			setTimer({ 
				active: !!time.active, 
				startTime: time.startTime ?? null, 
				isPaused: time.isPaused ?? false,
				elapsedSec: time.elapsedSec ?? 0
			});
			setSeries(analytics.series ?? []);
			setLoading(false);
			
			// Load non-critical data in background
			Promise.all([
				deduplicatedFetch("/api/holidays", { credentials: "include" }).then(h => setHolidays(h.holidays ?? [])).catch(() => {}),
				deduplicatedFetch("/api/leaves", { credentials: "include" }).then(l => setMyLeaves(Array.isArray(l.leaves) ? l.leaves : [])).catch(() => {})
			]);
		} catch (error) {
			console.error("Failed to load dashboard:", error);
			toast.error("Failed to load dashboard data");
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// update elapsed every second when active and not paused
	useEffect(() => {
		let rafId: number | null = null;
		if (timer.active && timer.startTime && !timer.isPaused) {
			const start = new Date(timer.startTime as string).getTime();
			const loop = () => {
				const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
				setElapsed(diff);
				rafId = requestAnimationFrame(loop);
			};
			rafId = requestAnimationFrame(loop);
		} else if (timer.active && timer.isPaused) {
			// Timer is paused, use the elapsed time from the server
			setElapsed(timer.elapsedSec);
		} else {
			setElapsed(0);
		}
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, [timer.active, timer.startTime, timer.isPaused, timer.elapsedSec]);

	const elapsedHms = useMemo(() => {
		const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
		const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
		const s = String(elapsed % 60).padStart(2, "0");
		return `${h}:${m}:${s}`;
	}, [elapsed]);

	const circumference = 2 * Math.PI * 100; // r used in timer svg
	const progress = Math.min(1, elapsed / (8 * 3600));
	const dashoffset = circumference * (1 - progress);

	// Endpoint dot position for progress ring
	const center = 112;
	const radius = 100;
	const angle = progress * 2 * Math.PI - Math.PI / 2; // normalized to -90deg start
	const dotX = center + radius * Math.cos(angle);
	const dotY = center + radius * Math.sin(angle);

	const Skeleton = () => <div className="rounded-2xl h-32 bg-muted/40 border border-border animate-pulse" />;

	const calendarMeta = useMemo(() => {
		const year = calendarDate.getFullYear();
		const monthIndex = calendarDate.getMonth();
		const monthStart = new Date(year, monthIndex, 1);
		const monthEnd = new Date(year, monthIndex + 1, 0);
		const startDay = monthStart.getDay();
		const daysInMonth = monthEnd.getDate();
		const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
		return { year, monthIndex, monthStart, monthEnd, startDay, daysInMonth, days };
	}, [calendarDate]);

	const monthLabel = useMemo(() => {
		return calendarDate.toLocaleString(undefined, { month: "long", year: "numeric" });
	}, [calendarDate]);

	const holidayKeys = useMemo(() => {
		const set = new Set<string>();
		for (const h of holidays) {
			const d = new Date(h.date);
			const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
			set.add(key);
		}
		return set;
	}, [holidays]);

	const leaveKeys = useMemo(() => {
		const set = new Set<string>();
		for (const l of myLeaves) {
			const from = new Date(l.fromDate);
			const to = new Date(l.toDate);
			const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate());
			while (cur <= to) {
				set.add(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()).toISOString().slice(0, 10));
				cur.setDate(cur.getDate() + 1);
			}
		}
		return set;
	}, [myLeaves]);

	const filteredSeries = useMemo(() => {
		const refDate = series.length ? new Date(series[series.length - 1].date) : new Date();
		const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
		const start = new Date(refDate);
		start.setDate(start.getDate() - days);
		return (series || []).filter((d) => new Date(d.date) >= start);
	}, [series, timeRange]);

	return (
		<div className="space-y-8">
			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{loading ? (
					<>
						<Skeleton />
						<Skeleton />
						<Skeleton />
						<Skeleton />
					</>
				) : (
					<>
						<div className="relative p-6 rounded-2xl premium-hover-lift group anim-scale-in overflow-hidden
							glass-light
							ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
							shadow-button hover:shadow-button-hover transition-all duration-300
							hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
							before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
							after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform" />
								<span className="text-blue-400 text-sm font-medium drop-shadow-md">↗ 12%</span>
							</div>
							<h3 className="text-white font-semibold text-sm mb-1 drop-shadow-lg">Total Employees</h3>
							<p className="text-3xl font-bold text-white drop-shadow-lg">{stats?.employees ?? 0}</p>
							<p className="text-white/80 text-xs drop-shadow-md">+2 this month</p>
						</div>

						<div className="relative p-6 rounded-2xl premium-hover-lift group anim-scale-in anim-delay-1 overflow-hidden
							glass-light
							ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
							shadow-button hover:shadow-button-hover transition-all duration-300
							hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
							before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
							after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform" />
								<span className="text-blue-400 text-sm font-medium drop-shadow-md">New</span>
							</div>
							<h3 className="text-white font-semibold text-sm mb-1 drop-shadow-lg">Departments</h3>
							<p className="text-3xl font-bold text-white drop-shadow-lg">{stats?.departments ?? 0}</p>
							<p className="text-white/80 text-xs drop-shadow-md">Setup required</p>
						</div>

						<div className="relative p-6 rounded-2xl premium-hover-lift group anim-scale-in anim-delay-2 overflow-hidden
							glass-light
							ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
							shadow-button hover:shadow-button-hover transition-all duration-300
							hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
							before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
							after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-amber-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform" />
								<span className="text-amber-400 text-sm font-medium drop-shadow-md">Urgent</span>
							</div>
							<h3 className="text-white font-semibold text-sm mb-1 drop-shadow-lg">Pending Leaves</h3>
							<p className="text-3xl font-bold text-white drop-shadow-lg"><Link href="/leaves/manage" className="hover:underline text-white">{stats?.pendingLeaves ?? 0}</Link></p>
							<p className="text-white/80 text-xs drop-shadow-md">All caught up!</p>
						</div>

						<div className="relative p-6 rounded-2xl premium-hover-lift group anim-scale-in anim-delay-3 overflow-hidden
							glass-light
							ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
							shadow-button hover:shadow-button-hover transition-all duration-300
							hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
							before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
							after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform" />
								<span className="text-emerald-400 text-sm font-medium drop-shadow-md">100%</span>
							</div>
							<h3 className="text-white font-semibold text-sm mb-1 drop-shadow-lg">Attendance Today</h3>
							<p className="text-3xl font-bold mb-2 text-white drop-shadow-lg">{stats?.attendanceToday ?? 0}</p>
							<div className="flex justify-between items-center">
								<p className="text-white/80 text-xs drop-shadow-md">Present: {stats?.attendanceToday ?? 0}</p>
								<button onClick={handleCheck} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors">{checking ? "Updating..." : "Check-in"}</button>
							</div>
						</div>
					</>
				)}
			</div>

			{/* Work Timer premium widget + Quick Actions */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="relative p-8 rounded-3xl text-foreground anim-slide-up overflow-hidden
					glass-light
					ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
					shadow-button hover:shadow-button-hover transition-all duration-300
					hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
					before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-3xl
					after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-3xl">
					<div className="text-center">
						<h3 className="font-semibold mb-2 text-white drop-shadow-lg">Work Timer</h3>
						<p className="text-white/80 text-sm mb-6 drop-shadow-md">Track your productive hours</p>
						<div className="relative w-56 h-56 mx-auto mb-8 anim-scale-in">
							<svg className="w-56 h-56 -rotate-90" aria-hidden>
								<defs>
									<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
										<stop offset="0%" stopColor="#2563eb" />
										<stop offset="100%" stopColor="#2563eb" />
									</linearGradient>
									<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
										<feGaussianBlur stdDeviation="4" result="coloredBlur" />
										<feMerge>
											<feMergeNode in="coloredBlur" />
											<feMergeNode in="SourceGraphic" />
										</feMerge>
									</filter>
								</defs>
								{/* Background track */}
								<circle className="text-slate-300 dark:text-white/20" cx="112" cy="112" r="100" fill="none" stroke="currentColor" strokeWidth="10" />
								{/* Glow under progress */}
								<circle cx="112" cy="112" r="100" fill="none" stroke="url(#gradient)" strokeWidth="16" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashoffset} opacity={0.25} filter="url(#glow)" />
								{/* Progress arc */}
								<circle cx="112" cy="112" r="100" fill="none" stroke="url(#gradient)" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashoffset} />
							</svg>
							{/* Endpoint dot */}
							<div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: dotX, top: dotY }}>
								<div className="h-3 w-3 rounded-full" style={{ background: "linear-gradient(90deg,#3b82f6,#8b5cf6)" }} />
							</div>
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="text-center">
									<div className="text-5xl md:text-6xl font-bold font-mono tracking-widest text-white drop-shadow-lg">{elapsedHms}</div>
									<div className="text-white/80 text-sm mt-1 drop-shadow-md">
										{timer.active ? (timer.isPaused ? "Paused" : "Working") : "Ready"}
									</div>
								</div>
							</div>
						</div>
						<div className="flex justify-center gap-4">
							<button onClick={handleTimer} className={`px-8 py-3 rounded-full font-semibold transition-all duration-200 inline-flex items-center gap-2 ${timer.active ? "bg-red-500 hover:bg-red-600 text-white shadow-lg" : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"}`}>{timer.active ? (<><Pause className="h-4 w-4" /> Stop</>) : (<><Play className="h-4 w-4" /> Start</>)}</button>
							<button 
								onClick={handleBreak} 
								disabled={!timer.active || timing}
								className={`px-6 py-3 rounded-full font-semibold border border-border inline-flex items-center gap-2 transition-all duration-200 ${
									!timer.active || timing 
										? "bg-muted/50 text-muted-foreground cursor-not-allowed" 
										: timer.isPaused
											? "bg-green-500 hover:bg-green-600 text-white shadow-lg"
											: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
								}`}
							>
								{timer.isPaused ? (
									<><Play className="h-4 w-4" /> Resume</>
								) : (
									<><Coffee className="h-4 w-4" /> Break</>
								)}
							</button>
						</div>
					</div>
				</div>

				<div className="relative p-6 rounded-2xl premium-shadow anim-slide-up anim-delay-1 overflow-hidden
					glass-light
					ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
					shadow-button hover:shadow-button-hover transition-all duration-300
					hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
					before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
					after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
					<h3 className="text-white font-semibold mb-2 drop-shadow-lg">Quick Actions</h3>
					<div className="grid grid-cols-2 gap-4">
						<Link href="/employees" className="p-4 bg-white/5 border border-white/20 rounded-xl transition-colors premium-hover-lift block anim-scale-in backdrop-blur-sm hover:bg-white/10">
							<div className="w-10 h-10 bg-blue-600 rounded-lg mb-3" />
							<div className="font-semibold text-white drop-shadow-md">Add Employee</div>
							<div className="text-white/80 text-sm drop-shadow-sm">Onboard new team member</div>
						</Link>
						<Link href="/reports" className="p-4 bg-white/5 border border-white/20 rounded-xl transition-colors premium-hover-lift block anim-scale-in anim-delay-1 backdrop-blur-sm hover:bg-white/10">
							<div className="w-10 h-10 bg-blue-600 rounded-lg mb-3" />
							<div className="font-semibold text-white drop-shadow-md">Generate Report</div>
							<div className="text-white/80 text-sm drop-shadow-sm">Export attendance data</div>
						</Link>
					</div>

					{/* Inline Calendar */}
					<div className="mt-6">
						<div className="flex items-center justify-between mb-3">
							<button
								onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
								className="p-2 rounded-md border border-white/20 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm"
								aria-label="Previous month"
							>
								<ChevronLeft className="h-4 w-4 text-white" />
							</button>
							<div className="text-sm font-medium text-white drop-shadow-md">{monthLabel}</div>
							<button
								onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
								className="p-2 rounded-md border border-white/20 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm"
								aria-label="Next month"
							>
								<ChevronRight className="h-4 w-4 text-white" />
							</button>
						</div>
						<div className="grid grid-cols-7 gap-2 text-center text-xs text-white/80 drop-shadow-sm">
							<div>Sun</div>
							<div>Mon</div>
							<div>Tue</div>
							<div>Wed</div>
							<div>Thu</div>
							<div>Fri</div>
							<div>Sat</div>
						</div>
						<div className="mt-2 grid grid-cols-7 gap-2">
							{/* leading blanks */}
							{Array.from({ length: calendarMeta.startDay }).map((_, i) => (
								<div key={`b-${i}`} className="h-10 rounded-md border border-transparent" />
							))}
							{calendarMeta.days.map((d) => {
								const isToday = (() => {
									const now = new Date();
									return (
										now.getDate() === d &&
										now.getMonth() === calendarMeta.monthIndex &&
										now.getFullYear() === calendarMeta.year
									);
								})();
								const key = new Date(calendarMeta.year, calendarMeta.monthIndex, d).toISOString().slice(0, 10);
								const isHoliday = holidayKeys.has(key);
								const isLeave = leaveKeys.has(key);
								return (
									<div
										key={d}
										className={`h-10 flex items-center justify-center rounded-md border text-sm ${isToday ? "bg-blue-600 text-white border-blue-600" : isHoliday ? "bg-emerald-600/20 border-emerald-600/40" : isLeave ? "bg-amber-500/20 border-amber-500/40" : "bg-white/5 border-white/20"} text-white drop-shadow-sm`}
									>
										{d}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* Activity Area Chart (interactive) */}
			<div className="relative p-6 rounded-2xl premium-shadow overflow-hidden
				glass-light
				ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
				shadow-button hover:shadow-button-hover transition-all duration-300
				hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
				before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
				after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-white font-semibold drop-shadow-lg">Weekly Activity</h3>
					<select
						value={timeRange}
						onChange={(e) => setTimeRange(e.target.value as any)}
						className="rounded-lg border border-white/30 bg-white/10 text-white px-3 py-1 text-sm backdrop-blur-sm"
					>
						<option value="90d">Last 3 months</option>
						<option value="30d">Last 30 days</option>
						<option value="7d">Last 7 days</option>
					</select>
				</div>
				<LazyChart data={filteredSeries} timeRange={timeRange} />
			</div>

			{/* Timer Report Modal */}
			<TimerReportModal
				isOpen={showReportModal}
				onClose={() => {
					// Don't allow closing without submitting report
					toast.warning("Please submit a report to stop the timer");
				}}
				onSubmit={handleReportSubmit}
				workDuration={pendingStopData?.durationSec || 0}
			/>
		</div>
	);

	async function handleCheck() {
		setChecking(true);
		try {
			const res = await fetch("/api/attendance/check", { method: "POST", credentials: "include", cache: "no-store" });
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Check-in failed");
			}
			await res.json();
			toast.success("Attendance updated");
			
			// Only update attendance stats, not the entire dashboard
			try {
				const statsRes = await fetch("/api/dashboard/stats", { credentials: "include", cache: "no-store" });
				if (statsRes.ok) {
					const statsData = await statsRes.json();
					setStats(statsData);
				}
			} catch (error) {
				console.error("Failed to update stats:", error);
			}
		} catch (e: any) {
			toast.error(e?.message || "Check-in failed");
		} finally {
			setChecking(false);
		}
	}

	async function handleTimer() {
		setTiming(true);
		try {
			if (!timer.active) {
				// Start timer - update UI immediately for better responsiveness
				setTimer({ active: true, startTime: new Date().toISOString(), isPaused: false, elapsedSec: 0 });
				toast.success("Timer started");
				
				// Make API call in background
				const res = await fetch("/api/time", { method: "POST", credentials: "include", cache: "no-store" });
				if (!res.ok) {
					// Revert UI state if API call failed
					setTimer({ active: false, startTime: null, isPaused: false, elapsedSec: 0 });
					throw new Error("Failed to start timer");
				}
				const data = await res.json();
				// Update with actual server time
				setTimer({ active: true, startTime: data.startTime, isPaused: false, elapsedSec: 0 });
			} else {
				// Stop timer - but first require a report
				const res = await fetch("/api/time", { 
					method: "PATCH", 
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "stop" }),
					credentials: "include", 
					cache: "no-store" 
				});
				if (!res.ok) throw new Error("Failed to stop timer");
				const data = await res.json();
				
				// Show report modal instead of immediately stopping
				setPendingStopData({ durationSec: data.durationSec });
				setShowReportModal(true);
			}
		} catch (e: any) {
			toast.error(e?.message || "Timer error");
		} finally {
			setTiming(false);
		}
	}

	async function handleReportSubmit(report: { type: string; content: string }) {
		try {
			// Submit the report
			const res = await fetch("/api/reports", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(report)
			});
			
			if (!res.ok) {
				throw new Error("Failed to submit report");
			}
			
			// Now actually stop the timer UI
			setTimer({ active: false, startTime: null, isPaused: false, elapsedSec: 0 });
			setShowReportModal(false);
			setPendingStopData(null);
			
			const minutes = Math.floor((pendingStopData?.durationSec || 0) / 60);
			toast.success(`Timer stopped! Worked for ${minutes} minutes and report submitted`);
		} catch (error) {
			console.error("Error submitting report:", error);
			throw error; // Re-throw so modal can handle it
		}
	}

	async function handleBreak() {
		setTiming(true);
		try {
			if (timer.isPaused) {
				// Resume timer - update UI immediately
				setTimer({ ...timer, isPaused: false });
				toast.success("Timer resumed");
				
				// Make API call in background
				const res = await fetch("/api/time", { 
					method: "PATCH", 
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "resume" }),
					credentials: "include", 
					cache: "no-store" 
				});
				if (!res.ok) {
					// Revert UI state if API call failed
					setTimer({ ...timer, isPaused: true });
					throw new Error("Failed to resume timer");
				}
			} else {
				// Pause timer - update UI immediately
				setTimer({ ...timer, isPaused: true });
				toast.success("Timer paused - taking a break");
				
				// Make API call in background
				const res = await fetch("/api/time", { 
					method: "PATCH", 
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "pause" }),
					credentials: "include", 
					cache: "no-store" 
				});
				if (!res.ok) {
					// Revert UI state if API call failed
					setTimer({ ...timer, isPaused: false });
					throw new Error("Failed to pause timer");
				}
			}
		} catch (e: any) {
			toast.error(e?.message || "Break error");
		} finally {
			setTiming(false);
		}
	}
}
