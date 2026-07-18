"use client";

import { useRef } from "react";

export function ListingTagCreateDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className="button button-primary" type="button" onClick={() => dialogRef.current?.showModal()}>新增標籤</button>
      <dialog className="admin-dialog" ref={dialogRef}>
        <form className="admin-dialog-panel" action="/api/admin/listing-tags" method="post">
          <div className="admin-dialog-header">
            <h3>新增公版標籤</h3>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="關閉">×</button>
          </div>
          <label>類別
            <select name="category" required defaultValue="item">
              <option value="item">租屋設備</option>
              <option value="rule">租屋條件</option>
              <option value="service">服務項目</option>
            </select>
          </label>
          <label>標籤名稱
            <input name="name" required maxLength={40} placeholder="例如：冷氣"/>
          </label>
          <div className="admin-dialog-actions">
            <button className="button button-secondary" type="button" onClick={() => dialogRef.current?.close()}>取消</button>
            <button className="button button-primary" type="submit">新增標籤</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
