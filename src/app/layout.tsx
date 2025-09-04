import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { AppFrame } from "@/components/app-frame";
import Script from "next/script";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "HRMS",
	description: "Human Resource Management System",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<head>
				<meta name="color-scheme" content="dark light" />
				<Script id="theme-init" strategy="beforeInteractive">{`
					(function(){try{var d=document.documentElement;var s=localStorage.getItem('theme');if(s==='light'||(s===null&&window.matchMedia('(prefers-color-scheme: light)').matches)){d.classList.remove('dark');}}catch(e){}})();
				`}</Script>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<Providers>
						<AppFrame>{children}</AppFrame>
					</Providers>
				</ThemeProvider>
			</body>
		</html>
	);
}
