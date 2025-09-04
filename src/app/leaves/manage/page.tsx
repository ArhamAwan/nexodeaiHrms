"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ManageLeavesPage() {
	const [items, setItems] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	async function load() {
		setLoading(true);
		const res = await fetch("/api/leaves/manage", { cache: "no-store" });
		const data = await res.json();
		setItems(data.leaves ?? []);
		setLoading(false);
	}

	useEffect(() => {
		load();
	}, []);

	async function act(id: string, action: "APPROVE" | "REJECT") {
		await fetch("/api/leaves/manage", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
		load();
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Manage Leaves</h1>
			<div className="space-y-3">
				{loading ? (
					<div>Loading...</div>
				) : items.length === 0 ? (
					<div className="text-slate-500">No pending leaves</div>
				) : (
					items.map((l) => (
						<div key={l.id} className="bg-card rounded-2xl border premium-shadow px-5 py-4 flex items-center justify-between">
							<div>
								<div className="text-sm text-muted-foreground">{l.employee?.user?.email} • {l.type}</div>
								<div className="text-foreground">{new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}</div>
							</div>
							<div className="flex gap-2">
								<Button variant="destructive" onClick={() => act(l.id, "REJECT")}>Reject</Button>
								<Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => act(l.id, "APPROVE")}>Approve</Button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
