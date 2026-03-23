// =============================================================================
// POST /api/import — Upload a notes file, extract text, parse Q&A pairs
// No external AI — purely algorithmic extraction via the domain note parser.
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { parseNotes } from "@/domain/noteParser.js";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ message: "No file provided" }, { status: 400 });
  }

  const isPlainText =
    file.type === "text/plain" ||
    file.type === "text/markdown" ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".txt");

  const isPdf =
    file.type === "application/pdf" || file.name.endsWith(".pdf");

  if (!isPlainText && !isPdf) {
    return NextResponse.json(
      { message: "Unsupported file type. Upload a PDF, TXT, or MD file." },
      { status: 400 }
    );
  }

  let text: string;

  if (isPdf) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdf = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await pdf(buffer);
      text = parsed.text;
    } catch {
      return NextResponse.json(
        { message: "Failed to parse PDF. Try a text or markdown file." },
        { status: 422 }
      );
    }
  } else {
    text = await file.text();
  }

  if (text.trim().length < 10) {
    return NextResponse.json(
      { message: "File content is too short to generate flashcards." },
      { status: 400 }
    );
  }

  const cards = parseNotes(text);

  if (cards.length === 0) {
    return NextResponse.json(
      {
        message:
          "No flashcard pairs could be extracted. Try structuring your notes with headings, bold terms, or 'Term: definition' bullet points.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ cards });
}
