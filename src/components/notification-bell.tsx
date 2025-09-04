"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
	const [items, setItems] = useState<any[]>([]);
	const [open, setOpen] = useState(false);

	async function load() {
		const res = await fetch("/api/notifications");
		const data = await res.json();
		setItems(data.notifications ?? []);
	}

	useEffect(() => {
		load();
		const id = setInterval(load, 10000);
		return () => clearInterval(id);
	}, []);

	async function markAll() {
		const unread = items.filter((i) => !i.read).map((i) => i.id);
		if (unread.length === 0) return;
		await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: unread }) });
		load();
	}

	const unreadCount = items.filter((i) => !i.read).length;

	return (
		<div className="relative">
			<Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
				🔔{unreadCount > 0 ? ` ${unreadCount}` : ""}
			</Button>
			{open && (
				<div className="absolute right-0 mt-2 w-72 bg-card border rounded shadow p-2 z-50">
					<div className="flex items-center justify-between mb-2">
						<div className="font-medium">Notifications</div>
						<Button size="sm" variant="ghost" onClick={markAll}>Mark all read</Button>
					</div>
					<div className="max-h-72 overflow-auto space-y-2">
						{items.length === 0 ? (
							<div className="text-sm text-muted-foreground">No notifications</div>
						) : items.map((n) => (
							<div key={n.id} className={`text-sm p-2 rounded ${n.read ? "opacity-70" : "bg-muted"}`}>{n.message}</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
