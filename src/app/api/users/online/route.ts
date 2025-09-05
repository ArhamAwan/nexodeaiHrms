import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// In-memory store for online users (in production, use Redis)
const onlineUsers = new Map<string, { lastSeen: number; userId: string }>();

// Clean up inactive users (older than 5 minutes)
function cleanupInactiveUsers() {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  for (const [sessionId, data] of onlineUsers.entries()) {
    if (data.lastSeen < fiveMinutesAgo) {
      onlineUsers.delete(sessionId);
    }
  }
}

export async function GET() {
  try {
    cleanupInactiveUsers();
    
    // Get all online user IDs
    const onlineUserIds = Array.from(onlineUsers.values()).map(data => data.userId);
    
    return NextResponse.json({ onlineUsers: onlineUserIds });
  } catch (error) {
    console.error("/api/users/online GET error", error);
    return NextResponse.json({ error: "Failed to get online users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserWithEmployee();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Update user's last seen timestamp
    onlineUsers.set(sessionId, {
      lastSeen: Date.now(),
      userId: currentUser.id
    });

    cleanupInactiveUsers();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/users/online POST error", error);
    return NextResponse.json({ error: "Failed to update online status" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserWithEmployee();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Remove user from online list
    onlineUsers.delete(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/users/online DELETE error", error);
    return NextResponse.json({ error: "Failed to update offline status" }, { status: 500 });
  }
}
