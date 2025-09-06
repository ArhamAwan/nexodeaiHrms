import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await getCurrentUserWithEmployee();
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    // Test basic database connection
    const userCount = await prisma.user.count();
    
    // Test notifications query
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      take: 5,
      select: {
        id: true,
        message: true,
        read: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      userCount,
      notifications,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Test notifications error:", error);
    return NextResponse.json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
