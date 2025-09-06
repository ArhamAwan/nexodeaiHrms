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
import { useOnlineStatus } from "@/lib/useOnlineStatus";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const dispatch = useAppDispatch();
	
	// Start tracking online status after login
	useOnlineStatus();

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
		<div className="min-h-svh flex items-center justify-center p-4 relative">
			{/* Glass Effect Login Card */}
			<div className="w-full max-w-md relative p-8 rounded-2xl premium-shadow overflow-hidden
				glass-light
				ring-1 ring-offset-white/20 ring-white/20 ring-offset-2
				shadow-button hover:shadow-button-hover transition-all duration-300
				hover:bg-white/15 hover:border-white/40 hover:ring-white/30 hover:ring-offset-4 hover:ring-offset-black/20
				before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-shine before:pointer-events-none before:rounded-2xl
				after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/3 after:via-transparent after:to-transparent after:pointer-events-none after:rounded-2xl">
				
				<div className="relative z-10">
					<div className="mb-6 text-center">
						<h1 className="text-2xl font-bold text-white drop-shadow-lg">Welcome to HRMS</h1>
						<p className="text-white/70 text-sm drop-shadow-md">Sign in to continue</p>
					</div>
					<form onSubmit={onSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email" className="text-white drop-shadow-sm">Email</Label>
							<Input 
								id="email" 
								type="email" 
								value={email} 
								onChange={(e) => setEmail(e.target.value)} 
								required 
								className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 placeholder:text-white/50"
								placeholder="Enter your email"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password" className="text-white drop-shadow-sm">Password</Label>
							<Input 
								id="password" 
								type="password" 
								value={password} 
								onChange={(e) => setPassword(e.target.value)} 
								required 
								className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 placeholder:text-white/50"
								placeholder="Enter your password"
							/>
						</div>
						{error && <p className="text-sm text-red-300 drop-shadow-sm">{error}</p>}
						<Button 
							type="submit" 
							className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
							disabled={loading}
						>
							{loading ? "Signing in..." : "Sign in"}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
