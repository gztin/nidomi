import { getDb, getEnv } from "@/features/auth/db";
import { getStoredEmailSettings } from "@/features/email/settings";

export type EmailMode = "local" | "resend";

type DeliverEmailInput = {
  db: Awaited<ReturnType<typeof getDb>>;
  recipient: string;
  templateKey: string;
  subject: string;
  text: string;
  html: string;
  developmentUrl?: string;
};

export type EmailDeliveryResult = {
  mode: EmailMode;
  status: "queued" | "sent" | "failed";
};

function normalizeMode(value?: string): EmailMode {
  return value?.toLowerCase() === "resend" ? "resend" : "local";
}

type ResendResponse = { id?: string; message?: string; name?: string };

export async function deliverEmail(input: DeliverEmailInput): Promise<EmailDeliveryResult> {
  const env = await getEnv();
  const mode = normalizeMode(env.EMAIL_MODE);
  const deliveryId = crypto.randomUUID();

  await input.db.prepare(
    "INSERT INTO email_deliveries(id,recipient_email_snapshot,template_key,status,development_url) VALUES (?,?,?,'queued',?)",
  ).bind(deliveryId, input.recipient, input.templateKey, input.developmentUrl ?? null).run();

  if (mode === "local") return { mode, status: "queued" };

  try {
    const stored = await getStoredEmailSettings(input.db, env.SETTINGS_ENCRYPTION_KEY).catch(() => null);
    const apiKey = stored?.apiKey?.trim() || env.RESEND_API_KEY?.trim();
    if (!apiKey) throw new Error("RESEND_API_KEY_MISSING");
    const from = stored ? `${stored.fromName} <${stored.fromEmail}>` : env.EMAIL_FROM?.trim();
    if (!from) throw new Error("EMAIL_FROM_MISSING");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "nidomi-email-provider/1.0",
      },
      body: JSON.stringify({
        from,
        to: [input.recipient],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    const result = await response.json().catch(() => ({})) as ResendResponse;
    if (!response.ok) throw new Error(`RESEND_HTTP_${response.status}:${result.message ?? result.name ?? "SEND_FAILED"}`);

    await input.db.prepare("UPDATE email_deliveries SET status='sent',sent_at=CURRENT_TIMESTAMP,provider_message_id=? WHERE id=?").bind(result.id ?? null, deliveryId).run();
    return { mode, status: "sent" };
  } catch (error) {
    const failureCode = error instanceof Error ? error.message.slice(0, 200) : "EMAIL_SEND_FAILED";
    await input.db.prepare("UPDATE email_deliveries SET status='failed',failed_at=CURRENT_TIMESTAMP,failure_code=? WHERE id=?").bind(failureCode, deliveryId).run();
    console.error("Email delivery failed", { deliveryId, failureCode });
    return { mode, status: "failed" };
  }
}
