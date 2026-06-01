import PostalMime from "postal-mime";

export default {
  async email(message, env) {
    // Alleen emails aan *@nooitmeerpostkwijt.nl verwerken
    if (!message.to.endsWith("@nooitmeerpostkwijt.nl")) return;

    // Volledige e-mail parsen (MIME)
    const rawEmail = await new Response(message.raw).arrayBuffer();
    const email = await PostalMime.parse(rawEmail);

    // Eerste PDF of afbeelding als bijlage zoeken
    const attachment = email.attachments?.find(
      (a) => a.mimeType === "application/pdf" || a.mimeType?.startsWith("image/")
    );

    if (!attachment?.content) return;

    // ArrayBuffer → base64 zonder Buffer (Worker-runtime)
    let binary = "";
    const bytes = new Uint8Array(attachment.content);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    await fetch(env.WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": env.WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        recipient: message.to,
        filename: attachment.filename ?? "document.pdf",
        contentType: attachment.mimeType ?? "application/pdf",
        data: base64,
      }),
    });
  },
};
