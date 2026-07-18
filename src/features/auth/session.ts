import { cookies } from "next/headers";
import { getDb } from "@/features/auth/db";
import { sha256 } from "@/features/auth/crypto";

export interface CurrentUser { id:string; email:string; displayName:string; role:"member"|"admin"; canReviewDocuments:boolean; emailVerified:boolean; identityVerified:boolean; }

export async function getCurrentUser():Promise<CurrentUser|null>{
  const token=(await cookies()).get("fh_session")?.value;if(!token)return null;
  const row=await (await getDb()).prepare(`SELECT u.id,u.email_normalized email,p.display_name displayName,u.role,u.can_review_documents canReviewDocuments,u.email_verified_at emailVerifiedAt,u.identity_verified_at identityVerifiedAt FROM sessions s JOIN users u ON u.id=s.user_id JOIN profiles p ON p.user_id=u.id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>CURRENT_TIMESTAMP AND u.disabled_at IS NULL`).bind(await sha256(token)).first<{id:string;email:string;displayName:string;role:"member"|"admin";canReviewDocuments:number;emailVerifiedAt:string|null;identityVerifiedAt:string|null}>();
  return row?{id:row.id,email:row.email,displayName:row.displayName,role:row.role,canReviewDocuments:row.canReviewDocuments===1,emailVerified:Boolean(row.emailVerifiedAt),identityVerified:Boolean(row.identityVerifiedAt)}:null;
}
