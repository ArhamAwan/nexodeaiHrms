import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notifyManagersOfEmployee, notifyUser } from "@/lib/notify";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const schema = z.object({
	type: z.enum(["SICK", "CASUAL", "ANNUAL", "UNPAID", "COMP_OFF"]),
	fromDate: z.string(),
	toDate: z.string(),
});

export async function GET(_req: NextRequest) {
	try {
		const user = await getCurrentUserWithEmployee();
		if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		
		const leaves = await prisma.leave.findMany({ 
			where: { employeeId: user.employee.id }, 
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				type: true,
				fromDate: true,
				toDate: true,
				status: true,
				createdAt: true,
				updatedAt: true
			}
		});
		
		const response = NextResponse.json({ leaves });
		// Cache leaves for 2 minutes since they can change
		response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=240');
		return response;
	} catch (error) {
		console.error("/api/leaves GET error", error);
		return NextResponse.json({ error: "Failed to load leaves" }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	const user = await getCurrentUserWithEmployee();
	if (!user?.employee) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const json = await req.json();
	const parsed = schema.safeParse(json);
	if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
	const leave = await prisma.leave.create({ data: { employeeId: user.employee.id, type: parsed.data.type as any, fromDate: new Date(parsed.data.fromDate), toDate: new Date(parsed.data.toDate) } });
	await notifyManagersOfEmployee(user.employee.id, `New leave request from ${user.email}`);
	const hrs = await prisma.user.findMany({ where: { role: { in: ["HR", "ADMIN"] as any } }, select: { id: true } });
	await Promise.all(hrs.map((u) => notifyUser(u.id, `New leave request from ${user.email}`)));
	return NextResponse.json({ leave }, { status: 201 });
}
