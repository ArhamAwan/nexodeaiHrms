"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector, clearCredentials } from "@/store";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search } from "lucide-react";
import { connectPresence } from "@/lib/realtime";

type NavItem = { href: string; label: string; roles?: readonly string[] };
type NavSection = { title: string; items: NavItem[] };

const navSections: NavSection[] = [
	{
		title: "Overview",
		items: [{ href: "/dashboard", label: "Dashboard" }],
	},
	{
		title: "People",
		items: [
			{ href: "/employees", label: "Employees" },
			{ href: "/holidays", label: "Holidays", roles: ["HR", "ADMIN"] as const },
		],
	},
	{
		title: "Time & Attendance",
		items: [
			{ href: "/leaves", label: "Leaves" },
			{ href: "/records", label: "Records" },
			{ href: "/leaves/manage", label: "Manage", roles: ["MANAGER", "HR", "ADMIN"] as const },
		],
	},
	{
		title: "Reports & Analytics",
		items: [
			{ href: "/reports", label: "Reports" },
			{ href: "/analytics", label: "Analytics" },
		],
	},
];

export function Shell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const user = useAppSelector((s) => s.auth.user);
	const [searchQ, setSearchQ] = useState("");

	useEffect(() => {
		if (user?.id) {
			connectPresence(user.id);
		}
	}, [user?.id]);

	const filteredSections = navSections.map((section) => ({
		title: section.title,
		items: section.items.filter((l) => !l.roles || (user?.role && (l.roles as readonly string[]).includes(user.role))),
	}));

	async function logout() {
		await fetch("/api/auth/logout", { method: "POST" });
		dispatch(clearCredentials());
		router.push("/login");
	}

	function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			const q = searchQ.trim();
			if (q) {
				router.push(`/employees?q=${encodeURIComponent(q)}`);
			}
		}
	}

	return (
		<div className="min-h-svh bg-background">
			{/* Fixed Sidebar */}
			<aside className="hidden lg:block fixed left-0 top-0 h-svh w-[260px] bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl border-r border-slate-700/50">
				<div className="p-6 border-b border-slate-700/50 anim-slide-up anim-delay-1">
					<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">HRMS</h1>
					<p className="text-slate-400 text-sm mt-1">Human Resources</p>
				</div>
				<nav className="p-4 space-y-6 pr-2 pb-28">
					{filteredSections.map((section) => (
						<div key={section.title} className="space-y-2 anim-slide-up">
							<div className="px-2 text-xs uppercase tracking-wide text-slate-400/80">{section.title}</div>
							{section.items.map((l) => (
								<Link key={l.href} href={l.href} className={`flex items-center space-x-3 p-2.5 rounded-xl hover:bg-slate-700/50 transition-all duration-200 group ${pathname.startsWith(l.href) ? "bg-slate-700/50" : ""}`}>
									<span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-400" />
									<span className="font-medium text-sm">{l.label}</span>
								</Link>
							))}
						</div>
					))}
				</nav>
				<div className="absolute bottom-4 left-4 right-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
							<span className="text-white font-semibold">{user?.email?.[0]?.toUpperCase() ?? "U"}</span>
						</div>
						<div>
							<p className="text-white font-medium truncate max-w-[140px]">{user?.email ?? "User"}</p>
							<p className="text-slate-400 text-xs">Online</p>
						</div>
					</div>
				</div>
			</aside>

			{/* Scrollable Main (accounting for fixed sidebar width) */}
			<main className="flex flex-col min-h-svh lg:ml-[260px] overflow-y-auto">
				<header className="bg-background/80 backdrop-blur-xl border-b border-border px-6 lg:px-8 py-4 sticky top-0 z-50">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
							<p className="text-muted-foreground hidden md:block">Welcome back! Here's what's happening today.</p>
						</div>
						<div className="flex items-center gap-3">
							<div className="relative hidden md:block">
								<input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={handleSearchKeyDown} className="w-64 lg:w-80 pl-10 pr-4 py-2 rounded-full border bg-muted text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 focus:bg-card transition-all" placeholder="Search employees, reports..." />
								<Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
							</div>
							<ThemeToggle />
							<NotificationBell />
							<button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-medium transition-colors">Logout</button>
						</div>
					</div>
				</header>
				<div className="p-4 lg:p-8 flex-1">{children}</div>
			</main>
		</div>
	);
}
