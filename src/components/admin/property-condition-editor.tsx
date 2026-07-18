"use client";

import { useState } from "react";
import type { ListingTag } from "@/features/property/listing-tags";

const defaultRuleNames = ["室內禁菸", "可開伙", "不可養寵物"];

function defaultRuleIds(tags: ListingTag[]) {
  return tags.filter((tag) => defaultRuleNames.includes(tag.name)).map((tag) => tag.id);
}

function formatConditionName(name: string) {
  return name.length > 5 ? `${name.slice(0, 5)}...` : name;
}

export function PropertyConditionEditor({ tags = [], selectedTagIds }: { tags?: ListingTag[]; selectedTagIds?: string[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => selectedTagIds ?? defaultRuleIds(tags));

  function toggleCondition(id: string) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  return (
    <div className="condition-editor admin-form-wide">
      <div className="fee-editor-heading">
        <div>
          <h3>租屋條件</h3>
          <p>從平台公版條件清單勾選，作為首頁呈現與未來搜尋篩選使用。</p>
        </div>
      </div>
      <div className="equipment-editor-grid">
        {tags.length ? tags.map((tag) => {
          const selected = selectedIds.includes(tag.id);
          return (
            <label className={`equipment-option${selected ? " is-selected" : ""}`} key={tag.id}>
              <input checked={selected} type="checkbox" onChange={() => toggleCondition(tag.id)}/>
              <span title={tag.name}>{formatConditionName(tag.name)}</span>
            </label>
          );
        }) : <p className="form-note">尚未建立租屋條件標籤。</p>}
      </div>
      {selectedIds.map((id) => (
        <input type="hidden" name="listingTagId" value={id} key={id}/>
      ))}
    </div>
  );
}
