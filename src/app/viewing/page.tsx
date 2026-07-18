import Link from "next/link";
import { getDb } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";
import { viewingRequirementCopy } from "@/features/viewing/requirement";
import type { ViewingRequirement } from "@/features/property/types";
import { redirect } from "next/navigation";

interface SlotRow { id:string; startAt:string; endAt:string }
export default async function ViewingPage(){
 const db=await getDb();
 const property=(await db.prepare("SELECT title,viewing_requirement requirement FROM properties WHERE id='property-demo-001'").first()) as unknown as {title:string;requirement:ViewingRequirement}|null;
 const result=await db.prepare("SELECT id,start_at startAt,end_at endAt FROM viewing_slots WHERE property_id='property-demo-001' AND status='available' AND start_at>datetime('now','+12 hours') ORDER BY start_at").all();
 const slots=result.results as unknown as SlotRow[]; const user=await getCurrentUser();
 if(!user) redirect("/login?next=/viewing");
 return <main className="viewing-page"><div><Link className="policy-back" href="/">← 返回房源</Link><p className="eyebrow">選擇約看時段</p><h1>{property?.title}</h1>{property&&<div className="viewing-requirement-notice"><strong>此房源要求：{viewingRequirementCopy[property.requirement].label}</strong><p>{viewingRequirementCopy[property.requirement].description}</p></div>}{slots.length?<form className="verification-form" action="/api/viewing-requests" method="post"><label>約看時段<select name="slotId" required>{slots.map((slot)=><option key={slot.id} value={slot.id}>{new Date(slot.startAt).toLocaleString("zh-TW",{timeZone:"Asia/Taipei"})}</option>)}</select></label><label>聯絡電話<input name="phone" required/></label><label>看房人數<input name="partySize" type="number" min="1" max="10" defaultValue="1" required/></label><label>留言<textarea name="note" rows={3}/></label><button className="button button-primary">送出預約</button></form>:<div className="empty-state"><h2>目前沒有可預約時段</h2></div>}</div></main>;
}
