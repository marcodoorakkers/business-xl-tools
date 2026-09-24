import PostalMime from "postal-mime";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function toBase64(arrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default {
  async email(message, env) {
    if (!message.to.endsWith("@nooitmeerpostkwijt.nl")) return;

    const rawEmail = await new Response(message.raw).arrayBuffer();
    const email = await PostalMime.parse(rawEmail);

    // PDF heeft prioriteit boven afbeeldingen (logo's in e-mailhandtekening zijn ook bijlagen)
    const attachment =
      email.attachments?.find((a) => a.mimeType === "application/pdf") ||
      email.attachments?.find(
        (a) =>
          a.mimeType === DOCX ||
          a.mimeType === "application/msword" ||
          a.mimeType === "image/jpeg" ||
          a.mimeType === "image/jpg" ||
          a.mimeType === "image/png"
      );

    let payload;

    if (attachment?.content) {
      payload = {
        recipient: message.to,
        from: email.from?.address ?? message.from,
        subject: email.subject ?? null,
        filename: attachment.filename ?? "document.pdf",
        contentType: attachment.mimeType ?? "application/pdf",
        data: toBase64(attachment.content),
      };
    } else if (email.html || email.text) {
      // Geen bijlage — stuur de e-mailbody zelf als te scannen document
      const htmlContent = email.html ?? `<pre style="font-family:Arial,sans-serif;">${email.text ?? ""}</pre>`;
      const encoder = new TextEncoder();
      payload = {
        recipient: message.to,
        from: email.from?.address ?? message.from,
        subject: email.subject ?? null,
        filename: "email.html",
        contentType: "text/html",
        data: toBase64(encoder.encode(htmlContent).buffer),
        isEmailBody: true,
      };
    } else {
      return;
    }

    await fetch(env.WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": env.WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
    });
  },
};
