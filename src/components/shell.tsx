"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector, clearCredentials } from "@/store";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search } from "lucide-react";
import { connectPresence } from "@/lib/realtime";
import ProfileEditModal from "./ProfileEditModal";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

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
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

	        useEffect(() => {
            if (user?.id) {
                connectPresence(user.id);
            }
        }, [user?.id]);

        // Track online status
        useOnlineStatus();

	const filteredSections = navSections.map((section) => ({
		title: section.title,
		items: section.items.filter((l) => !l.roles || (user?.role && (l.roles as readonly string[]).includes(user.role))),
	}));

	        async function logout() {
            try {
                // Mark user as offline
                await fetch("/api/users/online", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ sessionId: "logout" })
                });
            } catch (error) {
                console.error("Failed to set offline status:", error);
            }
            
            await fetch("/api/auth/logout", { method: "POST" });
            dispatch(clearCredentials());
            router.push("/login");
        }

	function handleProfileUpdate(updatedUser: any) {
		// Update the user in the store
		dispatch({ type: "auth/setUser", payload: updatedUser });
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
		<div className="min-h-svh">
			{/* Fixed Sidebar */}
			<aside className="hidden lg:block fixed left-0 top-0 h-svh w-[280px] text-white shadow-2xl border-r border-white/20 glass-light">
				{/* Header Section */}
				<div className="p-6 border-b border-white/20 anim-slide-up anim-delay-1">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
							<span className="text-white font-bold text-lg">H</span>
						</div>
						<div>
							<h1 className="text-xl font-bold text-white drop-shadow-lg">HRMS</h1>
							<p className="text-white/70 text-xs drop-shadow-sm">Human Resources</p>
						</div>
					</div>
				</div>
				
				{/* Navigation Section */}
				<nav className="flex-1 p-4 space-y-8 overflow-y-auto">
					{filteredSections.map((section, sectionIndex) => (
						<div key={section.title} className="space-y-3 anim-slide-up" style={{ animationDelay: `${(sectionIndex + 1) * 100}ms` }}>
							<div className="px-3 text-xs font-semibold uppercase tracking-wider text-white/50 drop-shadow-sm">
								{section.title}
							</div>
							<div className="space-y-1">
								{section.items.map((l, itemIndex) => (
									<Link 
										key={l.href} 
										href={l.href} 
										className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
											pathname.startsWith(l.href) 
												? "bg-white/15 text-white shadow-sm" 
												: "text-white/80 hover:bg-white/8 hover:text-white"
										}`}
									>
										{/* Active indicator */}
										{pathname.startsWith(l.href) && (
											<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
										)}
										
										{/* Icon placeholder */}
										<div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
											pathname.startsWith(l.href) 
												? "bg-white/20" 
												: "bg-white/10 group-hover:bg-white/15"
										}`}>
											<div className="w-2 h-2 rounded-full bg-white/60" />
										</div>
										
										{/* Label */}
										<span className="font-medium text-sm drop-shadow-sm">{l.label}</span>
									</Link>
								))}
							</div>
						</div>
					))}
				</nav>
				{/* User Profile Section */}
				<div className="absolute bottom-4 left-4 right-4 rounded-xl shadow-button user-profile-glass">
					<button
						onClick={() => setIsProfileModalOpen(true)}
						className="w-full flex items-center space-x-3 hover:bg-white/10 rounded-xl p-4 transition-all duration-200 backdrop-blur-sm group"
					>
						<div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
							<span className="text-white font-semibold text-sm">{(user?.employee?.firstName?.[0] || user?.email?.[0])?.toUpperCase() ?? "U"}</span>
						</div>
						<div className="flex-1 text-left min-w-0">
							<p className="text-white font-medium text-sm truncate drop-shadow-md">{user?.employee?.firstName || user?.email || "User"}</p>
							<div className="flex items-center space-x-2">
								<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
								<p className="text-white/70 text-xs drop-shadow-sm">Online</p>
							</div>
						</div>
						<div className="w-5 h-5 flex items-center justify-center">
							<div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
						</div>
					</button>
				</div>
			</aside>

			{/* Scrollable Main (accounting for fixed sidebar width) */}
			<main className="flex flex-col min-h-svh lg:ml-[280px] overflow-y-auto">
				<header className="glass-light border-b border-white/20 px-6 lg:px-8 py-4 sticky top-0 z-50">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">Dashboard</h1>
							<p className="text-white/80 hidden md:block drop-shadow-md">Welcome back! Here's what's happening today.</p>
						</div>
						<div className="flex items-center gap-3">
							<div className="relative hidden md:block">
								<input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={handleSearchKeyDown} className="w-64 lg:w-80 pl-10 pr-4 py-2 rounded-full border border-white/30 glass-light text-white placeholder:text-white/60 focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all" placeholder="Search employees, reports..." />
								<Search className="absolute left-3 top-2.5 w-5 h-5 text-white/60" />
							</div>
							<ThemeToggle />
							<NotificationBell />
							<button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-medium transition-colors">Logout</button>
						</div>
					</div>
				</header>
				<div className="p-4 lg:p-8 flex-1">{children}</div>
			</main>

			{/* Profile Edit Modal */}
			{user && (
				<ProfileEditModal
					isOpen={isProfileModalOpen}
					onClose={() => setIsProfileModalOpen(false)}
					user={user}
					onUpdate={handleProfileUpdate}
				/>
			)}
		</div>
	);
}
