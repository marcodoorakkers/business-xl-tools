import { createClient } from "@/lib/supabase/server";
import { logUsage } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

interface Section {
  level: number; // 0=title, 1=H1, 2=H2, 3=H3
  heading: string;
  paragraphs: string[];
}

interface DocStructure {
  title: string;
  subtitle?: string;
  sections: Section[];
}

type Style = "zakelijk" | "minimaal" | "modern";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
  if (!profile || profile.credits < 2) return NextResponse.json({ error: "Niet genoeg credits" }, { status: 402 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const style = (formData.get("style") as Style) ?? "zakelijk";

  if (!file) return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 });
  if (!file.name.endsWith(".docx")) return NextResponse.json({ error: "Alleen .docx bestanden worden ondersteund" }, { status: 400 });

  // Extract text from DOCX using mammoth
  let rawText = "";
  try {
    const mammoth = (await import("mammoth")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value.trim();
  } catch (err) {
    console.error("[word-formatter] mammoth error:", err);
    return NextResponse.json({ error: "Kon het document niet lezen. Controleer of het een geldig .docx bestand is." }, { status: 400 });
  }

  if (!rawText || rawText.length < 20) {
    return NextResponse.json({ error: "Het document lijkt leeg te zijn." }, { status: 400 });
  }

  // Use Claude to identify structure
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const analysis = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Analyseer dit document en geef het een logische structuur met een titel, eventueel een ondertitel, en secties met koppen op niveau H1/H2/H3.

Regels:
- Identificeer de documenttitel (level 0)
- Groepeer de inhoud in logische secties
- Gebruik level 1 voor hoofdstukken, level 2 voor paragrafen, level 3 voor subparagrafen
- Behoud alle originele tekst volledig - vul niets in, verwijder niets
- Splits lange alinea's niet op, voeg ze ook niet samen
- Geef ALLEEN een JSON object terug, zonder markdown of uitleg

Format:
{
  "title": "Documenttitel",
  "subtitle": "Optionele ondertitel of null",
  "sections": [
    {
      "level": 1,
      "heading": "Hoofdstuktitel",
      "paragraphs": ["Paragraaf 1 tekst", "Paragraaf 2 tekst"]
    }
  ]
}

Document:
${rawText.slice(0, 6000)}`,
    }],
  });

  const analysisContent = analysis.content[0];
  if (analysisContent.type !== "text") return NextResponse.json({ error: "Documentanalyse mislukt" }, { status: 500 });

  let docStructure: DocStructure;
  try {
    const cleaned = analysisContent.text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    docStructure = JSON.parse(match[0]);
  } catch {
    return NextResponse.json({ error: "Kon documentstructuur niet verwerken" }, { status: 500 });
  }

  // Generate formatted DOCX
  try {
    const {
      Document, Paragraph, TextRun, HeadingLevel, Header, Footer,
      PageNumber, NumberFormat, AlignmentType, TableOfContents,
      StyleLevel, Packer, PageBreak, Tab,
    } = await import("docx");

    // Style themes
    const themes: Record<Style, { accent: string; heading1: string; heading2: string }> = {
      zakelijk: { accent: "2563EB", heading1: "1E3A8A", heading2: "2563EB" },
      minimaal: { accent: "111827", heading1: "111827", heading2: "374151" },
      modern:   { accent: "059669", heading1: "064E3B", heading2: "059669" },
    };
    const theme = themes[style] ?? themes.zakelijk;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = [];

    // Title page
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "", break: 6 })],
      }),
      new Paragraph({
        text: docStructure.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );

    if (docStructure.subtitle) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({ text: docStructure.subtitle, color: "6B7280", size: 26 }),
          ],
        }),
      );
    }

    // Page break after title
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
    );

    // Table of Contents
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Inhoudsopgave", bold: true, size: 28, color: theme.heading1 })],
        spacing: { after: 200 },
      }),
      new TableOfContents("Inhoudsopgave", {
        hyperlink: true,
        headingStyleRange: "1-3",
        stylesWithLevels: [
          new StyleLevel("Heading1", 1),
          new StyleLevel("Heading2", 2),
          new StyleLevel("Heading3", 3),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] }),
    );

    // Sections
    for (const section of docStructure.sections) {
      const headingLevel =
        section.level === 1 ? HeadingLevel.HEADING_1 :
        section.level === 2 ? HeadingLevel.HEADING_2 :
        HeadingLevel.HEADING_3;

      children.push(
        new Paragraph({
          text: section.heading,
          heading: headingLevel,
          spacing: { before: section.level === 1 ? 400 : 200, after: 120 },
        }),
      );

      for (const para of section.paragraphs) {
        if (para.trim()) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: para, size: 24 })],
              spacing: { after: 160 },
            }),
          );
        }
      }
    }

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: "page-numbering",
            levels: [{ level: 0, format: NumberFormat.DECIMAL, text: "%1", alignment: AlignmentType.CENTER }],
          },
        ],
      },
      styles: {
        default: {
          document: {
            run: { font: "Calibri", size: 24, color: "1F2937" },
            paragraph: { spacing: { line: 276 } },
          },
          heading1: {
            run: { font: "Calibri", size: 32, bold: true, color: theme.heading1 },
            paragraph: { spacing: { before: 400, after: 160 } },
          },
          heading2: {
            run: { font: "Calibri", size: 28, bold: true, color: theme.heading2 },
            paragraph: { spacing: { before: 280, after: 120 } },
          },
          heading3: {
            run: { font: "Calibri", size: 26, bold: true, color: "374151" },
            paragraph: { spacing: { before: 200, after: 80 } },
          },
          title: {
            run: { font: "Calibri", size: 52, bold: true, color: theme.heading1 },
          },
        },
      },
      sections: [{
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { color: theme.accent, size: 6, style: "single" } },
                spacing: { after: 120 },
                children: [
                  new TextRun({ text: docStructure.title, color: "6B7280", size: 18, italics: true }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { color: "E5E7EB", size: 4, style: "single" } },
                spacing: { before: 120 },
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], color: "9CA3AF", size: 18 }),
                  new TextRun({ text: " / ", color: "9CA3AF", size: 18 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], color: "9CA3AF", size: 18 }),
                ],
              }),
            ],
          }),
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    await supabase.rpc("decrement_credits", { user_id: user.id });
    await supabase.rpc("decrement_credits", { user_id: user.id });
    await logUsage(user.id, "word-formatter", 2);

    const filename = file.name.replace(".docx", "") + "_opgemaakt.docx";

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[word-formatter] docx generation error:", err);
    return NextResponse.json({ error: "Er is een fout opgetreden bij het opmaken. Probeer het opnieuw." }, { status: 500 });
  }
}
