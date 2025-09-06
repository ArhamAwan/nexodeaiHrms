"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
	const [items, setItems] = useState<any[]>([]);
	const [open, setOpen] = useState(false);

	async function load() {
		try {
			const res = await fetch("/api/notifications", { credentials: "include" });
			if (!res.ok) {
				if (res.status === 401) {
					// User not authenticated, clear notifications
					setItems([]);
					return;
				}
				// Log the error but don't throw to prevent UI crashes
				console.error(`Notifications API returned ${res.status}:`, await res.text().catch(() => 'Unknown error'));
				setItems([]);
				return;
			}
			const data = await res.json();
			setItems(data.notifications ?? []);
		} catch (error) {
			console.error("Failed to load notifications:", error);
			setItems([]);
		}
	}

	useEffect(() => {
		load();
		// Poll notifications every 60 seconds (reduced from 10s)
		const id = setInterval(load, 60000);
		return () => clearInterval(id);
	}, []);

	async function markAll() {
		const unread = items.filter((i) => !i.read).map((i) => i.id);
		if (unread.length === 0) return;
		try {
			await fetch("/api/notifications", { 
				method: "PATCH", 
				headers: { "Content-Type": "application/json" }, 
				body: JSON.stringify({ ids: unread }),
				credentials: "include"
			});
			load();
		} catch (error) {
			console.error("Failed to mark notifications as read:", error);
		}
	}

	const unreadCount = items.filter((i) => !i.read).length;

	return (
		<div className="relative">
			<Button 
				variant="secondary" 
				size="sm" 
				onClick={() => setOpen((o) => !o)}
				className="glass-light text-white border border-white/30 hover:bg-white/10 transition-all duration-200"
			>
				<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
				</svg>
				{unreadCount > 0 && (
					<span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
						{unreadCount}
					</span>
				)}
			</Button>
			{open && (
				<div className="absolute right-0 mt-2 w-72 rounded-xl shadow-button z-50
					glass-light
					ring-1 ring-offset-white/20 ring-white/20 ring-offset-2 
					before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-xl
					after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-xl">
					<div className="relative p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="font-medium text-white drop-shadow-lg">Notifications</div>
							<Button 
								size="sm" 
								variant="ghost" 
								onClick={markAll}
								className="text-white/80 hover:text-white hover:bg-white/10"
							>
								Mark all read
							</Button>
						</div>
						<div className="max-h-72 overflow-auto space-y-2">
							{items.length === 0 ? (
								<div className="text-sm text-white/60">No notifications</div>
							) : items.map((n) => (
								<div 
									key={n.id} 
									className={`text-sm p-3 rounded-lg transition-all duration-200 ${
										n.read 
											? "text-white/70 bg-white/5" 
											: "text-white bg-white/10 border border-white/20"
									}`}
								>
									{n.message}
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
