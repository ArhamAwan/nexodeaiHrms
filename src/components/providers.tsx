"use client";

import { Provider } from "react-redux";
import { store, useAppDispatch } from "@/store";
import { setCredentials } from "@/store";
import { useEffect } from "react";
import { Toaster } from "sonner";

function AuthBootstrap({ children }: { children: React.ReactNode }) {
	const dispatch = useAppDispatch();
	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
				if (!res.ok) return;
				const data = await res.json();
				if (data.user) {
					dispatch(setCredentials({ accessToken: null, user: data.user }));
				}
			} catch {}
		})();
	}, [dispatch]);
	return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<Provider store={store}>
			<AuthBootstrap>
				{children}
				<Toaster richColors closeButton position="top-right" />
			</AuthBootstrap>
		</Provider>
	);
}
