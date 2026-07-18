import Link from "next/link";
import { ViewingRequirementSettingDemo } from "@/components/property/viewing-requirement-setting-demo";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";
import { redirect } from "next/navigation";

export default async function ViewingSettingsPage() {
  const user=await getCurrentUser();if(!user)redirect("/login?next=/provider/viewing-settings");
  const owns=await (await getDb()).prepare("SELECT viewing_requirement FROM properties WHERE id='property-demo-001' AND provider_user_id=?").bind(user.id).first<{viewing_requirement:"email_verified"|"identity_verified"}>();if(!owns)redirect("/");
  return <main className="workflow-page"><div className="workflow-shell">
    <Link className="policy-back" href="/">← 返回房源</Link><p className="eyebrow">房源提供者設定</p>
    <h1>預約資格門檻</h1><p className="workflow-lead">選擇租客申請看房前必須完成的驗證。平台不提供性別、年齡、職業或其他自訂門檻。</p>
    <ViewingRequirementSettingDemo initialValue={owns.viewing_requirement} />
  </div></main>;
}
