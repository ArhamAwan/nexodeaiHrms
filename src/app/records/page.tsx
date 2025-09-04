"use client";

import { useEffect, useMemo, useState } from "react";

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

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Records</h1>
			<div className="bg-card p-6 rounded-2xl border premium-shadow">
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-medium">Time Logs</h2>
					<div className="text-sm text-muted-foreground">Total Hours: <span className="text-foreground font-semibold">{totalHours}</span></div>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-muted-foreground border-b">
								<th className="py-2">Start</th>
								<th className="py-2">End</th>
								<th className="py-2">Duration</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td className="py-4" colSpan={3}>Loading...</td></tr>
							) : rows.length === 0 ? (
								<tr><td className="py-4 text-muted-foreground" colSpan={3}>No records</td></tr>
							) : (
								rows.map((r, i) => {
									const start = new Date(r.startTime);
									const end = r.endTime ? new Date(r.endTime) : null;
									const sec = r.durationSec ?? (end ? Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000)) : 0);
									const hh = Math.floor(sec / 3600);
									const mm = Math.floor((sec % 3600) / 60);
									return (
										<tr key={i} className="border-b border-border/60">
											<td className="py-2">{start.toLocaleString()}</td>
											<td className="py-2">{end ? end.toLocaleString() : <span className="text-amber-500">Running</span>}</td>
											<td className="py-2">{hh}h {mm}m</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}


