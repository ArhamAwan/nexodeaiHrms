"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
	const { theme, setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	// While not mounted on client, render an inert placeholder to avoid SSR mismatch
	if (!mounted) {
		return (
			<Button size="sm" variant="ghost" aria-hidden className="opacity-0 pointer-events-none">
				<Sun className="h-4 w-4" />
			</Button>
		);
	}

	const isDark = (theme === "dark") || (theme === "system" && resolvedTheme === "dark");
	const next = isDark ? "light" : "dark";

	return (
		<Button size="sm" variant="ghost" onClick={() => setTheme(next)} aria-label="Toggle theme">
			{isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
		</Button>
	);
}
