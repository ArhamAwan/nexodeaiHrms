"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Play, Pause, Coffee, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { deduplicatedFetch } from "@/lib/cache";
import LazyChart from "@/components/LazyChart";

export default function DashboardPage() {
	const [stats, setStats] = useState<{ employees: number; departments: number; pendingLeaves: number; attendanceToday: number } | null>(null);
	const [timer, setTimer] = useState<{ active: boolean; startTime: string | null }>({ active: false, startTime: null });
	const [elapsed, setElapsed] = useState<number>(0);
	const [checking, setChecking] = useState(false);
	const [timing, setTiming] = useState(false);
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
			setTimer({ active: !!time.active, startTime: time.startTime ?? null });
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

	// update elapsed every second when active
	useEffect(() => {
		let rafId: number | null = null;
		if (timer.active && timer.startTime) {
			const start = new Date(timer.startTime as string).getTime();
			const loop = () => {
				const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
				setElapsed(diff);
				rafId = requestAnimationFrame(loop);
			};
			rafId = requestAnimationFrame(loop);
		} else {
			setElapsed(0);
		}
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, [timer.active, timer.startTime]);

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
						<div className="bg-card p-6 rounded-2xl border premium-hover-lift group anim-scale-in">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform" />
								<span className="text-blue-500 text-sm font-medium">↗ 12%</span>
							</div>
							<h3 className="text-foreground font-semibold text-sm mb-1">Total Employees</h3>
							<p className="text-3xl font-bold">{stats?.employees ?? 0}</p>
							<p className="text-muted-foreground text-xs">+2 this month</p>
						</div>

						<div className="bg-card p-6 rounded-2xl border premium-hover-lift group anim-scale-in anim-delay-1">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform" />
								<span className="text-purple-400 text-sm font-medium">New</span>
							</div>
							<h3 className="text-foreground font-semibold text-sm mb-1">Departments</h3>
							<p className="text-3xl font-bold">{stats?.departments ?? 0}</p>
							<p className="text-muted-foreground text-xs">Setup required</p>
						</div>

						<div className="bg-card p-6 rounded-2xl border premium-hover-lift group anim-scale-in anim-delay-2">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-amber-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform" />
								<span className="text-amber-400 text-sm font-medium">Urgent</span>
							</div>
							<h3 className="text-foreground font-semibold text-sm mb-1">Pending Leaves</h3>
							<p className="text-3xl font-bold"><Link href="/leaves/manage" className="hover:underline">{stats?.pendingLeaves ?? 0}</Link></p>
							<p className="text-muted-foreground text-xs">All caught up!</p>
						</div>

						<div className="bg-card p-6 rounded-2xl border premium-hover-lift group anim-scale-in anim-delay-3">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform" />
								<span className="text-emerald-400 text-sm font-medium">100%</span>
							</div>
							<h3 className="text-foreground font-semibold text-sm mb-1">Attendance Today</h3>
							<p className="text-3xl font-bold mb-2">{stats?.attendanceToday ?? 0}</p>
							<div className="flex justify-between items-center">
								<p className="text-muted-foreground text-xs">Present: {stats?.attendanceToday ?? 0}</p>
								<button onClick={handleCheck} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors">{checking ? "Updating..." : "Check-in"}</button>
							</div>
						</div>
					</>
				)}
			</div>

			{/* Work Timer premium widget + Quick Actions */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-card p-8 rounded-3xl shadow-xl border premium-hover-lift text-foreground anim-slide-up">
					<div className="text-center">
						<h3 className="font-semibold mb-2">Work Timer</h3>
						<p className="text-muted-foreground text-sm mb-6">Track your productive hours</p>
						<div className="relative w-56 h-56 mx-auto mb-8 anim-scale-in">
							<svg className="w-56 h-56 -rotate-90" aria-hidden>
								<defs>
									<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
										<stop offset="0%" stopColor="#3b82f6" />
										<stop offset="100%" stopColor="#8b5cf6" />
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
									<div className="text-5xl md:text-6xl font-bold font-mono tracking-widest text-slate-900 dark:text-white">{elapsedHms}</div>
									<div className="text-slate-500 dark:text-slate-300 text-sm mt-1">{timer.active ? "Working" : "Ready"}</div>
								</div>
							</div>
						</div>
						<div className="flex justify-center gap-4">
							<button onClick={handleTimer} className={`px-8 py-3 rounded-full font-semibold transition-all duration-200 inline-flex items-center gap-2 ${timer.active ? "bg-red-500 hover:bg-red-600 text-white shadow-lg" : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"}`}>{timer.active ? (<><Pause className="h-4 w-4" /> Stop</>) : (<><Play className="h-4 w-4" /> Start</>)}</button>
							<button className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-full font-semibold border border-border inline-flex items-center gap-2"><Coffee className="h-4 w-4" /> Break</button>
						</div>
					</div>
				</div>

				<div className="bg-card p-6 rounded-2xl border premium-shadow anim-slide-up anim-delay-1">
					<h3 className="text-foreground font-semibold mb-2">Quick Actions</h3>
					<div className="grid grid-cols-2 gap-4">
						<Link href="/employees" className="p-4 bg-card border rounded-xl transition-colors premium-hover-lift block anim-scale-in">
							<div className="w-10 h-10 bg-blue-500 rounded-lg mb-3" />
							<div className="font-semibold text-foreground">Add Employee</div>
							<div className="text-muted-foreground text-sm">Onboard new team member</div>
						</Link>
						<Link href="/reports" className="p-4 bg-card border rounded-xl transition-colors premium-hover-lift block anim-scale-in anim-delay-1">
							<div className="w-10 h-10 bg-purple-500 rounded-lg mb-3" />
							<div className="font-semibold text-foreground">Generate Report</div>
							<div className="text-muted-foreground text-sm">Export attendance data</div>
						</Link>
					</div>

					{/* Inline Calendar */}
					<div className="mt-6">
						<div className="flex items-center justify-between mb-3">
							<button
								onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
								className="p-2 rounded-md border bg-card hover:bg-muted transition-colors"
								aria-label="Previous month"
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<div className="text-sm font-medium text-foreground">{monthLabel}</div>
							<button
								onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
								className="p-2 rounded-md border bg-card hover:bg-muted transition-colors"
								aria-label="Next month"
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
						<div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
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
										className={`h-10 flex items-center justify-center rounded-md border text-sm ${isToday ? "bg-blue-600 text-white border-blue-600" : isHoliday ? "bg-emerald-600/20 border-emerald-600/40" : isLeave ? "bg-amber-500/20 border-amber-500/40" : "bg-card border-border"} text-foreground`}
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
			<div className="bg-card p-6 rounded-2xl border premium-shadow">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-foreground font-semibold">Weekly Activity</h3>
					<select
						value={timeRange}
						onChange={(e) => setTimeRange(e.target.value as any)}
						className="rounded-lg border bg-card text-foreground px-3 py-1 text-sm"
					>
						<option value="90d">Last 3 months</option>
						<option value="30d">Last 30 days</option>
						<option value="7d">Last 7 days</option>
					</select>
				</div>
				<LazyChart data={filteredSeries} timeRange={timeRange} />
			</div>
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
			await loadAll();
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
				const res = await fetch("/api/time", { method: "POST", credentials: "include", cache: "no-store" });
				if (!res.ok) throw new Error("Failed to start timer");
				const data = await res.json();
				setTimer({ active: true, startTime: data.startTime });
				toast.success("Timer started");
			} else {
				const res = await fetch("/api/time", { method: "PATCH", credentials: "include", cache: "no-store" });
				if (!res.ok) throw new Error("Failed to stop timer");
				setTimer({ active: false, startTime: null });
				toast.success("Timer stopped");
			}
		} catch (e: any) {
			toast.error(e?.message || "Timer error");
		} finally {
			setTiming(false);
		}
	}
}
