import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";
import { z } from "zod";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const profileUpdateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  designation: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const current = await getCurrentUserWithEmployee();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = profileUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, firstName, lastName, phone, address, designation } = parsed.data;

    // Check if email is already taken by another user
    if (email !== current.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    // Update user and employee data
    const updatedUser = await prisma.user.update({
      where: { id: current.id },
      data: {
        email,
        employee: {
          update: {
            firstName,
            lastName,
            phone: phone || null,
            address: address || null,
            designation: designation || null,
          },
        },
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        employee: updatedUser.employee,
      },
    });
  } catch (error) {
    console.error("/api/auth/profile error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
