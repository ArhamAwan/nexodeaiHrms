import { NextResponse } from "next/server";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

export async function GET() {
	const user = await getCurrentUserWithEmployee();
	if (!user) return NextResponse.json({ user: null }, { status: 200 });
	return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, employee: user.employee } });
}
