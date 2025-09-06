"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Calendar, Play, Pause, BarChart3, TrendingUp, Timer, Activity } from "lucide-react";

type Row = {
	startTime: string;
	endTime: string | null;
	durationSec: number | null;
};

export default function RecordsPage() {
	const [rows, setRows] = useState<Row[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/analytics", { cache: "no-store" });
				// For now reuse analytics endpoint for totals and then fetch detailed logs
				// We create a lightweight detailed fetch to the same API route soon if needed
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/time?detail=logs", { cache: "no-store", credentials: "include" });
				if (res.ok) {
					const json = await res.json();
					setRows(json.logs ?? []);
				}
			} catch {}
		})();
	}, []);

	const totalHours = useMemo(() => {
		const totalSec = rows.reduce((acc, r) => acc + (r.durationSec ?? 0), 0);
		return (totalSec / 3600).toFixed(2);
	}, [rows]);

	const totalMinutes = useMemo(() => {
		const totalSec = rows.reduce((acc, r) => acc + (r.durationSec ?? 0), 0);
		return Math.floor(totalSec / 60);
	}, [rows]);

	const totalSessions = rows.length;
	const averageSession = totalSessions > 0 ? Math.floor(totalMinutes / totalSessions) : 0;

	return (
		<div className="space-y-8">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
						<BarChart3 className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-white drop-shadow-lg">Time Records</h1>
						<p className="text-white/70 text-sm drop-shadow-md">Track your work sessions and productivity</p>
					</div>
				</div>
				<div className="text-right">
					<div className="text-2xl font-bold text-white drop-shadow-lg">{totalSessions}</div>
					<div className="text-white/60 text-sm">Total Sessions</div>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="relative p-6 rounded-2xl premium-shadow overflow-hidden
					glass-light
					ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
					shadow-button hover:shadow-button-hover transition-all duration-300
					hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
					before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
					after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
					<div className="flex items-center space-x-3 mb-4">
						<div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
							<Clock className="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-white drop-shadow-lg">Total Hours</h3>
							<p className="text-white/70 text-sm">All time logged</p>
						</div>
					</div>
					<div className="text-3xl font-bold text-white drop-shadow-lg">{totalHours}</div>
					<div className="text-white/60 text-sm">hours</div>
				</div>

				<div className="relative p-6 rounded-2xl premium-shadow overflow-hidden
					glass-light
					ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
					shadow-button hover:shadow-button-hover transition-all duration-300
					hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
					before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
					after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
					<div className="flex items-center space-x-3 mb-4">
						<div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
							<Activity className="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-white drop-shadow-lg">Total Sessions</h3>
							<p className="text-white/70 text-sm">Work sessions</p>
						</div>
					</div>
					<div className="text-3xl font-bold text-white drop-shadow-lg">{totalSessions}</div>
					<div className="text-white/60 text-sm">sessions</div>
				</div>

				<div className="relative p-6 rounded-2xl premium-shadow overflow-hidden
					glass-light
					ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
					shadow-button hover:shadow-button-hover transition-all duration-300
					hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
					before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
					after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
					<div className="flex items-center space-x-3 mb-4">
						<div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
							<TrendingUp className="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-white drop-shadow-lg">Average Session</h3>
							<p className="text-white/70 text-sm">Per session</p>
						</div>
					</div>
					<div className="text-3xl font-bold text-white drop-shadow-lg">{averageSession}</div>
					<div className="text-white/60 text-sm">minutes</div>
				</div>
			</div>

			{/* Time Logs Table */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
							<Timer className="w-4 h-4 text-white" />
						</div>
						<h2 className="text-xl font-semibold text-white drop-shadow-lg">Time Logs</h2>
					</div>
					<div className="text-sm text-white/60">
						{rows.length} total entries
					</div>
				</div>

				<div className="relative rounded-2xl premium-shadow overflow-hidden
					glass-light
					ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
					shadow-button hover:shadow-button-hover transition-all duration-300
					hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
					before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
					after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
					
					{loading ? (
						<div className="p-8 text-center">
							<div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
								<Clock className="w-8 h-8 text-white/60 animate-spin" />
							</div>
							<h3 className="text-lg font-medium text-white mb-2">Loading time logs...</h3>
							<p className="text-white/60">Please wait while we fetch your records</p>
						</div>
					) : rows.length === 0 ? (
						<div className="p-8 text-center">
							<div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
								<Clock className="w-8 h-8 text-white/60" />
							</div>
							<h3 className="text-lg font-medium text-white mb-2">No time logs yet</h3>
							<p className="text-white/60">Start tracking your time to see records here</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-white/20">
										<th className="text-left py-4 px-6 text-white/80 font-semibold">Session</th>
										<th className="text-left py-4 px-6 text-white/80 font-semibold">Start Time</th>
										<th className="text-left py-4 px-6 text-white/80 font-semibold">End Time</th>
										<th className="text-left py-4 px-6 text-white/80 font-semibold">Duration</th>
										<th className="text-left py-4 px-6 text-white/80 font-semibold">Status</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((r, i) => {
										const start = new Date(r.startTime);
										const end = r.endTime ? new Date(r.endTime) : null;
										const sec = r.durationSec ?? (end ? Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000)) : 0);
										const hh = Math.floor(sec / 3600);
										const mm = Math.floor((sec % 3600) / 60);
										const ss = sec % 60;
										const isRunning = !end;
										
										return (
											<tr key={i} className="border-b border-white/10 hover:bg-white/5 transition-colors group">
												<td className="py-4 px-6">
													<div className="flex items-center space-x-3">
														<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
															<span className="text-white font-semibold text-sm">#{i + 1}</span>
														</div>
														<div>
															<div className="text-white font-medium">Session {i + 1}</div>
															<div className="text-white/60 text-xs">
																{start.toLocaleDateString('en-US', { 
																	month: 'short', 
																	day: 'numeric',
																	year: 'numeric'
																})}
															</div>
														</div>
													</div>
												</td>
												<td className="py-4 px-6">
													<div className="flex items-center space-x-2">
														<Play className="w-4 h-4 text-green-400" />
														<span className="text-white font-mono text-sm">
															{start.toLocaleTimeString('en-US', { 
																hour: '2-digit', 
																minute: '2-digit',
																second: '2-digit'
															})}
														</span>
													</div>
												</td>
												<td className="py-4 px-6">
													{end ? (
														<div className="flex items-center space-x-2">
															<Pause className="w-4 h-4 text-red-400" />
															<span className="text-white font-mono text-sm">
																{end.toLocaleTimeString('en-US', { 
																	hour: '2-digit', 
																	minute: '2-digit',
																	second: '2-digit'
																})}
															</span>
														</div>
													) : (
														<div className="flex items-center space-x-2">
															<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
															<span className="text-green-400 font-medium">Running</span>
														</div>
													)}
												</td>
												<td className="py-4 px-6">
													<div className="flex items-center space-x-2">
														<Timer className="w-4 h-4 text-blue-400" />
														<span className="text-white font-mono text-sm">
															{hh > 0 ? `${hh}h ` : ''}{mm}m {ss}s
														</span>
													</div>
												</td>
												<td className="py-4 px-6">
													<span className={`px-3 py-1 rounded-full text-xs font-medium border ${
														isRunning 
															? "bg-green-500/20 text-green-300 border-green-400/30" 
															: "bg-blue-500/20 text-blue-300 border-blue-400/30"
													}`}>
														{isRunning ? "Active" : "Completed"}
													</span>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}


