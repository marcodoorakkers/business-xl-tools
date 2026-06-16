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

    // Alle PDF's, afbeeldingen en Word-bijlagen
    const attachments = (email.attachments ?? []).filter(
      (a) =>
        a.mimeType === "application/pdf" ||
        a.mimeType?.startsWith("image/") ||
        a.mimeType === DOCX ||
        a.mimeType === "application/msword"
    );

    if (attachments.length > 0) {
      // Stuur per bijlage een aparte webhook-call
      for (const attachment of attachments) {
        if (!attachment.content) continue;
        await fetch(env.WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": env.WEBHOOK_SECRET,
          },
          body: JSON.stringify({
            recipient: message.to,
            from: email.from?.address ?? message.from,
            subject: email.subject ?? null,
            filename: attachment.filename ?? "document.pdf",
            contentType: attachment.mimeType ?? "application/pdf",
            data: toBase64(attachment.content),
          }),
        });
      }
    } else if (email.html || email.text) {
      // Geen bijlage — stuur de e-mailbody zelf als te scannen document
      const htmlContent = email.html ?? `<pre style="font-family:Arial,sans-serif;">${email.text ?? ""}</pre>`;
      const encoder = new TextEncoder();
      await fetch(env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": env.WEBHOOK_SECRET,
        },
        body: JSON.stringify({
          recipient: message.to,
          from: email.from?.address ?? message.from,
          subject: email.subject ?? null,
          filename: "email.html",
          contentType: "text/html",
          data: toBase64(encoder.encode(htmlContent).buffer),
          isEmailBody: true,
        }),
      });
    }
  },
};
