"use client";

import { useState } from "react";
import type { ListingTag } from "@/features/property/listing-tags";

function formatServiceName(name: string) {
  return name.length > 5 ? `${name.slice(0, 5)}...` : name;
}

export function PropertyServiceEditor({ tags = [], selectedTagIds }: { tags?: ListingTag[]; selectedTagIds?: string[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => selectedTagIds ?? []);

  function toggleService(id: string) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  return (
    <div className="service-editor admin-form-wide">
      <div className="fee-editor-heading">
        <div>
          <h3>服務項目</h3>
          <p>勾選房源或社區額外提供的服務；未勾選時公開頁不顯示此區塊。</p>
        </div>
      </div>
      <div className="equipment-editor-grid">
        {tags.length ? tags.map((tag) => {
          const selected = selectedIds.includes(tag.id);
          return (
            <label className={`equipment-option${selected ? " is-selected" : ""}`} key={tag.id}>
              <input checked={selected} type="checkbox" onChange={() => toggleService(tag.id)}/>
              <span title={tag.name}>{formatServiceName(tag.name)}</span>
            </label>
          );
        }) : <p className="form-note">尚未建立服務項目標籤。</p>}
      </div>
      {selectedIds.map((id) => (
        <input type="hidden" name="listingTagId" value={id} key={id}/>
      ))}
    </div>
  );
}
