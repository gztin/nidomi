"use client";

import { useRef } from "react";
import type { ListingTag } from "@/features/property/listing-tags";

export function ListingTagEditDialog({ tag }: { tag: ListingTag }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className="tag-text-button" type="button" onClick={() => dialogRef.current?.showModal()}>編輯</button>
      <dialog className="admin-dialog" ref={dialogRef}>
        <form className="admin-dialog-panel" action={`/api/admin/listing-tags/${tag.id}`} method="post">
          <div className="admin-dialog-header">
            <h3>編輯公版標籤</h3>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="關閉">×</button>
          </div>
          <label>類別
            <select name="category" required defaultValue={tag.category}>
              <option value="item">租屋設備</option>
              <option value="rule">租屋條件</option>
              <option value="service">服務項目</option>
            </select>
          </label>
          <label>標籤名稱
            <input name="name" required maxLength={40} defaultValue={tag.name}/>
          </label>
          <div className="admin-dialog-actions">
            <button className="button button-secondary" type="button" onClick={() => dialogRef.current?.close()}>取消</button>
            <button className="button button-primary" name="intent" value="update" type="submit">儲存修改</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
