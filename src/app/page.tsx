import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertySection } from "@/components/property/property-section";
import { MemberVerificationBadge } from "@/components/member/member-verification-badge";
import { PropertyVerificationBadges } from "@/components/property/property-verification-badges";
import { getHomepageProperty } from "@/features/property/public-detail";
import { formatViewingSlot, getAvailableViewingSlots } from "@/features/viewing/availability";
import { viewingRequirementCopy } from "@/features/viewing/requirement";
import { getCurrentUser } from "@/features/auth/session";

const money = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

export default async function Home() {
  const currentUser = await getCurrentUser();
  const property = await getHomepageProperty();
  const availableSlots = getAvailableViewingSlots(property.viewingSlots);
  const hasAvailableSlots = availableSlots.length > 0;

  return (
    <>
      <SiteHeader />
      <main>
        <div className="container property-shell">
          <PropertyGallery images={property.images} />

          <div className="property-layout">
            <div className="property-content">
              <section className="property-intro">
                <p className="eyebrow">{property.publicLocation}</p>
                <h1>{property.title}</h1>
                <p className="property-summary">{property.summary}</p>
                <div className="spec-list" aria-label="房源主要規格">
                  <span>{property.propertyType}</span>
                  <span>{property.layout}</span>
                  <span>{property.areaPing} 坪</span>
                  <span>{property.floorLabel}</span>
                </div>
                <MemberVerificationBadge level={property.provider.memberBadge} providerName={property.provider.displayName} />
                <PropertyVerificationBadges verification={property.verification} />
              </section>

              <PropertySection id="fees" eyebrow="每一筆都說清楚" title="租金與完整費用">
                <dl className="fee-list">
                  <div><dt>每月租金</dt><dd>{money.format(property.monthlyRent)}</dd></div>
                  <div><dt>押金</dt><dd>{money.format(property.depositAmount)}（2 個月）</dd></div>
                  {property.fees.map((fee) => <div key={fee.name}><dt>{fee.name}</dt><dd>{fee.value}<small>{fee.note}</small></dd></div>)}
                </dl>
              </PropertySection>

              <PropertySection id="details" eyebrow="入住前先確認" title="設備、條件與已知現況">
                <div className="detail-columns">
                  <div><h3>家具與設備</h3><ul className="check-list">{property.equipment.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><h3>租屋條件</h3><ul className="check-list">{property.conditions.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  {property.services.length ? <div><h3>服務項目</h3><ul className="check-list">{property.services.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
                </div>
                {property.knownConditions.length ? <div className="notice"><strong>已知現況</strong><ul>{property.knownConditions.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
              </PropertySection>

              <PropertySection eyebrow="生活便利度" title="位置與周邊">
                <div className="location-placeholder"><span>中山區・行天宮站周邊</span><small>為保護居住隱私，公開頁不顯示完整門牌</small></div>
                <ul className="nearby-list">{property.nearby.map((item) => <li key={item}>{item}</li>)}</ul>
              </PropertySection>
            </div>

            <aside className="booking-card" id="viewing">
              <p className="booking-price"><strong>{money.format(property.monthlyRent)}</strong>／月</p>
              <p>押金 {money.format(property.depositAmount)}</p>
              <dl className="booking-meta">
                <div><dt>可入住</dt><dd>{new Date(property.availableFrom).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })}</dd></div>
                <div><dt>最短租期</dt><dd>{property.minimumLeaseMonths} 個月</dd></div>
                <div><dt>預約門檻</dt><dd>{viewingRequirementCopy[property.viewingRequirement].label}</dd></div>
              </dl>
              {hasAvailableSlots ? (
                <div className="slot-preview">
                  <strong>近期可約</strong>
                  {availableSlots.slice(0, 3).map((slot) => <span key={slot.id}>{formatViewingSlot(slot)}</span>)}
                </div>
              ) : (
                <p className="no-slots">目前尚未開放預約時段。</p>
              )}
              <p className="booking-note">房源提供者開放時段後，頁面底部才會出現預約入口。</p>
            </aside>
          </div>
        </div>
      </main>
      {hasAvailableSlots ? (
        <div className="booking-bar" aria-label="預約看房">
          <div className="booking-bar-inner container">
            <div>
              <strong>{money.format(property.monthlyRent)}</strong><small>／月</small>
              <span>最近可約：{formatViewingSlot(availableSlots[0])}</span>
            </div>
            <Link className="button button-primary" href={currentUser ? "/viewing" : "/login?next=/viewing"}>預約看房</Link>
          </div>
        </div>
      ) : null}
      <SiteFooter />
    </>
  );
}
