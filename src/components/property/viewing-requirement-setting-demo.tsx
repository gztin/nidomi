"use client";

import { useState } from "react";
import type { ViewingRequirement } from "@/features/property/types";
import { viewingRequirementCopy } from "@/features/viewing/requirement";

export function ViewingRequirementSettingDemo({initialValue}:{initialValue:ViewingRequirement}) {
  const [value, setValue] = useState<ViewingRequirement>(initialValue);
  return <form className="verification-form" action="/api/provider/viewing-requirement" method="post">
    {(Object.keys(viewingRequirementCopy) as ViewingRequirement[]).map((requirement) => <label className="requirement-option" key={requirement}>
      <input type="radio" name="requirement" checked={value === requirement} onChange={() => setValue(requirement)} />
      <span><strong>{viewingRequirementCopy[requirement].label}</strong><small>{viewingRequirementCopy[requirement].description}</small></span>
    </label>)}
    <div className="privacy-notice"><strong>目前選擇：{viewingRequirementCopy[value].label}</strong><p>變更只影響新的預約，不會取消已送出或已確認的預約。</p></div>
    <button className="button button-primary" type="submit">儲存預約門檻</button>
    <p className="form-note">儲存後會寫入 D1，並保留門檻變更紀錄。</p>
  </form>;
}
