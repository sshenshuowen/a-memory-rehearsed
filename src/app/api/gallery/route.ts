import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const stmt = db.prepare(`
      SELECT 
        id, 
        play_name, 
        playwright, 
        script_text, 
        theme,
        context,
        paraphrase,
        image_url, 
        created_at 
      FROM memories 
      WHERE is_shared = 1 
      ORDER BY created_at DESC
    `);
    
    const memories = stmt.all();

    // Group memories by play_name
    const groupedMemories = memories.reduce((acc: Record<string, any[]>, memory: any) => {
      const playName = memory.play_name;
      if (!acc[playName]) {
        acc[playName] = [];
      }
      acc[playName].push(memory);
      return acc;
    }, {} as Record<string, any[]>);

    // Convert object to array for easier mapping in the frontend
    const folders = Object.keys(groupedMemories).map((playName) => ({
      playName,
      playwright: groupedMemories[playName][0].playwright || "Anonymous",
      memories: groupedMemories[playName],
      previewImage: groupedMemories[playName][0].image_url, // Use first image as folder preview
      count: groupedMemories[playName].length,
    }));

    return NextResponse.json({ folders });

  } catch (error: any) {
    console.error("Gallery API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
