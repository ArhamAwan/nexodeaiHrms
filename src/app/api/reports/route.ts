import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserWithEmployee } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    // Use refresh-token based auth like other routes
    const user = await getCurrentUserWithEmployee();
    if (!user?.employee) {
      return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    }

    // Parse request body
    const { type, content } = await req.json();

    if (!type || !content?.trim()) {
      return NextResponse.json({ error: "Type and content are required" }, { status: 400 });
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        type,
        content: content.trim(),
        employeeId: user.employee.id
        // submissionDate will be set automatically by @default(now())
      }
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        type: report.type,
        submittedAt: report.submissionDate
      }
    });

  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithEmployee();
    if (!user?.employee) {
      return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Fetch reports
    const reports = await prisma.report.findMany({
      where: { employeeId: user.employee.id },
      orderBy: { submissionDate: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        content: true,
        submissionDate: true
      }
    });

    return NextResponse.json({ reports });

  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}