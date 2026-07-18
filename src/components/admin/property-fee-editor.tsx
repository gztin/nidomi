"use client";

import { useRef, useState } from "react";

export type EditablePropertyFee = {
  name: string;
  billingMode: "bill" | "fixed";
  amount?: number;
};

const defaultFees: EditablePropertyFee[] = [
  { name: "水費", billingMode: "bill" },
  { name: "電費", billingMode: "bill" },
];

export function PropertyFeeEditor({ fees = defaultFees }: { fees?: EditablePropertyFee[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<EditablePropertyFee[]>(fees.length ? fees : defaultFees);
  const [name, setName] = useState("");
  const [billingMode, setBillingMode] = useState<EditablePropertyFee["billingMode"]>("bill");
  const [amount, setAmount] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function openDialog() {
    setName("");
    setBillingMode("bill");
    setAmount("");
    setEditingIndex(null);
    dialogRef.current?.showModal();
  }

  function openEditDialog(index: number) {
    const item = items[index];
    if (!item) return;
    setName(item.name);
    setBillingMode(item.billingMode);
    setAmount(item.amount ? String(item.amount) : "");
    setEditingIndex(index);
    dialogRef.current?.showModal();
  }

  function saveFee() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (billingMode === "fixed" && Number(amount) <= 0) return;
    const nextItem = {
      name: trimmedName,
      billingMode,
      amount: billingMode === "fixed" ? Number(amount) : undefined,
    };
    setItems((current) => editingIndex === null
      ? [...current, nextItem]
      : current.map((item, index) => index === editingIndex ? nextItem : item));
    dialogRef.current?.close();
  }

  function removeFee(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="fee-editor admin-form-wide">
      <div className="fee-editor-heading">
        <div>
          <h3>其他費用</h3>
          <p>新增首頁會顯示的水費、電費、管理費或其他費用。</p>
        </div>
        <button className="button button-secondary" type="button" onClick={openDialog}>新增費用</button>
      </div>
      <div className="fee-editor-list">
        {items.length ? items.map((item, index) => (
          <div className="fee-editor-item" key={`${item.name}-${index}`}>
            <input type="hidden" name="feeName" value={item.name}/>
            <input type="hidden" name="feeBillingMode" value={item.billingMode}/>
            <input type="hidden" name="feeAmount" value={item.amount ?? ""}/>
            <div className="fee-editor-info">
              <strong>{item.name}</strong>
              <span>{item.billingMode === "bill" ? "依帳單繳費" : `每月 NT$ ${item.amount?.toLocaleString()}`}</span>
            </div>
            <div className="fee-editor-actions">
              <button type="button" onClick={() => openEditDialog(index)} aria-label={`編輯 ${item.name}`}>編輯</button>
              <button type="button" onClick={() => removeFee(index)} aria-label={`移除 ${item.name}`}>移除</button>
            </div>
          </div>
        )) : <p className="form-note">尚未新增其他費用。</p>}
      </div>
      <dialog className="admin-dialog" ref={dialogRef}>
        <div className="admin-dialog-panel">
          <div className="admin-dialog-header">
            <h3>{editingIndex === null ? "新增費用" : "編輯費用"}</h3>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="關閉">×</button>
          </div>
          <label>費用名稱
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：管理費"/>
          </label>
          <label className="admin-check fee-dialog-check">
            <input type="checkbox" checked={billingMode === "bill"} onChange={(event) => setBillingMode(event.target.checked ? "bill" : "fixed")}/>
            依帳單繳費
          </label>
          <label>費用金額
            <input value={amount} onChange={(event) => setAmount(event.target.value)} disabled={billingMode === "bill"} type="number" min="1" placeholder="例如：1500"/>
          </label>
          <div className="admin-dialog-actions">
            <button className="button button-secondary" type="button" onClick={() => dialogRef.current?.close()}>取消</button>
            <button className="button button-primary" type="button" onClick={saveFee}>{editingIndex === null ? "確認新增" : "儲存修改"}</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
