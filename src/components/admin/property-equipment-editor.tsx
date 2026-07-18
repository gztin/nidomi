"use client";

import { useState } from "react";
import type { ListingTag } from "@/features/property/listing-tags";

export type EditablePropertyEquipment = {
  name: string;
  amount?: number;
};

function formatEquipmentName(name: string) {
  return name.length > 5 ? `${name.slice(0, 5)}...` : name;
}

export function PropertyEquipmentEditor({ tags = [], selectedTagIds }: { tags?: ListingTag[]; selectedTagIds?: string[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => selectedTagIds ?? []);

  function toggleEquipment(id: string) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  return (
    <div className="equipment-editor admin-form-wide">
      <div className="fee-editor-heading">
        <div>
          <h3>家具與設備</h3>
          <p>從平台公版設備清單勾選，作為首頁呈現與未來搜尋篩選使用。</p>
        </div>
      </div>
      <div className="equipment-editor-grid">
        {tags.length ? tags.map((tag) => {
          const selected = selectedIds.includes(tag.id);
          return (
            <label className={`equipment-option${selected ? " is-selected" : ""}`} key={tag.id}>
              <input checked={selected} type="checkbox" onChange={() => toggleEquipment(tag.id)}/>
              <span title={tag.name}>{formatEquipmentName(tag.name)}</span>
            </label>
          );
        }) : <p className="form-note">尚未建立設備標籤。</p>}
      </div>
      {selectedIds.map((id) => (
        <input type="hidden" name="listingTagId" value={id} key={id}/>
      ))}
    </div>
  );
}
