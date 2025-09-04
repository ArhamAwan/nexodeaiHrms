"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, LabelList } from "recharts";

export default function AnalyticsPage() {
	const [data, setData] = useState<any[]>([]);

	useEffect(() => {
		(async () => {
			const res = await fetch("/api/analytics", { cache: "no-store" });
			const json = await res.json();
			setData(json.series ?? []);
		})();
	}, []);

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Analytics</h1>
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
				<div className="bg-card p-6 rounded-2xl border premium-shadow">
					<h2 className="font-medium mb-2">Hours (last 14 days)</h2>
					<div className="h-72">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={data} margin={{ left: 12, right: 12 }}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="date"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={32}
								/>
								<YAxis domain={[0, "auto"]} tickLine={false} axisLine={false} tickMargin={8} />
								<Tooltip />
								<Line dataKey="hours" type="monotone" stroke="#2563eb" strokeWidth={2} dot={false} name="Hours" />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
				<div className="bg-card p-6 rounded-2xl border premium-shadow">
					<h2 className="font-medium mb-2">Attendance (check-ins)</h2>
					<div className="h-72">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
								<CartesianGrid vertical={false} strokeDasharray="3 3" />
								<XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
								<YAxis domain={[0, "auto"]} allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
								<Tooltip />
								<Legend />
								<Bar dataKey="present" fill="#16a34a" name="Check-ins" radius={[6,6,0,0]}>
									<LabelList position="top" className="fill-foreground" fontSize={12} formatter={(val: any) => (val > 0 ? val : "")} />
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
}
