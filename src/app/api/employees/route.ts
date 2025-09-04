import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { z } from "zod";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

const prisma = new PrismaClient();

const createSchema = z.object({
	email: z.string().email(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	role: z.enum(["EMPLOYEE", "HR", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
});

export async function GET() {
	const employees = await prisma.employee.findMany({
		include: { user: { select: { id: true, email: true, role: true } }, department: { select: { name: true } } },
		orderBy: { createdAt: "desc" },
	});
	return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
	const current = await getCurrentUserWithEmployee();
	if (!current || (current.role !== "ADMIN" && current.role !== "HR")) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}
	const json = await req.json();
	const parsed = createSchema.safeParse(json);
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid input" }, { status: 400 });
	}
	const { email, firstName, lastName, role } = parsed.data;
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		return NextResponse.json({ error: "Email already in use" }, { status: 409 });
	}
	const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
	const user = await prisma.user.create({
		data: {
			email,
			password: hashPassword(tempPassword),
			role: role as any,
			employee: { create: { firstName, lastName } },
		},
	});
	return NextResponse.json({ id: user.id, tempPassword }, { status: 201 });
}
