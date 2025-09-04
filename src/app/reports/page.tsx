"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
	const [type, setType] = useState("DAILY");
	const [content, setContent] = useState("");
	const [items, setItems] = useState<any[]>([]);

	async function load() {
		const res = await fetch("/api/reports", { cache: "no-store" });
		const data = await res.json();
		setItems(data.reports ?? []);
	}

	useEffect(() => {
		load();
	}, []);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, content }) });
		if (res.ok) {
			setContent("");
			load();
		}
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-foreground">Reports</h1>

			<div className="bg-card rounded-2xl border premium-shadow p-4">
				<h3 className="font-semibold mb-3 text-foreground">Submit Report</h3>
				<form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
					<select className="px-3 py-2 rounded-xl bg-muted text-foreground border border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-500" value={type} onChange={(e) => setType(e.target.value)}>
						<option>DAILY</option>
						<option>WEEKLY</option>
						<option>MONTHLY</option>
						<option>PROJECT</option>
						<option>CUSTOM</option>
					</select>
					<div className="md:col-span-4">
						<Input placeholder="Report content" value={content} onChange={(e) => setContent(e.target.value)} />
					</div>
					<Button type="submit" className="md:col-span-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white">Submit</Button>
				</form>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{items.map((r) => (
					<div key={r.id} className="bg-card rounded-2xl border premium-shadow p-4">
						<div className="text-sm text-muted-foreground mb-1">{r.type} • {new Date(r.submissionDate).toLocaleString()}</div>
						<div className="text-foreground">{r.content}</div>
					</div>
				))}
			</div>
		</div>
	);
}
