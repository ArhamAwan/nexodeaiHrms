"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, LabelList } from "recharts";
import { BarChart3, TrendingUp, Clock, Users, Activity, Calendar, Target, Award, Zap } from "lucide-react";

export default function AnalyticsPage() {
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/analytics", { cache: "no-store" });
				const json = await res.json();
				setData(json.series ?? []);
			} catch (error) {
				console.error("Failed to load analytics:", error);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	// Calculate summary statistics
	const totalHours = data.reduce((sum, item) => sum + (item.hours || 0), 0);
	const totalCheckIns = data.reduce((sum, item) => sum + (item.present || 0), 0);
	const averageHours = data.length > 0 ? (totalHours / data.length).toFixed(1) : 0;
	const averageCheckIns = data.length > 0 ? (totalCheckIns / data.length).toFixed(1) : 0;

	return (
		<div className="space-y-8">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
						<BarChart3 className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-white drop-shadow-lg">Analytics</h1>
						<p className="text-white/70 text-sm drop-shadow-md">Track performance and productivity insights</p>
					</div>
				</div>
				<div className="text-right">
					<div className="text-2xl font-bold text-white drop-shadow-lg">{data.length}</div>
					<div className="text-white/60 text-sm">Days Tracked</div>
				</div>
			</div>

			{/* Summary Statistics */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
					<div className="text-3xl font-bold text-white drop-shadow-lg">{totalHours.toFixed(1)}</div>
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
							<Users className="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-white drop-shadow-lg">Total Check-ins</h3>
							<p className="text-white/70 text-sm">Attendance records</p>
						</div>
					</div>
					<div className="text-3xl font-bold text-white drop-shadow-lg">{totalCheckIns}</div>
					<div className="text-white/60 text-sm">check-ins</div>
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
							<h3 className="text-lg font-semibold text-white drop-shadow-lg">Avg Hours/Day</h3>
							<p className="text-white/70 text-sm">Daily average</p>
						</div>
					</div>
					<div className="text-3xl font-bold text-white drop-shadow-lg">{averageHours}</div>
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
						<div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
							<Target className="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-white drop-shadow-lg">Avg Check-ins</h3>
							<p className="text-white/70 text-sm">Daily average</p>
						</div>
					</div>
					<div className="text-3xl font-bold text-white drop-shadow-lg">{averageCheckIns}</div>
					<div className="text-white/60 text-sm">per day</div>
				</div>
			</div>

			{/* Charts Section */}
			<div className="space-y-6">
				<div className="flex items-center space-x-3">
					<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
						<Activity className="w-4 h-4 text-white" />
					</div>
					<h2 className="text-xl font-semibold text-white drop-shadow-lg">Performance Charts</h2>
				</div>

				<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
					{/* Hours Chart */}
					<div className="relative p-6 rounded-2xl premium-shadow overflow-hidden
						glass-light
						ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
						shadow-button hover:shadow-button-hover transition-all duration-300
						hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
						before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
						after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
						
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
									<Clock className="w-4 h-4 text-white" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-white drop-shadow-lg">Work Hours Trend</h3>
									<p className="text-white/60 text-sm">Last 14 days</p>
								</div>
							</div>
							<div className="text-right">
								<div className="text-2xl font-bold text-blue-400">{totalHours.toFixed(1)}h</div>
								<div className="text-white/60 text-sm">Total</div>
							</div>
						</div>

						{loading ? (
							<div className="h-72 flex items-center justify-center">
								<div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
									<BarChart3 className="w-8 h-8 text-white/60 animate-pulse" />
								</div>
							</div>
						) : (
							<div className="h-72">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
										<CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
										<XAxis
											dataKey="date"
											tickLine={false}
											axisLine={false}
											tickMargin={8}
											minTickGap={32}
											tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
										/>
										<YAxis 
											domain={[0, "auto"]} 
											tickLine={false} 
											axisLine={false} 
											tickMargin={8} 
											tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} 
										/>
										<Tooltip 
											contentStyle={{ 
												backgroundColor: 'rgba(0,0,0,0.9)', 
												border: '1px solid rgba(255,255,255,0.2)', 
												borderRadius: '12px', 
												color: 'white',
												boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
											}} 
										/>
										<Line 
											dataKey="hours" 
											type="monotone" 
											stroke="#3b82f6" 
											strokeWidth={3} 
											dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} 
											activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
											name="Hours" 
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						)}
					</div>

					{/* Attendance Chart */}
					<div className="relative p-6 rounded-2xl premium-shadow overflow-hidden
						glass-light
						ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
						shadow-button hover:shadow-button-hover transition-all duration-300
						hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
						before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
						after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
						
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
									<Users className="w-4 h-4 text-white" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-white drop-shadow-lg">Attendance Records</h3>
									<p className="text-white/60 text-sm">Check-ins per day</p>
								</div>
							</div>
							<div className="text-right">
								<div className="text-2xl font-bold text-green-400">{totalCheckIns}</div>
								<div className="text-white/60 text-sm">Total</div>
							</div>
						</div>

						{loading ? (
							<div className="h-72 flex items-center justify-center">
								<div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
									<BarChart3 className="w-8 h-8 text-white/60 animate-pulse" />
								</div>
							</div>
						) : (
							<div className="h-72">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
										<CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
										<XAxis 
											dataKey="date" 
											tickLine={false} 
											axisLine={false} 
											tickMargin={8} 
											minTickGap={32} 
											tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} 
										/>
										<YAxis 
											domain={[0, "auto"]} 
											allowDecimals={false} 
											tickLine={false} 
											axisLine={false} 
											tickMargin={8} 
											tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} 
										/>
										<Tooltip 
											contentStyle={{ 
												backgroundColor: 'rgba(0,0,0,0.9)', 
												border: '1px solid rgba(255,255,255,0.2)', 
												borderRadius: '12px', 
												color: 'white',
												boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
											}} 
										/>
										<Legend wrapperStyle={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }} />
										<Bar 
											dataKey="present" 
											fill="#10b981" 
											name="Check-ins" 
											radius={[8,8,0,0]}
											stroke="#10b981"
											strokeWidth={1}
										>
											<LabelList 
												position="top" 
												className="fill-white" 
												fontSize={11} 
												formatter={(val: any) => (val > 0 ? val : "")} 
											/>
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
