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

// ─── Template style definitions ────────────────────────────────────────────────
// Uses inline styles (not Tailwind classes) for all template-specific colors
// so they survive Tailwind's production purge.
const TEMPLATE_STYLES: Record<Template, {
  label: string;
  dotColor: string;
  headerStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  nameStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  contactStyle: React.CSSProperties;
  sectionStyle: React.CSSProperties;
  accentStyle: React.CSSProperties;
  align: "left" | "center";
}> = {
  modern: {
    label: "Modern",
    dotColor: "#2563EB",
    headerStyle: { background: "#2563EB", padding: "20px 28px" },
    bodyStyle: { background: "#fff" },
    nameStyle: { color: "#fff", fontSize: "22px", fontWeight: 700, lineHeight: 1.2 },
    titleStyle: { color: "#BFDBFE", fontSize: "13px", marginTop: 2 },
    contactStyle: { color: "#93C5FD", fontSize: "11px", marginTop: 6 },
    sectionStyle: { color: "#2563EB", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "2px solid #2563EB", paddingBottom: 2, marginTop: 16, marginBottom: 8 },
    accentStyle: { color: "#2563EB" },
    align: "left",
  },
  classic: {
    label: "Classic",
    dotColor: "#1F2937",
    headerStyle: { background: "#fff", padding: "20px 28px", borderBottom: "2px solid #E5E7EB" },
    bodyStyle: { background: "#fff", border: "1px solid #E5E7EB" },
    nameStyle: { color: "#111827", fontSize: "22px", fontWeight: 700, lineHeight: 1.2, fontFamily: "Georgia, serif" },
    titleStyle: { color: "#6B7280", fontSize: "13px", fontStyle: "italic", marginTop: 2 },
    contactStyle: { color: "#9CA3AF", fontSize: "11px", marginTop: 6 },
    sectionStyle: { color: "#1F2937", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #D1D5DB", paddingBottom: 2, marginTop: 16, marginBottom: 8 },
    accentStyle: { color: "#4B5563" },
    align: "center",
  },
  bold: {
    label: "Bold",
    dotColor: "#111827",
    headerStyle: { background: "#111827", padding: "20px 28px" },
    bodyStyle: { background: "#fff" },
    nameStyle: { color: "#fff", fontSize: "22px", fontWeight: 700, lineHeight: 1.2 },
    titleStyle: { color: "#2DD4BF", fontSize: "13px", marginTop: 2 },
    contactStyle: { color: "#99F6E4", fontSize: "11px", marginTop: 6 },
    sectionStyle: { color: "#0D9488", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 16, marginBottom: 8 },
    accentStyle: { color: "#0D9488" },
    align: "left",
  },
  minimal: {
    label: "Minimal",
    dotColor: "#9CA3AF",
    headerStyle: { background: "#fff", padding: "24px 28px 16px" },
    bodyStyle: { background: "#fff", border: "1px solid #F3F4F6" },
    nameStyle: { color: "#111827", fontSize: "22px", fontWeight: 700, lineHeight: 1.2 },
    titleStyle: { color: "#6B7280", fontSize: "13px", marginTop: 2 },
    contactStyle: { color: "#9CA3AF", fontSize: "11px", marginTop: 6 },
    sectionStyle: { color: "#9CA3AF", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: 16, marginBottom: 8, borderBottom: "1px solid #F3F4F6", paddingBottom: 2 },
    accentStyle: { color: "#6B7280" },
    align: "left",
  },
};

// ─── Live CV Preview ────────────────────────────────────────────────────────────
function CVPreview({ cv, template, lang, photo }: { cv: CV; template: Template; lang: Lang; photo: string | null }) {
  const nl = lang === "nl";
  const s = TEMPLATE_STYLES[template];
  const contactParts = [cv.contact.location, cv.contact.email, cv.contact.phone].filter(Boolean) as string[];

  const SectionLabel = ({ text }: { text: string }) => (
    <p style={s.sectionStyle as React.CSSProperties}>{text}</p>
  );

  return (
    <div className="rounded-xl overflow-hidden text-sm shadow-lg" style={s.bodyStyle}>
      {/* Header */}
      <div style={{ ...s.headerStyle, display: "flex", alignItems: "flex-start", gap: 16, flexDirection: s.align === "center" ? "column" : "row", ...(s.align === "center" ? { alignItems: "center", textAlign: "center" } : {}) }}>
        {photo && s.align !== "center" && (
          <img src={photo} alt="foto" className="rounded shadow flex-shrink-0" style={{ width: 64, height: 80, objectFit: "cover" }} />
        )}
        <div style={s.align === "center" ? { display: "flex", flexDirection: "column", alignItems: "center" } : {}}>
          {photo && s.align === "center" && (
            <img src={photo} alt="foto" className="rounded shadow" style={{ width: 64, height: 80, objectFit: "cover", marginBottom: 12 }} />
          )}
          <p style={s.nameStyle}>{cv.name}</p>
          <p style={s.titleStyle}>{cv.title}</p>
          <p style={s.contactStyle}>{contactParts.join("  ·  ")}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-7 pb-6">
        <SectionLabel text={nl ? "Profiel" : "Profile"} />
        <p className="text-gray-700 leading-relaxed" style={{ fontSize: 12 }}>{cv.summary}</p>

        {cv.experience.length > 0 && (
          <>
            <SectionLabel text={nl ? "Werkervaring" : "Experience"} />
            <div className="flex flex-col gap-3">
              {cv.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-gray-900" style={{ fontSize: 12 }}>{exp.title}</span>
                      <span className="ml-1.5" style={{ fontSize: 12, ...s.accentStyle }}>{exp.company}</span>
                    </div>
                    <span className="text-gray-400 whitespace-nowrap flex-shrink-0" style={{ fontSize: 10 }}>{exp.period}</span>
                  </div>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {exp.description.map((d, j) => (
                      <li key={j} className="text-gray-600 flex gap-1.5" style={{ fontSize: 11 }}>
                        <span className="text-gray-300 flex-shrink-0 mt-0.5">•</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {cv.education.length > 0 && (
          <>
            <SectionLabel text={nl ? "Opleiding" : "Education"} />
            <div className="flex flex-col gap-2">
              {cv.education.map((edu, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-gray-900" style={{ fontSize: 12 }}>{edu.degree}</span>
                    <span className="text-gray-500 ml-1.5" style={{ fontSize: 11 }}>{edu.institution}</span>
                  </div>
                  <span className="text-gray-400 whitespace-nowrap flex-shrink-0" style={{ fontSize: 10 }}>{edu.period}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {cv.skills.length > 0 && (
          <>
            <SectionLabel text={nl ? "Vaardigheden" : "Skills"} />
            <p className="text-gray-600" style={{ fontSize: 12 }}>{cv.skills.join("  ·  ")}</p>
          </>
        )}

        {cv.languages.length > 0 && (
          <>
            <SectionLabel text={nl ? "Talen" : "Languages"} />
            <p className="text-gray-600" style={{ fontSize: 12 }}>{cv.languages.join("  ·  ")}</p>
          </>
        )}

        {cv.certifications && cv.certifications.length > 0 && (
          <>
            <SectionLabel text={nl ? "Certificaten" : "Certifications"} />
            <ul className="flex flex-col gap-0.5">
              {cv.certifications.map((c, i) => (
                <li key={i} className="text-gray-600 flex gap-1.5" style={{ fontSize: 12 }}>
                  <span className="text-gray-300">•</span>{c}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
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
      return new Paragraph({
        children: [new TextRun({ text: text.toUpperCase(), color: "9CA3AF", size: 18, characterSpacing: 80 })],
        spacing: { before: 280, after: 100 },
      });
    };

    const photoCell = (fill: string) => new TableCell({
      width: { size: 18, type: WidthType.PERCENTAGE },
      shading: { fill },
      borders: noBorder,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        shading: { fill },
        spacing: { before: 120, after: 120 },
        children: [new ImageRun({ data: photoData!, transformation: { width: 80, height: 100 }, type: photoType })],
      })],
    });

    const headerWithPhoto = (leftCells: object[], leftFill: string, rightFill: string) =>
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { ...noBorder, insideHorizontal: noBorder.top, insideVertical: noBorder.top },
        rows: [new TableRow({
          children: [
            new TableCell({
              width: { size: 82, type: WidthType.PERCENTAGE },
              shading: { fill: leftFill },
              borders: noBorder,
              verticalAlign: VerticalAlign.CENTER,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              children: leftCells as any[],
            }),
            photoCell(rightFill),
          ],
        })],
      });

    // Header
    if (template === "modern") {
      const contactParts = [cv.contact.location, cv.contact.email, cv.contact.phone, cv.contact.linkedin].filter(Boolean) as string[];
      const leftChildren = [
        new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 52, color: "FFFFFF" })], shading: { fill: "2563EB" }, indent: { left: 200 }, spacing: { before: 120, after: 0 } }),
        new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "BFDBFE" })], shading: { fill: "2563EB" }, indent: { left: 200 }, spacing: { after: 0 } }),
        new Paragraph({ children: [new TextRun({ text: contactParts.join("  |  "), size: 18, color: "93C5FD" })], shading: { fill: "1D4ED8" }, indent: { left: 200 }, spacing: { before: 0, after: 120 } }),
      ];
      if (photoData) { children.push(headerWithPhoto(leftChildren, "2563EB", "1D4ED8")); children.push(new Paragraph({ text: "", spacing: { after: 100 } })); }
      else { children.push(...leftChildren.map(p => { return p; })); children[children.length - 1]; }
      if (!photoData) {
        children.length = 0;
        children.push(new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 52, color: "FFFFFF" })], shading: { fill: "2563EB" }, spacing: { before: 0, after: 0 }, indent: { left: 200, right: 200 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "BFDBFE" })], shading: { fill: "2563EB" }, spacing: { after: 0 }, indent: { left: 200, right: 200 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: contactParts.join("  |  "), size: 18, color: "93C5FD" })], shading: { fill: "1D4ED8" }, spacing: { after: 200 }, indent: { left: 200, right: 200 } }));
      }
    } else if (template === "classic") {
      const contactParts = [cv.contact.location, cv.contact.email, cv.contact.phone].filter(Boolean) as string[];
      if (photoData) {
        const leftChildren = [
          new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 44, color: "111827" })], spacing: { after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "6B7280", italics: true })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: contactParts.join("  ·  "), size: 18, color: "9CA3AF" })], border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "E5E7EB", space: 8 } }, spacing: { after: 200 } }),
        ];
        children.push(headerWithPhoto(leftChildren, "FFFFFF", "FFFFFF")); children.push(new Paragraph({ text: "", spacing: { after: 40 } }));
      } else {
        children.push(new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 44, color: "111827" })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "6B7280", italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 80 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: contactParts.join("  ·  "), size: 18, color: "9CA3AF" })], alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "E5E7EB", space: 8 } }, spacing: { after: 200 } }));
      }
    } else if (template === "bold") {
      const contactParts = [cv.contact.location, cv.contact.email, cv.contact.phone].filter(Boolean) as string[];
      const leftChildren = [
        new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 56, color: "FFFFFF" })], shading: { fill: "111827" }, indent: { left: 200 }, spacing: { before: 120, after: 0 } }),
        new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "2DD4BF" })], shading: { fill: "111827" }, indent: { left: 200 }, spacing: { after: 0 } }),
        new Paragraph({ children: [new TextRun({ text: contactParts.join("   "), size: 18, color: "6EE7B7" })], shading: { fill: "1F2937" }, indent: { left: 200 }, spacing: { before: 0, after: 120 } }),
      ];
      if (photoData) { children.push(headerWithPhoto(leftChildren, "111827", "1F2937")); children.push(new Paragraph({ text: "", spacing: { after: 120 } })); }
      else {
        children.push(new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 56, color: "FFFFFF" })], shading: { fill: "111827" }, spacing: { before: 0, after: 0 }, indent: { left: 200, right: 200 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: cv.title, size: 24, color: "2DD4BF" })], shading: { fill: "111827" }, spacing: { after: 0 }, indent: { left: 200, right: 200 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: contactParts.join("   "), size: 18, color: "6EE7B7" })], shading: { fill: "1F2937" }, spacing: { after: 200 }, indent: { left: 200, right: 200 } }));
      }
    } else {
      const contactParts = [cv.contact.location, cv.contact.email, cv.contact.phone].filter(Boolean) as string[];
      if (photoData) {
        const leftChildren = [
          new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 48, color: "111827" })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: cv.title, size: 22, color: "6B7280" })], spacing: { after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: contactParts.join("   "), size: 18, color: "9CA3AF" })], border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "E5E7EB", space: 6 } }, spacing: { after: 200 } }),
        ];
        children.push(headerWithPhoto(leftChildren, "FFFFFF", "FFFFFF")); children.push(new Paragraph({ text: "", spacing: { after: 40 } }));
      } else {
        children.push(new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 48, color: "111827" })], spacing: { after: 40 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: cv.title, size: 22, color: "6B7280" })], spacing: { after: 60 } }));
        children.push(new Paragraph({ children: [new TextRun({ text: contactParts.join("   "), size: 18, color: "9CA3AF" })], border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "E5E7EB", space: 6 } }, spacing: { after: 200 } }));
      }
    }

    children.push(sectionLabel(nl ? "Profiel" : "Profile"));
    children.push(new Paragraph({ text: cv.summary, spacing: { after: 120 } }));

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

    if (cv.skills.length > 0) {
      children.push(sectionLabel(nl ? "Vaardigheden" : "Skills"));
      children.push(new Paragraph({ text: cv.skills.join("  ·  "), spacing: { after: 80 } }));
    }

    if (cv.languages.length > 0) {
      children.push(sectionLabel(nl ? "Talen" : "Languages"));
      children.push(new Paragraph({ text: cv.languages.join("  ·  "), spacing: { after: 80 } }));
    }

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

        {/* ── SETUP ── */}
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

            {errorMsg && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>}

            <button onClick={generate} disabled={!profileText.trim() || (style === "targeted" && !jobDescription.trim())}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-medium transition-colors">
              {lang === "nl" ? "Genereer CV →" : "Generate CV →"}
            </button>
          </div>
        )}

        {/* ── GENERATING ── */}
        {step === "generating" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4 py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">{lang === "nl" ? "CV wordt gegenereerd..." : "Generating your CV..."}</p>
            <p className="text-xs text-gray-400">Dit duurt 10–20 seconden</p>
          </div>
        )}

        {/* ── RESULT ── */}
        {step === "result" && cv && (
          <div className="flex flex-col gap-4">

            {/* Template switcher + photo */}
            <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-3">
              {/* Template pills */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Opmaak</p>
                <div className="flex gap-2">
                  {(Object.entries(TEMPLATE_STYLES) as [Template, typeof TEMPLATE_STYLES[Template]][]).map(([key, s]) => (
                    <button key={key} onClick={() => setTemplate(key as Template)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${template === key ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      <span className="w-2 h-2 rounded-full" style={{ background: s.dotColor }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo upload */}
              <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhoto} />
                {photoDataUrl ? (
                  <div className="flex items-center gap-2 flex-1">
                    <img src={photoDataUrl} alt="foto" className="w-8 h-10 object-cover rounded shadow-sm" />
                    <span className="text-xs text-gray-600 flex-1 truncate">{photoName}</span>
                    <button onClick={() => photoInputRef.current?.click()} className="text-xs text-blue-600 hover:underline">Wijzigen</button>
                    <button onClick={() => { setPhotoDataUrl(null); setPhotoName(""); }} className="text-xs text-red-400 hover:underline">Verwijderen</button>
                  </div>
                ) : (
                  <button onClick={() => photoInputRef.current?.click()}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                    <span className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-base">🖼️</span>
                    <span>Foto toevoegen <span className="text-gray-400">(optioneel)</span></span>
                  </button>
                )}
              </div>
            </div>

            {/* Live CV preview */}
            <CVPreview cv={cv} template={template} lang={lang} photo={photoDataUrl} />

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={exportToDocx}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-lg shadow-blue-100">
                📥 Download als Word{photoDataUrl ? " + foto" : ""}
              </button>
              <button onClick={reset}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-3 text-sm font-medium transition-colors">
                Opnieuw
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
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
