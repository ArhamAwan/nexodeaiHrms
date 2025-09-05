import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const createSchema = z.object({
	email: z.string().email(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	role: z.enum(["EMPLOYEE", "HR", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
});

export async function GET() {
	try {
		const employees = await prisma.employee.findMany({
			select: {
				id: true,
				firstName: true,
				lastName: true,
				phone: true,
				address: true,
				designation: true,
				joinedAt: true,
				createdAt: true,
				updatedAt: true,
				user: { 
					select: { 
						id: true, 
						email: true, 
						role: true,
						status: true
					} 
				}, 
				department: { 
					select: { 
						id: true,
						name: true 
					} 
				}
			},
			orderBy: { createdAt: "desc" },
		});
		
		const response = NextResponse.json({ employees });
		response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
		return response;
	} catch (error) {
		console.error("/api/employees GET error", error);
		return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
	}
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

export async function DELETE(req: NextRequest) {
	const current = await getCurrentUserWithEmployee();
	console.log("DELETE employee - Current user:", current ? { id: current.id, role: current.role } : "No user");
	
	if (!current) {
		return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
	}
	
	if (current.role !== "ADMIN") {
		return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
	}
	
	const { searchParams } = new URL(req.url);
	const employeeId = searchParams.get("id");
	
	if (!employeeId) {
		return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
	}
	
	try {
		// Find the employee and their user
		const employee = await prisma.employee.findUnique({
			where: { id: employeeId },
			include: { user: true }
		});
		
		if (!employee) {
			return NextResponse.json({ error: "Employee not found" }, { status: 404 });
		}
		
		// Prevent admin from deleting themselves
		if (employee.userId === current.id) {
			return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
		}
		
		// Delete related records first to avoid foreign key constraints
		await prisma.attendance.deleteMany({
			where: { employeeId: employeeId }
		});
		
		await prisma.leave.deleteMany({
			where: { employeeId: employeeId }
		});
		
		await prisma.timeLog.deleteMany({
			where: { employeeId: employeeId }
		});
		
		await prisma.report.deleteMany({
			where: { employeeId: employeeId }
		});
		
		// Delete the employee record
		await prisma.employee.delete({
			where: { id: employeeId }
		});
		
		// Finally delete the user
		await prisma.user.delete({
			where: { id: employee.userId }
		});
		
		return NextResponse.json({ message: "Employee deleted successfully" }, { status: 200 });
	} catch (error) {
		console.error("/api/employees DELETE error", error);
		return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
	}
}
