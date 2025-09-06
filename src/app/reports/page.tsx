"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Calendar, Clock, User, Filter, Search, Send, CheckCircle, AlertCircle } from "lucide-react";

export default function ReportsPage() {
	const [type, setType] = useState("DAILY");
	const [content, setContent] = useState("");
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	async function load() {
		setLoading(true);
		try {
			const res = await fetch("/api/reports", { cache: "no-store" });
			const data = await res.json();
			setItems(data.reports ?? []);
		} catch (error) {
			console.error("Failed to load reports:", error);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!content.trim()) return;
		
		setSubmitting(true);
		try {
			const res = await fetch("/api/reports", { 
				method: "POST", 
				headers: { "Content-Type": "application/json" }, 
				body: JSON.stringify({ type, content }) 
			});
			if (res.ok) {
				setContent("");
				await load();
			}
		} catch (error) {
			console.error("Failed to submit report:", error);
		} finally {
			setSubmitting(false);
		}
	}

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "DAILY": return <Calendar className="w-4 h-4" />;
			case "WEEKLY": return <Clock className="w-4 h-4" />;
			case "MONTHLY": return <FileText className="w-4 h-4" />;
			case "PROJECT": return <CheckCircle className="w-4 h-4" />;
			case "CUSTOM": return <AlertCircle className="w-4 h-4" />;
			default: return <FileText className="w-4 h-4" />;
		}
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case "DAILY": return "bg-blue-500/20 text-blue-300 border-blue-400/30";
			case "WEEKLY": return "bg-green-500/20 text-green-300 border-green-400/30";
			case "MONTHLY": return "bg-purple-500/20 text-purple-300 border-purple-400/30";
			case "PROJECT": return "bg-orange-500/20 text-orange-300 border-orange-400/30";
			case "CUSTOM": return "bg-pink-500/20 text-pink-300 border-pink-400/30";
			default: return "bg-gray-500/20 text-gray-300 border-gray-400/30";
		}
	};

	return (
		<div className="space-y-8">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
						<FileText className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-white drop-shadow-lg">Reports</h1>
						<p className="text-white/70 text-sm drop-shadow-md">Submit and manage your work reports</p>
					</div>
				</div>
				<div className="text-right">
					<div className="text-2xl font-bold text-white drop-shadow-lg">{items.length}</div>
					<div className="text-white/60 text-sm">Total Reports</div>
				</div>
			</div>

			{/* Submit Report Section */}
			<div className="space-y-4">
				<div className="flex items-center space-x-3">
					<div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
						<Plus className="w-4 h-4 text-white" />
					</div>
					<h2 className="text-xl font-semibold text-white drop-shadow-lg">Submit New Report</h2>
				</div>

				<div className="relative p-6 rounded-2xl premium-shadow overflow-hidden
					glass-light
					ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
					shadow-button hover:shadow-button-hover transition-all duration-300
					hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
					before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
					after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
					
					<form onSubmit={submit} className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="space-y-3">
								<label className="block text-sm font-medium text-white flex items-center space-x-2">
									<Filter className="w-4 h-4" />
									<span>Report Type</span>
								</label>
								<select 
									className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all" 
									value={type} 
									onChange={(e) => setType(e.target.value)}
								>
									<option value="DAILY" className="bg-gray-800 text-white">Daily Report</option>
									<option value="WEEKLY" className="bg-gray-800 text-white">Weekly Report</option>
									<option value="MONTHLY" className="bg-gray-800 text-white">Monthly Report</option>
									<option value="PROJECT" className="bg-gray-800 text-white">Project Report</option>
									<option value="CUSTOM" className="bg-gray-800 text-white">Custom Report</option>
								</select>
							</div>
							<div className="md:col-span-2 space-y-3">
								<label className="block text-sm font-medium text-white flex items-center space-x-2">
									<FileText className="w-4 h-4" />
									<span>Report Content</span>
								</label>
								<textarea 
									placeholder="Describe your work, achievements, and any important updates..." 
									className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 placeholder:text-white/50 resize-none" 
									value={content} 
									onChange={(e) => setContent(e.target.value)}
									rows={4}
									required
								/>
							</div>
						</div>
						<div className="flex justify-end pt-2">
							<Button 
								type="submit" 
								disabled={submitting || !content.trim()}
								className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{submitting ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										<span>Submitting...</span>
									</>
								) : (
									<>
										<Send className="w-4 h-4" />
										<span>Submit Report</span>
									</>
								)}
							</Button>
						</div>
					</form>
				</div>
			</div>

			{/* Reports List Section */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
							<FileText className="w-4 h-4 text-white" />
						</div>
						<h2 className="text-xl font-semibold text-white drop-shadow-lg">Recent Reports</h2>
					</div>
					<div className="text-sm text-white/60">
						{items.length} reports submitted
					</div>
				</div>

				{loading ? (
					<div className="p-8 text-center">
						<div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
							<FileText className="w-8 h-8 text-white/60 animate-pulse" />
						</div>
						<h3 className="text-lg font-medium text-white mb-2">Loading reports...</h3>
						<p className="text-white/60">Please wait while we fetch your reports</p>
					</div>
				) : items.length === 0 ? (
					<div className="p-8 text-center">
						<div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
							<FileText className="w-8 h-8 text-white/60" />
						</div>
						<h3 className="text-lg font-medium text-white mb-2">No reports yet</h3>
						<p className="text-white/60">Submit your first report to get started</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
						{items.map((r) => (
							<div key={r.id} className="relative p-6 rounded-2xl premium-shadow overflow-hidden
								glass-light
								ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
								shadow-button hover:shadow-button-hover transition-all duration-300
								hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
								before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
								after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl group">
								
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center space-x-3">
										<div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(r.type)}`}>
											{getTypeIcon(r.type)}
										</div>
										<div>
											<span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(r.type)}`}>
												{r.type}
											</span>
										</div>
									</div>
									<div className="text-right">
										<div className="text-xs text-white/60">
											{new Date(r.submissionDate).toLocaleDateString('en-US', { 
												month: 'short', 
												day: 'numeric',
												year: 'numeric'
											})}
										</div>
										<div className="text-xs text-white/50">
											{new Date(r.submissionDate).toLocaleTimeString('en-US', { 
												hour: '2-digit', 
												minute: '2-digit'
											})}
										</div>
									</div>
								</div>

								<div className="space-y-3">
									<div className="text-white leading-relaxed line-clamp-4">
										{r.content}
									</div>
									
									<div className="flex items-center justify-between pt-3 border-t border-white/10">
										<div className="flex items-center space-x-2 text-white/60">
											<User className="w-4 h-4" />
											<span className="text-sm">Submitted</span>
										</div>
										<div className="flex items-center space-x-2 text-green-400">
											<CheckCircle className="w-4 h-4" />
											<span className="text-sm font-medium">Active</span>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
