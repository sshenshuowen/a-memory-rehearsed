import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 });
    }

    const stmt = db.prepare(`
      UPDATE memories
      SET is_shared = 1
      WHERE id = ?
    `);
    
    const info = stmt.run(id);

    if (info.changes === 0) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Share API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 });
    }

    // First get the image URL to delete the file
    const getStmt = db.prepare(`SELECT image_url FROM memories WHERE id = ?`);
    const memory = getStmt.get(id) as { image_url: string } | undefined;

    if (memory) {
      // In a real app we'd delete the local file here using fs.unlink
      // For this prototype, just deleting the DB record is fine
      const stmt = db.prepare(`DELETE FROM memories WHERE id = ?`);
      stmt.run(id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
