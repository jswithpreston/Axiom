// =============================================================================
// Axiom Study Engine — Note Parser
// Pure algorithmic extraction of Q&A flashcard pairs from study notes.
// Handles Markdown, plain text, PDF-extracted text, and academic course notes.
// No external dependencies.
// =============================================================================

export interface ParsedCard {
  question: string;
  answer: string;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Words that are never valid flashcard subjects. */
const STOP_WORDS = new Set([
  "This", "It", "He", "She", "They", "That", "These", "Those",
  "There", "Here", "The", "A", "An", "We", "You", "I", "One",
  "Each", "Both", "All", "Some", "Any", "Every", "Another",
  "Below", "Above", "Note", "Example", "Key", "Main", "Other",
]);

function clean(s: string): string {
  return s
    .replace(/\*\*/g, "")
    .replace(/[_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toQuestion(term: string): string {
  return `What is ${clean(term)}?`;
}

function isValidPair(q: string, a: string): boolean {
  const qc = q.trim();
  const ac = a.trim();
  return (
    qc.length >= 5 &&
    qc.length <= 300 &&
    ac.length >= 10 &&
    ac.length <= 1500
  );
}

function firstWord(s: string): string {
  return s.split(/\s+/)[0] ?? "";
}

/** Extract the first complete sentence from a block of text. */
function firstSentence(text: string): string {
  const flat = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  const match = flat.match(/^[A-Z].+?[.!?]/);
  return match ? match[0].trim() : flat.slice(0, 300).trim();
}

function deduplicate(cards: ParsedCard[]): ParsedCard[] {
  const seen = new Set<string>();
  return cards.filter((c) => {
    const key = c.question.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Extractor 1: Explicit Q: / A: blocks
//
//   Q: What is mitosis?
//   A: The process of cell division.
// ---------------------------------------------------------------------------

function extractExplicitQA(text: string, out: ParsedCard[]): void {
  const re = /^Q:\s*([^\n]+?)\nA:\s*([\s\S]+?)(?=\n+Q:|\n*$)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const q = clean(m[1] ?? "");
    const a = clean(m[2] ?? "");
    if (isValidPair(q, a)) out.push({ question: q, answer: a });
  }
}

// ---------------------------------------------------------------------------
// Extractor 2: Bold term definitions
//
//   **Mitosis**: the process of cell division
//   **Ease factor** — controls interval growth
// ---------------------------------------------------------------------------

function extractBoldDefinitions(text: string, out: ParsedCard[]): void {
  const re = /\*\*([^*\n]{1,60})\*\*\s*(?:[:—–-]\s*|(?:is|are|refers to|means)\s+)([^\n*]{10,400})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const term = clean(m[1] ?? "");
    const def = clean(m[2] ?? "");
    if (STOP_WORDS.has(term)) continue;
    if (isValidPair(toQuestion(term), def)) {
      out.push({ question: toQuestion(term), answer: def });
    }
  }
}

// ---------------------------------------------------------------------------
// Extractor 3: Bullet list definitions
//
//   - Mitosis: cell division producing two identical daughter cells
//   * Ease factor: the SM-2 multiplier controlling interval growth
// ---------------------------------------------------------------------------

function extractBulletDefinitions(text: string, out: ParsedCard[]): void {
  const re = /^[-*•]\s+(?:\*\*)?([A-Z][^:*\n\-–—]{1,60})(?:\*\*)?:\s+(.{10,400})$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const term = clean(m[1] ?? "");
    const def = clean(m[2] ?? "");
    if (STOP_WORDS.has(firstWord(term))) continue;
    if (isValidPair(toQuestion(term), def)) {
      out.push({ question: toQuestion(term), answer: def });
    }
  }
}

// ---------------------------------------------------------------------------
// Extractor 4: Em-dash / en-dash standalone definitions
//
//   Mitosis — division of a cell into two genetically identical daughter cells
//   Osmosis – passive movement of water across a semipermeable membrane
// ---------------------------------------------------------------------------

function extractEmDashDefinitions(text: string, out: ParsedCard[]): void {
  const re = /^([A-Z][^\n—–]{1,60}?)\s*[—–]\s*(.{10,400})$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const term = clean(m[1] ?? "");
    const def = clean(m[2] ?? "");
    if (STOP_WORDS.has(firstWord(term))) continue;
    if (isValidPair(toQuestion(term), def)) {
      out.push({ question: toQuestion(term), answer: def });
    }
  }
}

// ---------------------------------------------------------------------------
// Extractor 5: Markdown heading sections (## Heading + body)
//
//   ## Cell Division
//   The process by which a parent cell divides...
// ---------------------------------------------------------------------------

function extractMarkdownSections(text: string, out: ParsedCard[]): void {
  const headingRe = /^#{2,4}\s+(.+)$/gm;
  const matches: { index: number; heading: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(text)) !== null) {
    matches.push({ index: m.index, heading: clean(m[1] ?? "") });
  }

  for (let i = 0; i < matches.length; i++) {
    const { heading } = matches[i]!;
    if (!heading || heading.length < 2 || heading.length > 100) continue;
    if (STOP_WORDS.has(firstWord(heading))) continue;

    const start = matches[i]!.index + heading.length + 3;
    const end = i + 1 < matches.length ? matches[i + 1]!.index : text.length;
    const body = text
      .slice(start, end)
      .split("\n")
      .map((l) => clean(l))
      .filter((l) => l.length > 0 && !l.startsWith("#") && !l.startsWith("-") && !l.startsWith("*"))
      .join(" ")
      .trim();

    if (body.length < 10) continue;
    const answer = body.match(/^.+?[.!?]/)?.[0] ?? body.slice(0, 300);
    out.push({ question: toQuestion(heading), answer: answer.trim() });
  }
}

// ---------------------------------------------------------------------------
// Extractor 6: Inline "X is/means Y" sentence patterns
//
//   Mitosis is the process of cell division.
//   The ease factor refers to the interval multiplier in SM-2.
// ---------------------------------------------------------------------------

function extractIsPatterns(text: string, out: ParsedCard[]): void {
  const re = /\b([A-Z][a-z]+(?:\s+[A-Za-z]+){0,3})\s+(?:is|are|refers to|means|is defined as)\s+(.{10,300}?)(?=[.!?]|$)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const term = clean(m[1] ?? "");
    const def = clean(m[2] ?? "");
    if (STOP_WORDS.has(term)) continue;
    if (term.split(/\s+/).length > 4) continue;
    if (isValidPair(toQuestion(term), def)) {
      out.push({ question: toQuestion(term), answer: def });
    }
  }
}

// ---------------------------------------------------------------------------
// Extractor 7: Numbered section headings (academic PDF format)
//
//   1.1 Definition of Entrepreneurship
//   4.4.1 Types of Franchising
//   5.3 Management Techniques
// ---------------------------------------------------------------------------

function extractNumberedSections(text: string, out: ParsedCard[]): void {
  const headingRe = /^(\d+(?:\.\d+)+)\s+([A-Z][A-Za-z ,&()/'.-]{2,80})$/gm;
  const sections: Array<{ bodyStart: number; term: string }> = [];
  let m: RegExpExecArray | null;

  while ((m = headingRe.exec(text)) !== null) {
    const term = clean(m[2] ?? "");
    if (term.length < 3) continue;
    sections.push({ bodyStart: m.index + m[0].length, term });
  }

  for (let i = 0; i < sections.length; i++) {
    const { bodyStart, term } = sections[i]!;
    if (STOP_WORDS.has(firstWord(term))) continue;
    const nextStart =
      i + 1 < sections.length
        ? sections[i + 1]!.bodyStart - (sections[i + 1]!.term.length + 10)
        : text.length;
    const bodyChunk = text.slice(bodyStart, Math.min(bodyStart + 800, nextStart));
    const answer = firstSentence(bodyChunk);
    if (answer.length >= 10 && isValidPair(toQuestion(term), answer)) {
      out.push({ question: toQuestion(term), answer });
    }
  }
}

// ---------------------------------------------------------------------------
// Extractor 8: Roman numeral and single-letter labeled sub-sections
//
//   (i) Financial Risk
//   (ii) Market Risk
//   a) Sole Proprietorship
//   b) Partnership
// ---------------------------------------------------------------------------

function extractLabeledSubsections(text: string, out: ParsedCard[]): void {
  // Matches roman numeral labels (i)-(x) or single letters a)-h)
  // followed by a Title Case heading on the same line
  const headingRe = /^(?:\((?:i{1,3}|iv|vi{0,3}|ix|x|xi{0,3})\)|[a-h]\))\s+([A-Z][A-Za-z ,&()/'.-]{2,70})$/gm;
  const sections: Array<{ bodyStart: number; term: string }> = [];
  let m: RegExpExecArray | null;

  while ((m = headingRe.exec(text)) !== null) {
    const term = clean(m[1] ?? "");
    // Exclude terms that look like list items (very short or end with punctuation)
    if (term.length < 3 || term.endsWith(",") || term.endsWith(";")) continue;
    sections.push({ bodyStart: m.index + m[0].length, term });
  }

  for (let i = 0; i < sections.length; i++) {
    const { bodyStart, term } = sections[i]!;
    if (STOP_WORDS.has(firstWord(term))) continue;
    const nextStart =
      i + 1 < sections.length
        ? sections[i + 1]!.bodyStart - (sections[i + 1]!.term.length + 8)
        : text.length;
    const bodyChunk = text.slice(bodyStart, Math.min(bodyStart + 600, nextStart));
    const answer = firstSentence(bodyChunk);
    if (answer.length >= 10 && isValidPair(toQuestion(term), answer)) {
      out.push({ question: toQuestion(term), answer });
    }
  }
}

// ---------------------------------------------------------------------------
// Extractor 9: Myth / misconception correction blocks
//
//   Myth 1: Entrepreneurs are born, not made
//   False. While some people may be naturally good at business...
// ---------------------------------------------------------------------------

function extractMythPatterns(text: string, out: ParsedCard[]): void {
  const re = /^Myth\s+\d+:\s+([^\n]{5,120})\n+((?:False|True|Not true|Misleading)[^\n]{10,400})/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const myth = clean(m[1] ?? "");
    const response = clean((m[2] ?? "").replace(/\n+/g, " "));
    const answer = response.match(/^.+?[.!?]/)?.[0] ?? response.slice(0, 300);
    if (myth && answer && isValidPair(`Myth: ${myth}`, answer)) {
      out.push({
        question: `Myth: "${myth}" — True or False?`,
        answer: clean(answer),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Extractor 10: Numbered list items with dash descriptions
//
//   18. Target Market Analysis - This explains who the ideal customers are...
//   23. Capital Needs - This refers to how much startup capital is required...
// ---------------------------------------------------------------------------

function extractNumberedDashItems(text: string, out: ParsedCard[]): void {
  const re = /^\d+\.\s+([A-Z][^-\n]{2,60}?)\s+-\s+(.{10,400})$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const term = clean(m[1] ?? "");
    const def = clean(m[2] ?? "");
    if (STOP_WORDS.has(firstWord(term))) continue;
    if (isValidPair(toQuestion(term), def)) {
      out.push({ question: toQuestion(term), answer: def });
    }
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Parse study notes text and extract Q&A flashcard pairs algorithmically.
 *
 * Recognises the following patterns (in priority order):
 *  1. Explicit Q: / A: blocks
 *  2. **Bold term**: definition
 *  3. - Bullet term: definition
 *  4. Term — em-dash definition
 *  5. ## Markdown heading + body paragraph
 *  6. "Term is/means/refers to definition" sentences
 *  7. Numbered section headings (1.1 Term / 4.4.1 Term) + body
 *  8. Roman numeral/letter sub-sections ((i) Term / a) Term) + body
 *  9. Myth N: statement + correction
 *  10. Numbered dash items (18. Term - definition)
 *
 * @param text - Raw text content from a notes file (plain text, Markdown, or PDF-extracted)
 * @returns Deduplicated array of { question, answer } pairs
 */
export function parseNotes(text: string): ParsedCard[] {
  const cards: ParsedCard[] = [];

  // Structured patterns first (highest precision)
  extractExplicitQA(text, cards);
  extractMythPatterns(text, cards);
  extractNumberedSections(text, cards);
  extractLabeledSubsections(text, cards);
  extractNumberedDashItems(text, cards);

  // Formatting-based patterns
  extractBoldDefinitions(text, cards);
  extractBulletDefinitions(text, cards);
  extractEmDashDefinitions(text, cards);
  extractMarkdownSections(text, cards);

  // Sentence-level patterns (broadest, most noise)
  extractIsPatterns(text, cards);

  return deduplicate(cards);
}
