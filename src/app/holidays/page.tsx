"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function HolidaysPage() {
	const [name, setName] = useState("");
	const [date, setDate] = useState("");
	const [type, setType] = useState("PUBLIC");
	const [desc, setDesc] = useState("");
	const [repeat, setRepeat] = useState(false);
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
		const res = await fetch("/api/holidays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, date, type, description: desc, repeat }) });
		if (res.ok) {
			toast.success("Holiday added");
			setName("");
			setDate("");
			setType("PUBLIC");
			setDesc("");
			setRepeat(false);
			load();
		} else {
			const d = await res.json();
			toast.error(d.error || "Failed to add");
		}
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-foreground">Holidays</h1>
			<div className="bg-card rounded-2xl border premium-shadow p-4">
				<h3 className="font-semibold mb-3 text-foreground">Add Holiday</h3>
				<form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
					<Input placeholder="Holiday name" value={name} onChange={(e) => setName(e.target.value)} className="bg-muted text-foreground border border-border focus:bg-card md:col-span-2" />
					<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-muted text-foreground border border-border focus:bg-card" />
					<select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 rounded-xl bg-muted text-foreground border border-border focus:bg-card">
						<option value="PUBLIC">Public</option>
						<option value="COMPANY">Company</option>
						<option value="OPTIONAL">Optional</option>
					</select>
					<Input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} className="bg-muted text-foreground border border-border focus:bg-card md:col-span-2" />
					<label className="flex items-center gap-2 text-sm text-foreground">
						<input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> Repeat yearly
					</label>
					<Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-sm rounded-xl w-max justify-self-end md:col-start-6">Add</Button>
				</form>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{items.map((h) => (
					<div key={h.id} className="bg-card rounded-2xl border premium-shadow p-4">
						<div className="flex items-center justify-between mb-1">
							<div className="text-sm text-muted-foreground">{new Date(h.date).toLocaleDateString()}</div>
							<span className="px-2 py-0.5 rounded-full text-xs bg-muted text-foreground">{h.type ?? "Public"}</span>
						</div>
						<div className="text-foreground font-medium">{h.name}</div>
						{h.description ? <div className="text-sm text-muted-foreground mt-1">{h.description}</div> : null}
					</div>
				))}
			</div>
		</div>
	);
}
