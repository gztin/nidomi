import { NextResponse } from "next/server";
import { getDb, getEnv } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";
import { isValidTaiwanIdentityNumber, protectIdentityNumber } from "@/features/identity/identity-number";
import { readImageDimensions } from "@/features/images/dimensions";
import { IMAGE_ALLOWED_TYPES, IMAGE_MAX_INPUT_BYTES, validateIdentityImageDimensions } from "@/features/images/policy";

const noticeVersion = "identity-notice-2026-07-17-v2";
const noticePolicyId = "policy-identity-notice-2026-07-17-v2";
const allowedMimeTypes = new Set<string>(IMAGE_ALLOWED_TYPES);

function redirectTo(request: Request, query: string) {
  return NextResponse.redirect(new URL(`/account/verification?${query}`, request.url), 303);
}

function validDocument(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && value.size <= IMAGE_MAX_INPUT_BYTES && allowedMimeTypes.has(value.type);
}

async function sha256File(buffer: ArrayBuffer) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buffer));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/account/verification", request.url), 303);
  if (user.role !== "member") return NextResponse.redirect(new URL("/admin", request.url), 303);
  if (!user.emailVerified) return redirectTo(request, "error=email");

  const form = await request.formData();
  const identityNumber = String(form.get("identityNumber") ?? "");
  const front = form.get("identityFront");
  const back = form.get("identityBack");
  if (form.get("consent") !== noticeVersion) return redirectTo(request, "error=invalid");
  if (!isValidTaiwanIdentityNumber(identityNumber)) return redirectTo(request, "error=identity");
  if (!validDocument(front) || !validDocument(back)) return redirectTo(request, "error=file");

  const frontBuffer = await front.arrayBuffer();
  const backBuffer = await back.arrayBuffer();
  const frontDimensions = readImageDimensions(frontBuffer, front.type);
  const backDimensions = readImageDimensions(backBuffer, back.type);
  if (
    !frontDimensions || !backDimensions
    || validateIdentityImageDimensions(frontDimensions.width, frontDimensions.height)
    || validateIdentityImageDimensions(backDimensions.width, backDimensions.height)
  ) return redirectTo(request, "error=file");

  const db = await getDb();
  const active = await db.prepare("SELECT id,status FROM identity_verification_submissions WHERE user_id=? AND status IN ('pending','approved') LIMIT 1").bind(user.id).first<{ id: string; status: "pending" | "approved" }>();
  if (active?.status === "approved" || user.identityVerified) return redirectTo(request, "error=active");

  const env = await getEnv();
  const encryptionSecret = env.IDENTITY_DATA_ENCRYPTION_KEY?.trim();
  const hmacSecret = env.IDENTITY_LOOKUP_HMAC_KEY?.trim();
  if (!encryptionSecret || !hmacSecret) return redirectTo(request, "error=config");

  let protectedNumber: Awaited<ReturnType<typeof protectIdentityNumber>>;
  try {
    protectedNumber = await protectIdentityNumber(identityNumber, encryptionSecret, hmacSecret);
  } catch {
    return redirectTo(request, "error=config");
  }

  const submissionId = crypto.randomUUID();
  const version = (await db.prepare("SELECT COALESCE(MAX(version_number),0)+1 version FROM identity_verification_submissions WHERE user_id=?").bind(user.id).first<{ version: number }>())?.version ?? 1;
  const frontKey = `identity/${user.id}/${submissionId}/front`;
  const backKey = `identity/${user.id}/${submissionId}/back`;

  try {
    await env.PRIVATE_DOCUMENTS.put(frontKey, frontBuffer, { httpMetadata: { contentType: front.type } });
    await env.PRIVATE_DOCUMENTS.put(backKey, backBuffer, { httpMetadata: { contentType: back.type } });
    await db.batch([
      ...(active?.status === "pending"
        ? [db.prepare("UPDATE identity_verification_submissions SET status='revoked',revoked_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(active.id)]
        : []),
      db.prepare("INSERT INTO identity_verification_submissions(id,user_id,version_number,status,notice_version,identity_number_ciphertext,identity_number_iv,identity_number_lookup_hmac,identity_number_masked) VALUES (?,?,?,'pending',?,?,?,?,?)").bind(submissionId, user.id, version, noticeVersion, protectedNumber.ciphertext, protectedNumber.iv, protectedNumber.lookupHmac, protectedNumber.masked),
      db.prepare("INSERT INTO identity_documents(id,submission_id,document_side,r2_object_key,mime_type,byte_size,content_hash) VALUES (?,?,'front',?,?,?,?)").bind(crypto.randomUUID(), submissionId, frontKey, front.type, front.size, await sha256File(frontBuffer)),
      db.prepare("INSERT INTO identity_documents(id,submission_id,document_side,r2_object_key,mime_type,byte_size,content_hash) VALUES (?,?,'back',?,?,?,?)").bind(crypto.randomUUID(), submissionId, backKey, back.type, back.size, await sha256File(backBuffer)),
      db.prepare("INSERT INTO user_consents(id,user_id,policy_version_id,source) VALUES (?,?,?,'document_upload')").bind(crypto.randomUUID(), user.id, noticePolicyId),
    ]);
    return redirectTo(request, "status=submitted");
  } catch (error) {
    await Promise.allSettled([env.PRIVATE_DOCUMENTS.delete(frontKey), env.PRIVATE_DOCUMENTS.delete(backKey)]);
    console.error("Identity verification upload failed", { submissionId, error });
    return redirectTo(request, "error=upload");
  }
}
