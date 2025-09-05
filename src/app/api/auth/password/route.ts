import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { z } from "zod";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PATCH(req: NextRequest) {
  try {
    const current = await getCurrentUserWithEmployee();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = passwordUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    // Get user with password to verify current password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: current.id },
      select: { password: true },
    });

    if (!userWithPassword) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    if (!verifyPassword(currentPassword, userWithPassword.password)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Update password
    await prisma.user.update({
      where: { id: current.id },
      data: {
        password: hashPassword(newPassword),
      },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("/api/auth/password error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
