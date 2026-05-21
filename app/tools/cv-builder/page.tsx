"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Link from "next/link";

type Step = "setup" | "generating" | "result" | "error";
type Lang = "nl" | "en";
type Style = "compact" | "full" | "targeted";
type Template = "modern" | "classic" | "bold" | "minimal";

interface CV {
  name: string;
  title: string;
  contact: { email?: string; phone?: string; location?: string; linkedin?: string };
  summary: string;
  experience: { title: string; company: string; period: string; description: string[] }[];
  education: { degree: string; institution: string; period: string }[];
  skills: string[];
  languages: string[];
  certifications?: string[];
}

const TEMPLATES: { value: Template; label: string; desc: string; accent: string; preview: React.ReactNode }[] = [
  {
    value: "modern",
    label: "Modern",
    desc: "Blauw accent, strakke lijnen",
    accent: "bg-blue-600",
    preview: (
      <div className="w-full h-20 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
        <div className="bg-blue-600 h-7 px-2 flex items-center gap-1">
          <div className="w-12 h-2 bg-white/90 rounded" />
          <div className="w-8 h-1.5 bg-blue-300 rounded" />
        </div>
        <div className="flex-1 px-2 py-1.5 flex flex-col gap-1">
          <div className="w-16 h-1.5 bg-blue-600 rounded" />
          <div className="w-full h-1 bg-gray-200 rounded" />
          <div className="w-3/4 h-1 bg-gray-200 rounded" />
        </div>
      </div>
    ),
  },
  {
    value: "classic",
    label: "Classic",
    desc: "Tijdloos, zwart & grijs",
    accent: "bg-gray-800",
    preview: (
      <div className="w-full h-20 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col px-2 py-2 gap-1.5">
        <div className="flex flex-col gap-0.5">
          <div className="w-14 h-2 bg-gray-800 rounded" />
          <div className="w-10 h-1.5 bg-gray-400 rounded" />
        </div>
        <div className="w-full h-px bg-gray-300" />
        <div className="flex flex-col gap-1">
          <div className="w-10 h-1.5 bg-gray-700 rounded" />
          <div className="w-full h-1 bg-gray-200 rounded" />
          <div className="w-4/5 h-1 bg-gray-200 rounded" />
        </div>
      </div>
    ),
  },
  {
    value: "bold",
    label: "Bold",
    desc: "Donker, krachtig, modern",
    accent: "bg-gray-900",
    preview: (
      <div className="w-full h-20 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
        <div className="bg-gray-900 h-9 px-2 flex flex-col justify-center gap-0.5">
          <div className="w-14 h-2 bg-white rounded" />
          <div className="w-10 h-1.5 bg-teal-400 rounded" />
        </div>
        <div className="flex-1 px-2 py-1.5 flex flex-col gap-1">
          <div className="w-12 h-1.5 bg-teal-600 rounded" />
          <div className="w-full h-1 bg-gray-200 rounded" />
          <div className="w-2/3 h-1 bg-gray-200 rounded" />
        </div>
      </div>
    ),
  },
  {
    value: "minimal",
    label: "Minimal",
    desc: "Clean, veel witruimte",
    accent: "bg-gray-400",
    preview: (
      <div className="w-full h-20 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col px-2 py-2 gap-1.5">
        <div className="flex flex-col gap-0.5">
          <div className="w-16 h-2 bg-gray-700 rounded" />
          <div className="w-10 h-1.5 bg-gray-300 rounded" />
        </div>
        <div className="flex flex-col gap-1 mt-1">
          <div className="w-8 h-1 bg-gray-300 rounded" />
          <div className="w-full h-1 bg-gray-100 rounded" />
          <div className="w-3/4 h-1 bg-gray-100 rounded" />
        </div>
      </div>
    ),
  },
];

export default function CVBuilderPage() {
  const [step, setStep] = useState<Step>("setup");
  const [lang, setLang] = useState<Lang>("nl");
  const [style, setStyle] = useState<Style>("full");
  const [template, setTemplate] = useState<Template>("modern");
  const [profileText, setProfileText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cv, setCv] = useState<CV | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function handlePdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    setPdfName(file.name);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch("/api/tools/parse-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProfileText(data.text);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "PDF verwerken mislukt");
      setPdfName("");
    } finally {
      setPdfLoading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setPhotoDataUrl(ev.target.result as string);
    };
    reader.readAsDataURL(file);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function generate() {
    if (!profileText.trim()) return;
    setErrorMsg("");
    setStep("generating");
    try {
      const res = await fetch("/api/tools/cv-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText, lang, style, jobDescription }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCv(data);
      setStep("result");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan");
      setStep("error");
    }
  }

  async function exportToDocx() {
    if (!cv) return;
    const {
      Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
      UnderlineType, Packer, Table, TableRow, TableCell, WidthType, ImageRun, VerticalAlign,
    } = await import("docx");

    // Prepare photo data if uploaded
    let photoData: Uint8Array | null = null;
    let photoType: "jpg" | "png" | "gif" | "bmp" | "svg" | "tiff" | "webp" = "jpg";
    if (photoDataUrl) {
      const [meta, base64] = photoDataUrl.split(",");
      const mime = meta.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
      photoType = mime.includes("png") ? "png" : mime.includes("gif") ? "gif" : "jpg";
      const binary = atob(base64);
      photoData = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) photoData[i] = binary.charCodeAt(i);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = [];
    const nl = lang === "nl";

    const noBorder = {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    };

    const sectionLabel = (text: string) => {
      if (template === "modern") {
        return new Paragraph({
          children: [new TextRun({ text, bold: true, color: "2563EB", size: 22, allCaps: true })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2563EB", space: 4 } },
          spacing: { before: 280, after: 120 },
        });
      }
      if (template === "classic") {
        return new Paragraph({
          children: [new TextRun({ text, bold: true, size: 22, color: "1F2937" })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "9CA3AF", space: 4 } },
          spacing: { before: 280, after: 120 },
        });
      }
      if (template === "bold") {
        return new Paragraph({
          children: [new TextRun({ text, bold: true, color: "0D9488", size: 22, allCaps: true })],
          spacing: { before: 280, after: 120 },
        });
      }
      // minimal
      return new Paragraph({
        children: [new TextRun({ text: text.toUpperCase(), color: "9CA3AF", size: 18, characterSpacing: 80 })],
        spacing: { before: 280, after: 100 },
      });
    };

    // ── Header ──────────────────────────────────────────────────────────────
    if (template === "modern") {
      const contactParts = [cv.contact.location, cv.contact.email, cv.contact.phone, cv.contact.linkedin].filter(Boolean) as string[];
      if (photoData) {
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { ...noBorder, insideHorizontal: noBorder.top, insideVertical: noBorder.top },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 82, type: WidthType.PERCENTAGE },
                  shading: { fill: "2563EB" },
                  borders: noBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 52, color: "FFFFFF" })], shading: { fill: "2563EB" }, indent: { left: 200 }, spacing: { before: 120, after: 0 } }),
                    new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "BFDBFE" })], shading: { fill: "2563EB" }, indent: { left: 200 }, spacing: { after: 0 } }),
                    new Paragraph({ children: [new TextRun({ text: contactParts.join("  |  "), size: 18, color: "93C5FD" })], shading: { fill: "1D4ED8" }, indent: { left: 200 }, spacing: { before: 0, after: 120 } }),
                  ],
                }),
                new TableCell({
                  width: { size: 18, type: WidthType.PERCENTAGE },
                  shading: { fill: "1D4ED8" },
                  borders: noBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    shading: { fill: "1D4ED8" },
                    spacing: { before: 120, after: 120 },
                    children: [new ImageRun({ data: photoData, transformation: { width: 80, height: 100 }, type: photoType })],
                  })],
                }),
              ],
            }),
          ],
        }));
        children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
      } else {
        children.push(new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 52, color: "FFFFFF" })], shading: { fill: "2563EB" }, spacing: { before: 0, after: 0 }, indent: { left: 200, right: 200 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "BFDBFE" })], shading: { fill: "2563EB" }, spacing: { after: 0 }, indent: { left: 200, right: 200 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: contactParts.join("  |  "), size: 18, color: "93C5FD" })], shading: { fill: "1D4ED8" }, spacing: { after: 200 }, indent: { left: 200, right: 200 } }));
      }
    } else if (template === "classic") {
      const contactParts = [cv.contact.location, cv.contact.email, cv.contact.phone].filter(Boolean) as string[];
      if (photoData) {
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { ...noBorder, insideHorizontal: noBorder.top, insideVertical: noBorder.top },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 80, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 44, color: "111827" })], spacing: { after: 60 } }),
                    new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "6B7280", italics: true })], spacing: { after: 80 } }),
                    new Paragraph({ children: [new TextRun({ text: contactParts.join("  ·  "), size: 18, color: "9CA3AF" })], border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "E5E7EB", space: 8 } }, spacing: { after: 200 } }),
                  ],
                }),
                new TableCell({
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                    children: [new ImageRun({ data: photoData, transformation: { width: 80, height: 100 }, type: photoType })],
                  })],
                }),
              ],
            }),
          ],
        }));
        children.push(new Paragraph({ text: "", spacing: { after: 40 } }));
      } else {
        children.push(new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 44, color: "111827" })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "6B7280", italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: contactParts.join("  ·  "), size: 18, color: "9CA3AF" })], alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "E5E7EB", space: 8 } }, spacing: { after: 200 } }));
      }
    } else if (template === "bold") {
      const contactParts = [cv.contact.location, cv.contact.email, cv.contact.phone].filter(Boolean) as string[];
      if (photoData) {
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { ...noBorder, insideHorizontal: noBorder.top, insideVertical: noBorder.top },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 82, type: WidthType.PERCENTAGE },
                  shading: { fill: "111827" },
                  borders: noBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 56, color: "FFFFFF" })], shading: { fill: "111827" }, indent: { left: 200 }, spacing: { before: 120, after: 0 } }),
                    new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "2DD4BF" })], shading: { fill: "111827" }, indent: { left: 200 }, spacing: { after: 0 } }),
                    new Paragraph({ children: [new TextRun({ text: contactParts.join("   "), size: 18, color: "6EE7B7" })], shading: { fill: "1F2937" }, indent: { left: 200 }, spacing: { before: 0, after: 120 } }),
                  ],
                }),
                new TableCell({
                  width: { size: 18, type: WidthType.PERCENTAGE },
                  shading: { fill: "1F2937" },
                  borders: noBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    shading: { fill: "1F2937" },
                    spacing: { before: 120, after: 120 },
                    children: [new ImageRun({ data: photoData, transformation: { width: 80, height: 100 }, type: photoType })],
                  })],
                }),
              ],
            }),
          ],
        }));
        children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
      } else {
        children.push(new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 56, color: "FFFFFF" })], shading: { fill: "111827" }, spacing: { before: 0, after: 0 }, indent: { left: 200, right: 200 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "2DD4BF" })], shading: { fill: "111827" }, spacing: { after: 0 }, indent: { left: 200, right: 200 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: contactParts.join("   "), size: 18, color: "6EE7B7" })], shading: { fill: "1F2937" }, spacing: { after: 200 }, indent: { left: 200, right: 200 } }));
      }
    } else {
      // minimal
      const contactParts = [cv.contact.location, cv.contact.email, cv.contact.phone].filter(Boolean) as string[];
      if (photoData) {
        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { ...noBorder, insideHorizontal: noBorder.top, insideVertical: noBorder.top },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 80, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 48, color: "111827" })], spacing: { after: 40 } }),
                    new Paragraph({ children: [new TextRun({ text: cv.title, size: 22, color: "6B7280" })], spacing: { after: 60 } }),
                    new Paragraph({ children: [new TextRun({ text: contactParts.join("   "), size: 18, color: "9CA3AF" })], border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "E5E7EB", space: 6 } }, spacing: { after: 200 } }),
                  ],
                }),
                new TableCell({
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  borders: noBorder,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0 },
                    children: [new ImageRun({ data: photoData, transformation: { width: 80, height: 100 }, type: photoType })],
                  })],
                }),
              ],
            }),
          ],
        }));
        children.push(new Paragraph({ text: "", spacing: { after: 40 } }));
      } else {
        children.push(new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 48, color: "111827" })], spacing: { after: 40 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: cv.title, size: 22, color: "6B7280" })], spacing: { after: 60 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: contactParts.join("   "), size: 18, color: "9CA3AF" })], border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "E5E7EB", space: 6 } }, spacing: { after: 200 } }));
      }
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    children.push(sectionLabel(nl ? "Profiel" : "Profile"));
    children.push(new Paragraph({ text: cv.summary, spacing: { after: 120 } }));

    // ── Experience ───────────────────────────────────────────────────────────
    if (cv.experience.length > 0) {
      children.push(sectionLabel(nl ? "Werkervaring" : "Experience"));
      for (const exp of cv.experience) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: exp.title, bold: true, size: 22 }),
            new TextRun({ text: `  ${exp.company}`, size: 22, color: template === "bold" ? "0D9488" : template === "modern" ? "2563EB" : "4B5563" }),
            new TextRun({ text: `  ${exp.period}`, size: 18, color: "9CA3AF" }),
          ],
          spacing: { before: 120, after: 60 },
        }));
        for (const bullet of exp.description) {
          children.push(new Paragraph({ text: bullet, bullet: { level: 0 }, spacing: { after: 40 } }));
        }
      }
    }

    // ── Education ────────────────────────────────────────────────────────────
    if (cv.education.length > 0) {
      children.push(sectionLabel(nl ? "Opleiding" : "Education"));
      for (const edu of cv.education) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 22 }),
            new TextRun({ text: `  ${edu.institution}`, size: 22, color: "6B7280" }),
            new TextRun({ text: `  ${edu.period}`, size: 18, color: "9CA3AF" }),
          ],
          spacing: { before: 80, after: 60 },
        }));
      }
    }

    // ── Skills ───────────────────────────────────────────────────────────────
    if (cv.skills.length > 0) {
      children.push(sectionLabel(nl ? "Vaardigheden" : "Skills"));
      children.push(new Paragraph({ text: cv.skills.join("  ·  "), spacing: { after: 80 } }));
    }

    // ── Languages ────────────────────────────────────────────────────────────
    if (cv.languages.length > 0) {
      children.push(sectionLabel(nl ? "Talen" : "Languages"));
      children.push(new Paragraph({ text: cv.languages.join("  ·  "), spacing: { after: 80 } }));
    }

    // ── Certifications ───────────────────────────────────────────────────────
    if (cv.certifications && cv.certifications.length > 0) {
      children.push(sectionLabel(nl ? "Certificaten" : "Certifications"));
      for (const cert of cv.certifications) {
        children.push(new Paragraph({ text: cert, bullet: { level: 0 } }));
      }
    }

    void HeadingLevel; void UnderlineType; void VerticalAlign;

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: template === "classic" ? "Georgia" : template === "minimal" ? "Helvetica" : "Calibri", size: 22 },
          },
        },
      },
      sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } }, children }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CV_${cv.name.replace(/\s+/g, "_")}_${template}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setStep("setup");
    setCv(null);
    setErrorMsg("");
  }

  const styleOptions: { value: Style; label: string; desc: string; icon: string }[] = [
    { value: "compact", label: "Compact", desc: lang === "nl" ? "1 pagina, alleen highlights" : "1 page, highlights only", icon: "⚡" },
    { value: "full", label: lang === "nl" ? "Uitgebreid" : "Full", desc: lang === "nl" ? "2 pagina's, alle ervaring" : "2 pages, all experience", icon: "📄" },
    { value: "targeted", label: lang === "nl" ? "Gericht op vacature" : "Job targeted", desc: lang === "nl" ? "Aangepast op een specifieke functie" : "Tailored to a specific role", icon: "🎯" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900 text-sm">📋 CV Builder</span>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* SETUP */}
        {step === "setup" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">CV Builder</h1>
              <p className="text-gray-500 text-sm">Upload je CV of LinkedIn PDF en ontvang een professioneel CV in Word. Kost 1 credit.</p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Taal van het CV</label>
              <div className="flex gap-2">
                {(["nl", "en"] as Lang[]).map((l) => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${lang === l ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-400"}`}>
                    {l === "nl" ? "🇳🇱 Nederlands" : "🇬🇧 English"}
                  </button>
                ))}
              </div>
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Opmaak / Template</label>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((t) => (
                  <button key={t.value} onClick={() => setTemplate(t.value)}
                    className={`flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all ${template === t.value ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-blue-300"}`}>
                    {t.preview}
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${t.accent}`} />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.label}</p>
                        <p className="text-xs text-gray-400">{t.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type CV</label>
              <div className="flex flex-col gap-2">
                {styleOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setStyle(opt.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${style === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}>
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Job description */}
            {style === "targeted" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === "nl" ? "Vacaturetekst" : "Job description"}
                </label>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={5}
                  placeholder={lang === "nl" ? "Plak hier de vacaturetekst..." : "Paste the job description here..."}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            )}

            {/* PDF upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CV of LinkedIn profiel</label>
              <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdf} />
              <button onClick={() => pdfInputRef.current?.click()} disabled={pdfLoading}
                className={`w-full py-3 mb-3 rounded-xl text-sm font-medium border-2 border-dashed transition-colors flex items-center justify-center gap-2
                  ${pdfName ? "border-green-400 text-green-600 bg-green-50" : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500"}
                  ${pdfLoading ? "opacity-60 cursor-wait" : ""}`}>
                {pdfLoading ? (
                  <><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> PDF wordt ingelezen...</>
                ) : pdfName ? (
                  <>✓ {pdfName} — klik om ander bestand te kiezen</>
                ) : (
                  <>📄 Upload PDF <span className="text-gray-400 font-normal">(bestaand CV of LinkedIn → Meer → Profiel opslaan als PDF)</span></>
                )}
              </button>

              <div className="relative mb-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">of plak tekst</span></div>
              </div>

              <textarea value={profileText} onChange={(e) => setProfileText(e.target.value)} rows={6}
                placeholder="Plak je CV of LinkedIn profiel tekst hier..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            {/* Photo upload (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto <span className="text-gray-400 font-normal">(optioneel)</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">Wordt rechtsboven in de header van je Word CV geplaatst.</p>
              <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handlePhoto} />
              <button onClick={() => photoInputRef.current?.click()}
                className={`w-full py-3 rounded-xl text-sm font-medium border-2 border-dashed transition-colors flex items-center justify-center gap-2
                  ${photoDataUrl ? "border-green-400 text-green-600 bg-green-50" : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500"}`}>
                {photoDataUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={photoDataUrl} alt="preview" className="w-8 h-10 object-cover rounded" />
                    <span>✓ {photoName} — klik om te wijzigen</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPhotoDataUrl(null); setPhotoName(""); }}
                      className="ml-2 text-red-400 hover:text-red-600 text-xs underline">
                      verwijderen
                    </button>
                  </div>
                ) : (
                  <>🖼️ Upload foto <span className="text-gray-400 font-normal">(JPG of PNG, pasfoto formaat)</span></>
                )}
              </button>
            </div>

            {errorMsg && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>}

            <button onClick={generate} disabled={!profileText.trim() || (style === "targeted" && !jobDescription.trim())}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-medium transition-colors">
              {lang === "nl" ? "Genereer CV →" : "Generate CV →"}
            </button>
          </div>
        )}

        {/* GENERATING */}
        {step === "generating" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">{lang === "nl" ? "CV wordt gegenereerd..." : "Generating your CV..."}</p>
            <p className="text-xs text-gray-400">Dit duurt 10–20 seconden</p>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && cv && (
          <div className="flex flex-col gap-4">
            {/* Header card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex items-start gap-4">
              {photoDataUrl && (
                <img src={photoDataUrl} alt="foto" className="w-14 h-18 object-cover rounded-lg flex-shrink-0 shadow-md" style={{ height: "72px" }} />
              )}
              <div className="flex-1">
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">CV gegenereerd ✓</p>
                <h2 className="text-2xl font-bold mb-1">{cv.name}</h2>
                <p className="text-blue-200 text-sm mb-3">{cv.title}</p>
                <div className="flex flex-wrap gap-3 text-xs text-blue-100">
                  {cv.contact.location && <span>📍 {cv.contact.location}</span>}
                  {cv.contact.email && <span>✉️ {cv.contact.email}</span>}
                  {cv.contact.phone && <span>📞 {cv.contact.phone}</span>}
                </div>
              </div>
            </div>

            {/* Template picker in result */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <p className="text-sm font-medium text-gray-700 mb-3">Kies je template voor de download:</p>
              <div className="grid grid-cols-4 gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.value} onClick={() => setTemplate(t.value)}
                    className={`flex flex-col gap-1.5 p-2 rounded-xl border-2 transition-all ${template === t.value ? "border-blue-500 shadow-sm" : "border-gray-200 hover:border-blue-300"}`}>
                    {t.preview}
                    <p className="text-xs font-medium text-gray-700 text-center">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* CV content preview */}
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-5">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{lang === "nl" ? "Profiel" : "Profile"}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{cv.summary}</p>
              </div>

              {cv.experience.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{lang === "nl" ? "Werkervaring" : "Experience"}</h3>
                  <div className="flex flex-col gap-4">
                    {cv.experience.map((exp, i) => (
                      <div key={i}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
                            <p className="text-sm text-blue-600">{exp.company}</p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{exp.period}</span>
                        </div>
                        <ul className="mt-2 flex flex-col gap-1">
                          {exp.description.map((d, j) => (
                            <li key={j} className="text-xs text-gray-600 flex gap-2"><span className="text-gray-300 mt-0.5">•</span>{d}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cv.education.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{lang === "nl" ? "Opleiding" : "Education"}</h3>
                  <div className="flex flex-col gap-2">
                    {cv.education.map((edu, i) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{edu.degree}</p>
                          <p className="text-xs text-gray-500">{edu.institution}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{edu.period}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cv.skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{lang === "nl" ? "Vaardigheden" : "Skills"}</h3>
                  <div className="flex flex-wrap gap-2">
                    {cv.skills.map((s, i) => <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{s}</span>)}
                  </div>
                </div>
              )}

              {cv.languages.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{lang === "nl" ? "Talen" : "Languages"}</h3>
                  <div className="flex flex-wrap gap-2">
                    {cv.languages.map((l, i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{l}</span>)}
                  </div>
                </div>
              )}

              {cv.certifications && cv.certifications.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{lang === "nl" ? "Certificaten" : "Certifications"}</h3>
                  <ul className="flex flex-col gap-1">
                    {cv.certifications.map((c, i) => <li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-gray-300">•</span>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={exportToDocx}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-lg shadow-blue-100">
                📥 Download als Word ({TEMPLATES.find(t => t.value === template)?.label}{photoDataUrl ? " + foto" : ""})
              </button>
              <button onClick={reset}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-3 text-sm font-medium transition-colors">
                Opnieuw
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {step === "error" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">!</div>
            <p className="text-red-600 font-medium">Er is iets misgegaan</p>
            <p className="text-sm text-gray-500 text-center">{errorMsg}</p>
            <button onClick={reset} className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-6 py-2 text-sm font-medium">
              Probeer opnieuw
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
