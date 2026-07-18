import { parseFloorNumber, parseLayoutParts } from "@/features/property/form-values";
import { PropertyConditionEditor } from "@/components/admin/property-condition-editor";
import { PropertyEquipmentEditor, type EditablePropertyEquipment } from "@/components/admin/property-equipment-editor";
import { PropertyFeeEditor, type EditablePropertyFee } from "@/components/admin/property-fee-editor";
import { PropertyServiceEditor } from "@/components/admin/property-service-editor";
import { PropertyImageManager, type ManagedPropertyImage } from "@/components/property/property-image-manager";
import type { ListingTag } from "@/features/property/listing-tags";

export type PropertyFormValues = {
  title?: string;
  summary?: string;
  description?: string;
  propertyType?: string;
  rentalScope?: string;
  monthlyRent?: number;
  depositAmount?: number;
  paymentCycle?: string;
  paymentDueRule?: string;
  layout?: string;
  areaPing?: number;
  floorLabel?: string;
  totalFloors?: number;
  hasElevator?: number | boolean;
  publicLocation?: string;
  privateAddress?: string;
  availableFrom?: string;
  minimumLeaseMonths?: number;
  electricityBillingType?: string;
  electricityRule?: string;
  electricityInformationMethod?: string;
  viewingRequirement?: string;
  fees?: EditablePropertyFee[];
  equipment?: EditablePropertyEquipment[];
  selectedListingTagIds?: string[];
  rentalConditionsText?: string;
  knownConditionsText?: string;
  nearbyText?: string;
};

type PropertyFormProps = {
  action: string;
  mode: "create" | "edit";
  submitLabel: string;
  values?: PropertyFormValues;
  listingTags?: ListingTag[];
  propertyId?: string;
  images?: ManagedPropertyImage[];
};

export function PropertyForm({ action, mode, submitLabel, values = {}, listingTags = [], propertyId, images = [] }: PropertyFormProps) {
  const hasElevator = values.hasElevator === true || values.hasElevator === 1;
  const layout = parseLayoutParts(values.layout);
  const floorNumber = parseFloorNumber(values.floorLabel);
  const itemTags = listingTags.filter((tag) => tag.category === "item");
  const ruleTags = listingTags.filter((tag) => tag.category === "rule");
  const serviceTags = listingTags.filter((tag) => tag.category === "service");

  return (
    <form className="admin-property-form" action={action} method="post">
      <section className="admin-panel">
        <h2>基本資料</h2>
        <div className="admin-form-grid">
          <label>房源名稱<input name="title" required maxLength={100} defaultValue={values.title ?? ""}/></label>
          <label className="admin-form-wide">摘要<input name="summary" required maxLength={180} defaultValue={values.summary ?? ""}/></label>
          <label className="admin-form-wide">詳細說明<textarea name="description" required rows={5} defaultValue={values.description ?? ""}/></label>
          <label>房源類型
            <select name="propertyType" required defaultValue={values.propertyType ?? "apartment"}>
              <option value="apartment">公寓／大樓</option>
              <option value="studio">套房</option>
              <option value="house">透天</option>
              <option value="other">其他</option>
              <option value="整層住家">整層住家</option>
            </select>
          </label>
          <label>出租範圍
            <select name="rentalScope" required defaultValue={values.rentalScope ?? "整戶"}>
              <option>整戶</option>
              <option>獨立套房</option>
              <option>雅房</option>
            </select>
          </label>
        </div>
      </section>
      <section className="admin-panel">
        <h2>租金與付款</h2>
        <div className="admin-form-grid">
          <label>每月租金<input name="monthlyRent" type="number" min="1" required defaultValue={values.monthlyRent ?? ""}/></label>
          <label>押金<input name="depositAmount" type="number" min="0" required defaultValue={values.depositAmount ?? ""}/></label>
          <label>付款週期
            <select name="paymentCycle" required defaultValue={values.paymentCycle ?? "monthly"}>
              <option value="monthly">每月</option>
              <option value="quarterly">每季</option>
              <option value="other">其他</option>
            </select>
          </label>
          <label>繳租規則<input name="paymentDueRule" required defaultValue={values.paymentDueRule ?? "每月 5 日前"}/></label>
        </div>
      </section>
      <section className="admin-panel">
        <h2>空間資料</h2>
        <div className="admin-form-grid">
          <label>房間數<input name="bedrooms" type="number" min="0" required defaultValue={Number.isFinite(layout.bedrooms) ? layout.bedrooms : ""}/></label>
          <label>廳數<input name="livingRooms" type="number" min="0" required defaultValue={Number.isFinite(layout.livingRooms) ? layout.livingRooms : ""}/></label>
          <label>衛浴數量<input name="bathrooms" type="number" min="0" required defaultValue={Number.isFinite(layout.bathrooms) ? layout.bathrooms : ""}/></label>
          <label>坪數<input name="areaPing" type="number" min="0.1" step="0.1" required defaultValue={values.areaPing ?? ""}/></label>
          <label>所在樓層<input name="floorNumber" type="number" min="1" required defaultValue={Number.isFinite(floorNumber) ? floorNumber : ""}/></label>
          <label>總樓層<input name="totalFloors" type="number" min="1" required defaultValue={values.totalFloors ?? ""}/></label>
          <label className="admin-check"><input name="hasElevator" type="checkbox" defaultChecked={hasElevator}/> 有電梯</label>
        </div>
      </section>
      <section className="admin-panel">
        <h2>首頁呈現資訊</h2>
        <div className="admin-form-grid">
          <PropertyFeeEditor fees={values.fees}/>
          <PropertyEquipmentEditor tags={itemTags} selectedTagIds={values.selectedListingTagIds}/>
          <PropertyConditionEditor tags={ruleTags} selectedTagIds={values.selectedListingTagIds}/>
          <PropertyServiceEditor tags={serviceTags} selectedTagIds={values.selectedListingTagIds}/>
          <label className="admin-form-wide">注意事項
            <textarea name="knownConditionsText" rows={5} placeholder={"每行一筆，例如：\n浴室無對外窗，設有抽風設備\n無車位\n房源位於住宅區，晚間請降低音量"} defaultValue={values.knownConditionsText ?? ""}/>
          </label>
          <label className="admin-form-wide">周邊資訊
            <textarea name="nearbyText" rows={4} placeholder={"每行一筆，例如：\n行天宮站步行約 7 分鐘\n超商步行約 2 分鐘"} defaultValue={values.nearbyText ?? ""}/>
          </label>
        </div>
      </section>
      <section className="admin-panel">
        <h2>位置與入住</h2>
        <div className="admin-form-grid">
          <label>公開地區<input name="publicLocation" required placeholder="例如：台北市中山區" defaultValue={values.publicLocation ?? ""}/></label>
          <label>完整地址<input name="privateAddress" required defaultValue={values.privateAddress ?? ""}/></label>
          <label>可入住日期<input name="availableFrom" type="date" required defaultValue={values.availableFrom ?? ""}/></label>
          <label>最短租期（月）<input name="minimumLeaseMonths" type="number" min="1" required defaultValue={values.minimumLeaseMonths ?? 12}/></label>
        </div>
      </section>
      <section className="admin-panel">
        <h2>電費與預約門檻</h2>
        <div className="admin-form-grid">
          <label>電費類型
            <select name="electricityBillingType" required defaultValue={values.electricityBillingType ?? "metered"}>
              <option value="metered">依電表／帳單</option>
              <option value="non_metered">非電表計費</option>
              <option value="included">已含租金</option>
            </select>
          </label>
          <label>電費計算方式<input name="electricityRule" required placeholder="例如：依台電帳單" defaultValue={values.electricityRule ?? ""}/></label>
          <label>資訊提供方式<input name="electricityInformationMethod" required defaultValue={values.electricityInformationMethod ?? "簽約前提供最近一期帳單"}/></label>
          <label>預約門檻
            <select name="viewingRequirement" required defaultValue={values.viewingRequirement ?? "email_verified"}>
              <option value="email_verified">完成 Email 驗證</option>
              <option value="identity_verified">完成身分驗證</option>
            </select>
          </label>
        </div>
      </section>
      {mode === "edit" && propertyId ? <PropertyImageManager propertyId={propertyId} initialImages={images} /> : null}
      <div className="admin-submit-bar">
        <p>{mode === "create" ? "建立後為草稿，不會顯示在公開首頁。" : "儲存後會更新房源詳情頁與公開資料來源。"}</p>
        <button className="button button-primary" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
