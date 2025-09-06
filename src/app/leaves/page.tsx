"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronDown, Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";

export default function LeavesPage() {
	const [type, setType] = useState("SICK");
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [items, setItems] = useState<any[]>([]);

	async function load() {
		const res = await fetch("/api/leaves", { cache: "no-store" });
		const data = await res.json();
		setItems(data.leaves ?? []);
	}

	useEffect(() => {
		load();
	}, []);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		const res = await fetch("/api/leaves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, fromDate, toDate }) });
		if (res.ok) {
			toast.success("Leave applied");
			setFromDate("");
			setToDate("");
			load();
		} else {
			const d = await res.json();
			toast.error(d.error || "Failed to apply");
		}
	}

	return (
		<div className="space-y-8">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
						<Calendar className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-white drop-shadow-lg">Leave Management</h1>
						<p className="text-white/70 text-sm drop-shadow-md">Apply for leaves and track your time off</p>
					</div>
				</div>
				<div className="text-right">
					<div className="text-2xl font-bold text-white drop-shadow-lg">{items.length}</div>
					<div className="text-white/60 text-sm">Total Leaves</div>
				</div>
			</div>

			{/* Apply Leave Form */}
			<div className="relative p-6 rounded-2xl premium-shadow overflow-hidden
				glass-light
				ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
				shadow-button hover:shadow-button-hover transition-all duration-300
				hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
				before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
				after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
				<div className="flex items-center space-x-3 mb-6">
					<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
						<Plus className="w-4 h-4 text-white" />
					</div>
					<h3 className="text-xl font-semibold text-white drop-shadow-lg">Apply for Leave</h3>
				</div>
				
				<form onSubmit={submit} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="space-y-3">
							<label className="block text-sm font-medium text-white drop-shadow-sm">Leave Type</label>
							<div className="relative">
								<select 
									className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 appearance-none" 
									value={type} 
									onChange={(e) => setType(e.target.value)}
								>
									<option value="SICK" className="bg-gray-800 text-white">Sick Leave</option>
									<option value="CASUAL" className="bg-gray-800 text-white">Casual Leave</option>
									<option value="ANNUAL" className="bg-gray-800 text-white">Annual Leave</option>
									<option value="UNPAID" className="bg-gray-800 text-white">Unpaid Leave</option>
									<option value="COMP_OFF" className="bg-gray-800 text-white">Compensatory Off</option>
								</select>
								<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
							</div>
						</div>
						<div className="space-y-3">
							<label className="block text-sm font-medium text-white drop-shadow-sm">From Date</label>
							<input 
								type="date" 
								className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40" 
								value={fromDate} 
								onChange={(e) => setFromDate(e.target.value)} 
							/>
						</div>
						<div className="space-y-3">
							<label className="block text-sm font-medium text-white drop-shadow-sm">To Date</label>
							<input 
								type="date" 
								className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40" 
								value={toDate} 
								onChange={(e) => setToDate(e.target.value)} 
							/>
						</div>
					</div>
					
					<div className="flex items-center justify-end pt-2">
						<Button 
							type="submit" 
							className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200"
						>
							<Plus className="w-4 h-4" />
							<span>Apply for Leave</span>
						</Button>
					</div>
				</form>
			</div>

			{/* Leave History Section */}
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
							<FileText className="w-4 h-4 text-white" />
						</div>
						<h2 className="text-xl font-semibold text-white drop-shadow-lg">Leave History</h2>
					</div>
					<div className="text-sm text-white/60">
						{items.filter(l => l.status === "PENDING").length} pending
					</div>
				</div>

				{items.length === 0 ? (
					<div className="relative p-8 rounded-2xl premium-shadow overflow-hidden text-center
						glass-light
						ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
						shadow-button
						before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
						after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
						<div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
							<Calendar className="w-8 h-8 text-white/60" />
						</div>
						<h3 className="text-lg font-medium text-white mb-2">No leave applications yet</h3>
						<p className="text-white/60">Apply for your first leave using the form above</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
						{items.map((l) => {
							const fromDate = new Date(l.fromDate);
							const toDate = new Date(l.toDate);
							const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
							
							return (
								<div key={l.id} className="relative p-6 rounded-2xl premium-shadow overflow-hidden group
									glass-light
									ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
									shadow-button hover:shadow-button-hover transition-all duration-300
									hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
									before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
									after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
									
									{/* Status Badge */}
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center space-x-2">
											{l.status === "APPROVED" && <CheckCircle className="w-4 h-4 text-green-400" />}
											{l.status === "REJECTED" && <XCircle className="w-4 h-4 text-red-400" />}
											{l.status === "PENDING" && <AlertCircle className="w-4 h-4 text-yellow-400" />}
											<span className={`px-3 py-1 rounded-full text-xs font-medium border ${
												l.status === "APPROVED" ? "bg-green-500/20 text-green-300 border-green-400/30" :
												l.status === "REJECTED" ? "bg-red-500/20 text-red-300 border-red-400/30" :
												"bg-yellow-500/20 text-yellow-300 border-yellow-400/30"
											}`}>
												{l.status}
											</span>
										</div>
										<div className="text-xs text-white/60">
											{daysDiff} day{daysDiff > 1 ? 's' : ''}
										</div>
									</div>

									{/* Leave Type */}
									<div className="mb-3">
										<span className={`px-3 py-1 rounded-full text-xs font-medium border ${
											l.type === "SICK" ? "bg-red-500/20 text-red-300 border-red-400/30" :
											l.type === "CASUAL" ? "bg-blue-500/20 text-blue-300 border-blue-400/30" :
											l.type === "ANNUAL" ? "bg-green-500/20 text-green-300 border-green-400/30" :
											l.type === "UNPAID" ? "bg-gray-500/20 text-gray-300 border-gray-400/30" :
											"bg-purple-500/20 text-purple-300 border-purple-400/30"
										}`}>
											{l.type === "SICK" ? "Sick Leave" :
											 l.type === "CASUAL" ? "Casual Leave" :
											 l.type === "ANNUAL" ? "Annual Leave" :
											 l.type === "UNPAID" ? "Unpaid Leave" :
											 "Compensatory Off"}
										</span>
									</div>

									{/* Date Range */}
									<div className="flex items-center space-x-2 mb-3">
										<Calendar className="w-4 h-4 text-white/60" />
										<span className="text-white/80 font-medium">
											{fromDate.toLocaleDateString('en-US', { 
												month: 'short', 
												day: 'numeric' 
											})} - {toDate.toLocaleDateString('en-US', { 
												month: 'short', 
												day: 'numeric',
												year: 'numeric'
											})}
										</span>
									</div>

									{/* Applied Date */}
									<div className="pt-4 border-t border-white/10">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-2">
												<Clock className="w-3 h-3 text-white/60" />
												<span className="text-xs text-white/60">
													Applied {new Date(l.createdAt || l.fromDate).toLocaleDateString()}
												</span>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
