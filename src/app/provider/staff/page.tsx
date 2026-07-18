import Link from "next/link";
import { PasswordField } from "@/components/form/password-field";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";
import { MIN_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH_LABEL } from "@/features/auth/password-policy";
import { STAFF_NOTICE_VERSION } from "@/features/property/staff-access";
import { redirect } from "next/navigation";

type PropertyRow = { id: string; title: string };
type StaffRow = { propertyId: string; staffUserId: string; staffName: string; staffEmail: string; permissionLevel: string; createdAt: string };
type OwnedStaffRow = { id: string; name: string; email: string; phone: string | null; disabledAt: string | null };

const permissionLabels: Record<string, string> = {
  booking: "預約協助",
  manage: "房源管理",
};

const statusCopy: Record<string, string> = {
  added: "共同管理者已新增。",
  created: "店員帳號已建立並指派。",
  removed: "共同管理者已移除。",
  invalid: "資料不完整或格式不正確。",
  not_found: "找不到你建立的店員帳號。",
  exists: "此 Email 已被一般會員或其他帳號使用。",
  owner: "房源持有者不需要加入共同管理者。",
  forbidden: "你沒有權限管理此房源的共同管理者。",
};

export default async function ProviderStaffPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/provider/staff");
  const { status } = await searchParams;
  const db = await getDb();
  const properties = (await db.prepare("SELECT id,title FROM properties WHERE provider_user_id=? ORDER BY created_at DESC").bind(user.id).all()).results as unknown as PropertyRow[];
  const ownedStaff = (await db.prepare(`
    SELECT u.id,p.display_name name,u.email_normalized email,p.phone,sa.disabled_at disabledAt
    FROM staff_accounts sa
    JOIN users u ON u.id=sa.user_id
    JOIN profiles p ON p.user_id=u.id
    WHERE sa.owner_user_id=?
    ORDER BY sa.created_at DESC
  `).bind(user.id).all()).results as unknown as OwnedStaffRow[];
  const staff = properties.length ? (await db.prepare(`
    SELECT ps.property_id propertyId,ps.staff_user_id staffUserId,ps.permission_level permissionLevel,ps.created_at createdAt,p.display_name staffName,u.email_normalized staffEmail
    FROM property_staff ps
    JOIN users u ON u.id=ps.staff_user_id
    JOIN profiles p ON p.user_id=u.id
    WHERE ps.property_id IN (${properties.map(() => "?").join(",")}) AND ps.disabled_at IS NULL
    ORDER BY ps.created_at DESC
  `).bind(...properties.map((property) => property.id)).all()).results as unknown as StaffRow[] : [];

  return <main className="workflow-page"><div className="workflow-shell">
    <Link className="policy-back" href="/provider/requests">← 返回收到的預約</Link>
    <p className="eyebrow">房源共同管理</p>
    <h1>共同管理者</h1>
    <p className="workflow-lead">建立可信任的店員帳號並指派到房源。權限以房源為單位設定；目前房源管理權限先不開放編輯，仍以預約處理與資訊檢視為主。</p>
    {status && <div className="privacy-notice"><strong>{statusCopy[status] ?? status}</strong></div>}
    {properties.length ? properties.map((property) => {
      const rows = staff.filter((row) => row.propertyId === property.id);
      return <section className="admin-panel" key={property.id}>
        <h2>{property.title}</h2>
        <form className="verification-form" action="/api/provider/staff" method="post">
          <input type="hidden" name="propertyId" value={property.id}/>
          <input type="hidden" name="intent" value="create"/>
          <label>店員姓名<input name="staffName" required placeholder="王小明"/></label>
          <label>店員 Email<input name="staffEmail" type="email" required placeholder="staff@example.com"/></label>
          <label>店員電話<input name="staffPhone" inputMode="tel" placeholder="0912345678"/></label>
          <PasswordField label="初始密碼" name="staffPassword" required minLength={MIN_PASSWORD_LENGTH} placeholder={MIN_PASSWORD_LENGTH_LABEL}/>
          <label>房源權限<select name="permissionLevel" required defaultValue="booking">
            <option value="booking">預約協助：處理預約與查看房源資訊</option>
            <option value="manage">房源管理：保留給後續開放管理功能</option>
          </select></label>
          <div className="privacy-notice">
            <strong>新增共同管理者須知</strong>
            <ul>
              <li>店員將可協助查看、接受或拒絕此房源的預約。</li>
              <li>你應確認店員是可信任且已取得授權的人。</li>
              <li>店員代表你處理預約所產生的聯繫與安排，你仍需負責。</li>
              <li>店員離職、合作終止或不再協助時，你應立即移除權限。</li>
            </ul>
          </div>
          <label className="consent-field"><input name="noticeAccepted" type="checkbox" value={STAFF_NOTICE_VERSION} required/><span>我確認已取得此人同意，並了解我需承擔授權管理責任。</span></label>
          <button className="button button-primary" type="submit">建立並指派店員</button>
        </form>
        {ownedStaff.length ? <form className="verification-form" action="/api/provider/staff" method="post">
          <input type="hidden" name="propertyId" value={property.id}/>
          <input type="hidden" name="intent" value="assign"/>
          <label>指派已建立的店員<select name="staffUserId" required>
            <option value="">選擇店員</option>
            {ownedStaff.filter((item) => !item.disabledAt).map((item) => <option value={item.id} key={item.id}>{item.name}・{item.email}</option>)}
          </select></label>
          <label>房源權限<select name="permissionLevel" required defaultValue="booking">
            <option value="booking">預約協助：處理預約與查看房源資訊</option>
            <option value="manage">房源管理：保留給後續開放管理功能</option>
          </select></label>
          <label className="consent-field"><input name="noticeAccepted" type="checkbox" value={STAFF_NOTICE_VERSION} required/><span>我確認已取得此人同意，並了解我需承擔授權管理責任。</span></label>
          <button className="button button-secondary" type="submit">指派到此房源</button>
        </form> : null}
        <div className="viewing-slots">
          {rows.length ? rows.map((row) => <div className="viewing-slot" key={row.staffUserId}>
            <strong>{row.staffName}</strong><small>{row.staffEmail}・{permissionLabels[row.permissionLevel] ?? row.permissionLevel}</small>
            <form action="/api/provider/staff" method="post">
              <input type="hidden" name="intent" value="remove"/>
              <input type="hidden" name="propertyId" value={property.id}/>
              <input type="hidden" name="staffUserId" value={row.staffUserId}/>
              <button className="tag-delete-button" type="submit">移除</button>
            </form>
          </div>) : <p className="form-note">尚未新增共同管理者。</p>}
        </div>
      </section>;
    }) : <div className="empty-state"><h2>目前沒有可管理的房源</h2><p>只有房源持有者可以新增共同管理者。</p></div>}
  </div></main>;
}
