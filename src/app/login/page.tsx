"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setCredentials } from "@/store";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { connectPresence } from "@/lib/realtime";
import { toast } from "sonner";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const dispatch = useAppDispatch();

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const parsed = schema.safeParse({ email, password });
		if (!parsed.success) {
			setError("Invalid input");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Login failed");
				toast.error(data.error || "Login failed");
				return;
			}
			dispatch(setCredentials({ accessToken: data.accessToken, user: data.user }));
			if (data.user?.id) {
				connectPresence(data.user.id);
			}
			toast.success("Signed in");
			router.push("/dashboard");
		} catch (e) {
			setError("Network error");
			toast.error("Network error");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-svh flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200">
			<div className="w-full max-w-md premium-glassmorphism rounded-2xl p-8">
				<div className="mb-6 text-center">
					<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Welcome to HRMS</h1>
					<p className="text-slate-500 text-sm">Sign in to continue</p>
				</div>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					</div>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			</div>
		</div>
	);
}
