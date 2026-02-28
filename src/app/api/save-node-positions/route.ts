// e.g. /app/api/save-node-positions/route.ts

import prisma from "@/lib/db";
import { t } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { nodes, projectId, schema } = body;

  for (const node of nodes) {
    await prisma.schemaEditorPosition.upsert({
      where: { node_id: node.id },
      update: { x: node.position.x, y: node.position.y },
      create: {
        projectId,
        schema,
        node_id: node.id,
        x: node.position.x,
        y: node.position.y,
      },
    });
  }

  revalidateTag(t("schema", projectId, schema), "max")

  return NextResponse.json({ ok: true });
}
