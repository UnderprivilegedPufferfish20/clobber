import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, page, table, schema, query } = body as {
      projectId?: string;
      page?: string;
      table?: string | null;
      schema?: string | null;
      query?: string | null;
    };

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    if (!page) {
      return NextResponse.json({ error: "Page is required" }, { status: 400 });
    }

    // Optional: validate project exists (nice 404 instead of generic prisma FK error)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.preselected.upsert({
      where: { projectId }, // relies on `projectId @unique`
      update: {
        page,
        table: table ?? null,
        schema: schema ?? null,
        query: query ?? null,
      },
      create: {
        projectId, // satisfies required relation via FK
        page,
        table: table ?? null,
        schema: schema ?? null,
        query: query ?? null,
        // Alternatively, you can do:
        // project: { connect: { id: projectId } },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save preselection:", error);
    return NextResponse.json(
      { error: "Failed to save preselection" },
      { status: 500 }
    );
  }
}
