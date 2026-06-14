import { PDFDocument } from "pdf-lib";

async function htmlToPdf(html: string): Promise<Buffer> {
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = (await import("puppeteer-core")).default;
  const executablePath = await chromium.executablePath();
  console.log("[htmlToPdf] executablePath:", executablePath);
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" } });
    return Buffer.from(pdf);
  } finally {
    await page.close();
    await browser.close();
  }
}

export async function convertToPdf(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (mimeType === "application/pdf") return buffer;

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    const doc = await PDFDocument.create();
    const img = await doc.embedJpg(buffer);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    return Buffer.from(await doc.save());
  }

  if (mimeType === "image/png") {
    const doc = await PDFDocument.create();
    const img = await doc.embedPng(buffer);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    return Buffer.from(await doc.save());
  }

  if (mimeType === "image/webp" || mimeType === "image/gif") {
    const b64 = buffer.toString("base64");
    return htmlToPdf(`<!DOCTYPE html><html><body style="margin:0;padding:0;"><img src="data:${mimeType};base64,${b64}" style="max-width:100%;height:auto;" /></body></html>`);
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const mammoth = (await import("mammoth")).default;
    const { value: html } = await mammoth.convertToHtml({ buffer });
    return htmlToPdf(`<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;margin:40px 50px;">${html}</body></html>`);
  }

  if (mimeType === "text/html") {
    const html = buffer.toString("utf-8");
    return htmlToPdf(html);
  }

  if (mimeType === "text/plain") {
    const escaped = buffer.toString("utf-8").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return htmlToPdf(`<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:11pt;white-space:pre-wrap;margin:40px 50px;">${escaped}</body></html>`);
  }

  throw new Error(`Niet-ondersteund bestandstype: ${mimeType}`);
}
