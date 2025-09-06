"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Plus, Clock, Users, Star, Gift } from "lucide-react";

export default function HolidaysPage() {
	const [name, setName] = useState("");
	const [date, setDate] = useState("");
	const [items, setItems] = useState<any[]>([]);

	async function load() {
		const res = await fetch("/api/holidays", { cache: "no-store" });
		const data = await res.json();
		setItems(data.holidays ?? []);
	}

	useEffect(() => {
		load();
	}, []);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		const res = await fetch("/api/holidays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, date }) });
		if (res.ok) {
			toast.success("Holiday added");
			setName("");
			setDate("");
			load();
		} else {
			const d = await res.json();
			toast.error(d.error || "Failed to add");
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
						<h1 className="text-3xl font-bold text-white drop-shadow-lg">Holidays</h1>
						<p className="text-white/70 text-sm drop-shadow-md">Manage company holidays and special events</p>
					</div>
				</div>
				<div className="text-right">
					<div className="text-2xl font-bold text-white drop-shadow-lg">{items.length}</div>
					<div className="text-white/60 text-sm">Total Holidays</div>
				</div>
			</div>

			{/* Add Holiday Form */}
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
					<h3 className="text-xl font-semibold text-white drop-shadow-lg">Add New Holiday</h3>
				</div>
				
				<form onSubmit={submit} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-3">
							<label className="block text-sm font-medium text-white drop-shadow-sm">Holiday Name</label>
							<input 
								placeholder="e.g., New Year's Day" 
								value={name} 
								onChange={(e) => setName(e.target.value)} 
								className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 placeholder:text-white/50" 
								required
							/>
						</div>
						<div className="space-y-3">
							<label className="block text-sm font-medium text-white drop-shadow-sm">Date</label>
							<input 
								type="date" 
								value={date} 
								onChange={(e) => setDate(e.target.value)} 
								className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40" 
								required
							/>
						</div>
					</div>
					
					<div className="flex justify-end pt-2">
						<Button 
							type="submit" 
							className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200"
						>
							<Plus className="w-4 h-4" />
							<span>Add Holiday</span>
						</Button>
					</div>
				</form>
			</div>
			{/* Holidays List Section */}
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
							<Gift className="w-4 h-4 text-white" />
						</div>
						<h2 className="text-xl font-semibold text-white drop-shadow-lg">Upcoming Holidays</h2>
					</div>
					<div className="text-sm text-white/60">
						{items.filter(h => new Date(h.date) >= new Date()).length} upcoming
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
						<h3 className="text-lg font-medium text-white mb-2">No holidays added yet</h3>
						<p className="text-white/60">Add your first holiday using the form above</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
						{items.map((h) => {
							const holidayDate = new Date(h.date);
							const isUpcoming = holidayDate >= new Date();
							const isToday = holidayDate.toDateString() === new Date().toDateString();
							
							return (
								<div key={h.id} className="relative p-6 rounded-2xl premium-shadow overflow-hidden group
									glass-light
									ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
									shadow-button hover:shadow-button-hover transition-all duration-300
									hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
									before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
									after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
									
									{/* Holiday Type Badge */}
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center space-x-2">
											{h.type === "PUBLIC" && <Users className="w-4 h-4 text-blue-400" />}
											{h.type === "COMPANY" && <Star className="w-4 h-4 text-yellow-400" />}
											{h.type === "OPTIONAL" && <Clock className="w-4 h-4 text-green-400" />}
											<span className={`px-3 py-1 rounded-full text-xs font-medium border ${
												h.type === "PUBLIC" ? "bg-blue-500/20 text-blue-300 border-blue-400/30" :
												h.type === "COMPANY" ? "bg-yellow-500/20 text-yellow-300 border-yellow-400/30" :
												"bg-green-500/20 text-green-300 border-green-400/30"
											}`}>
												{h.type === "PUBLIC" ? "Public" : h.type === "COMPANY" ? "Company" : "Optional"}
											</span>
										</div>
										{isToday && (
											<div className="px-2 py-1 bg-red-500/20 text-red-300 border border-red-400/30 rounded-full text-xs font-medium">
												Today
											</div>
										)}
									</div>

									{/* Holiday Name */}
									<h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/90 transition-colors">
										{h.name}
									</h3>

									{/* Date */}
									<div className="flex items-center space-x-2 mb-3">
										<Calendar className="w-4 h-4 text-white/60" />
										<span className="text-white/80 font-medium">
											{holidayDate.toLocaleDateString('en-US', { 
												weekday: 'long', 
												year: 'numeric', 
												month: 'long', 
												day: 'numeric' 
											})}
										</span>
									</div>

									{/* Holiday Date */}
									<div className="mt-2">
										<p className="text-white/70 text-sm">
											{h.date ? new Date(h.date).toLocaleDateString('en-US', { 
												weekday: 'long',
												year: 'numeric', 
												month: 'long', 
												day: 'numeric' 
											}) : 'Date not set'}
										</p>
									</div>

									{/* Status Indicator */}
									<div className="mt-4 pt-4 border-t border-white/10">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-2">
												<div className={`w-2 h-2 rounded-full ${
													isUpcoming ? "bg-green-400 animate-pulse" : "bg-gray-400"
												}`} />
												<span className="text-xs text-white/60">
													{isUpcoming ? "Upcoming" : "Past"}
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
