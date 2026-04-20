import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import db from "@/lib/db";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const userWord = formData.get("word") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert the File to a Buffer to save it locally
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename and save to public/uploads
    const extension = path.extname(file.name) || ".jpg";
    const filename = `${uuidv4()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);

    // Make sure the upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Save the file
    await fs.writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;

    // Convert buffer to base64 for Gemini Vision API
    const base64Image = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Define the prompt for Gemini to generate the dramaturgical interpretation
    const prompt = `Act as a master dramaturg and curator of an exhibition that links individual modern memories to universal human conditions found in literature.
Analyze this image and its tone, mood, and content.
The person who offered this memory provided this intuitive text: "${userWord || 'A memory, rehearsed'}". Let this text deeply influence your interpretation.

Based on the vibe of this photo and their offered text, select a REAL, published theater play that deeply resonates with the emotion or visual themes shown. Draw from a highly diverse pool of theatrical works—from classical (e.g., Sophocles, Tang Xianzu) to modern (e.g., Arthur Miller, Tennessee Williams) to experimental/contemporary (e.g., Samuel Beckett, Sarah Kane, Caryl Churchill, Annie Baker).

From that chosen play, extract a genuine 2 to 3 sentence quote. DO NOT paraphrase the quote.
Then, provide a brief dramaturgical interpretation. We need three components:
1. 'theme': A 1-2 word description of the play's core theme (e.g., "grief and waiting", "fractured reality").
2. 'context': A poetic, non-academic, 1-2 sentence description of what is happening in the play during that quote (e.g., "two figures wait by a barren tree for a savior who never arrives").
3. 'paraphrase': A soft, associative, poetic echo of the user's input text ("${userWord || 'A memory, rehearsed'}"), woven gracefully into a fragmented thought (e.g., "a quiet reflection of the fading light"). Do not sound like an AI explanation or academic summary. It should feel intuitive, associative, precise but poetic.

The goal is to demonstrate that there is nothing new under the sun, and that this individual's memory is actually a reflection of a collective memory already recorded in literature.

Return ONLY a valid JSON object in this exact format, with no markdown formatting or other text:
{
  "playName": "Real Play Title",
  "playwright": "Real Playwright Name",
  "script": "Real quote from the play.",
  "theme": "1-2 word theme",
  "context": "poetic context description",
  "paraphrase": "poetic associative echo of the user's text"
}`;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "{}";
    let aiResult;
    try {
      aiResult = JSON.parse(resultText);
    } catch (e) {
      console.error("Error parsing Gemini response:", resultText);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    if (!aiResult.playName || !aiResult.script) {
       return NextResponse.json({ error: "Invalid AI response structure" }, { status: 500 });
    }

    // Save to SQLite Database
    const memoryId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO memories (id, play_name, playwright, script_text, theme, context, paraphrase, image_url, is_shared)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const playwrightCredit = aiResult.playwright || 'Anonymous';
    const theme = aiResult.theme || 'memory';
    const context = aiResult.context || 'a moment passes quietly';
    const paraphrase = aiResult.paraphrase || 'an echo in the silence';

    stmt.run(
      memoryId, 
      aiResult.playName, 
      playwrightCredit, 
      aiResult.script, 
      theme,
      context,
      paraphrase,
      imageUrl, 
      0
    );

    return NextResponse.json({
      id: memoryId,
      playName: aiResult.playName,
      playwright: playwrightCredit,
      script: aiResult.script,
      theme: theme,
      context: context,
      paraphrase: paraphrase,
      imageUrl: imageUrl,
    });

  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
