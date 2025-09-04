"use client";

import { usePathname } from "next/navigation";
import { Shell } from "@/components/shell";

export function AppFrame({ children }: { children: React.ReactNode }) {
	const pathname = usePathname() || "";
	const isLogin = pathname.startsWith("/login");
	return isLogin ? <>{children}</> : <Shell>{children}</Shell>;
}
