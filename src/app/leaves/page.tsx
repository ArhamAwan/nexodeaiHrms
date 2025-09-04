"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

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
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-foreground">Leaves</h1>
			<div className="bg-card rounded-2xl border premium-shadow p-4">
				<h3 className="font-semibold mb-3 text-foreground">Apply Leave</h3>
				<form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
					<div className="relative">
						<select className="px-3 pr-10 py-2 w-full rounded-xl bg-muted text-foreground border border-border focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none" value={type} onChange={(e) => setType(e.target.value)}>
							<option>SICK</option>
							<option>CASUAL</option>
							<option>ANNUAL</option>
							<option>UNPAID</option>
							<option>COMP_OFF</option>
						</select>
						<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
					</div>
					<Input type="date" className="bg-muted text-foreground border border-border focus:bg-card" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
					<Input type="date" className="bg-muted text-foreground border border-border focus:bg-card" value={toDate} onChange={(e) => setToDate(e.target.value)} />
					<div />
					<Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">Apply</Button>
				</form>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{items.map((l) => (
					<div key={l.id} className="bg-card rounded-2xl border premium-shadow p-4">
						<div className="text-sm text-muted-foreground mb-1">{l.type} • {l.status}</div>
						<div className="text-foreground">{new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}</div>
					</div>
				))}
			</div>
		</div>
	);
}
