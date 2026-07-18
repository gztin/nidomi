"use client";

/* eslint-disable @next/next/no-img-element -- Local object URLs cannot be handled by the Next image optimizer. */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { compressImageFile } from "@/features/images/client-compression";
import { PolicyContent } from "@/components/policy/policy-content";
import { identityDataUseNotice } from "@/content/identity-data-use-notice";
import {
  formatImageBytes,
  validateIdentityImageDimensions,
  validateImageFile,
} from "@/features/images/policy";

type IdentityVerificationFormProps = {
  submitLabel?: string;
  confirmBeforeSubmit?: boolean;
  onCancel?: () => void;
};

type ImagePreview = {
  url: string;
  name: string;
  size: number;
  width: number;
  height: number;
};

async function createImagePreview(file: File): Promise<ImagePreview> {
  const fileError = validateImageFile(file);
  if (fileError) throw new Error(fileError);

  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();
  const dimensionError = validateIdentityImageDimensions(width, height);
  if (dimensionError) throw new Error(dimensionError);

  return { url: URL.createObjectURL(file), name: file.name, size: file.size, width, height };
}

function IdentityImagePreview({ side, preview }: { side: string; preview: ImagePreview }) {
  return <figure className="identity-upload-preview">
    <div><img src={preview.url} alt={`身分證明文件${side}預覽`} /></div>
    <figcaption>
      <strong>{side}預覽</strong>
      <span>{preview.name}</span>
      <small>{formatImageBytes(preview.size)}・{preview.width} × {preview.height}px</small>
    </figcaption>
  </figure>;
}

export function IdentityVerificationForm({ submitLabel = "送出審核", confirmBeforeSubmit = false, onCancel }: IdentityVerificationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const errorDialogRef = useRef<HTMLDialogElement>(null);
  const noticeDialogRef = useRef<HTMLDialogElement>(null);
  const confirmedRef = useRef(false);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frontPreview, setFrontPreview] = useState<ImagePreview | null>(null);
  const [backPreview, setBackPreview] = useState<ImagePreview | null>(null);
  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [errorTitle, setErrorTitle] = useState("資料尚未完成");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => () => {
    if (frontPreview) URL.revokeObjectURL(frontPreview.url);
  }, [frontPreview]);

  useEffect(() => () => {
    if (backPreview) URL.revokeObjectURL(backPreview.url);
  }, [backPreview]);

  function showError(message: string, title = "資料尚未完成") {
    setErrorTitle(title);
    setErrorMessage(message);
    window.requestAnimationFrame(() => errorDialogRef.current?.showModal());
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>, side: "front" | "back") {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const setPreview = side === "front" ? setFrontPreview : setBackPreview;
    const sideLabel = side === "front" ? "正面" : "反面";
    if (!file) {
      setPreview(null);
      return;
    }

    try {
      setPreview(await createImagePreview(file));
    } catch (error) {
      input.value = "";
      setPreview(null);
      showError(`${sideLabel}圖片不符合規定：${error instanceof Error ? error.message : "請重新選擇圖片。"}`, "圖片無法使用");
    }
  }

  async function submitCompressed(form: HTMLFormElement) {
    setCompressing(true);
    setProgress(0);
    try {
      const formData = new FormData(form);
      const front = formData.get("identityFront");
      const back = formData.get("identityBack");
      if (!(front instanceof File) || !(back instanceof File)) throw new Error("請選擇身分證明文件正反面。");

      const compressedFront = await compressImageFile(front, "identity", (value) => setProgress(Math.round(value / 2)));
      const compressedBack = await compressImageFile(back, "identity", (value) => setProgress(50 + Math.round(value / 2)));
      formData.set("identityFront", compressedFront);
      formData.set("identityBack", compressedBack);

      const response = await fetch(form.action, { method: "POST", body: formData });
      window.location.assign(response.url);
    } catch (error) {
      confirmedRef.current = false;
      showError(error instanceof Error ? error.message : "圖片壓縮失敗，請重新選擇圖片。", "圖片處理失敗");
      setCompressing(false);
      setProgress(0);
    }
  }

  return (
    <form ref={formRef} className="verification-form" action="/api/account/verification" method="post" encType="multipart/form-data" noValidate onSubmit={async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const identityNumber = String(formData.get("identityNumber") ?? "").trim();
      const missingItems: string[] = [];
      if (!identityNumber) missingItems.push("身分證字號");
      if (!frontPreview) missingItems.push("身分證明文件正面");
      if (!backPreview) missingItems.push("身分證明文件反面");
      if (!noticeAccepted) missingItems.push("身分驗證資料使用說明同意");
      if (missingItems.length > 0) {
        showError(`請完成以下項目：${missingItems.join("、")}。`);
        return;
      }
      if (!/^[A-Za-z][12][0-9]{8}$/.test(identityNumber)) {
        showError("身分證字號格式不正確，請輸入 1 個英文字母及 9 個數字。", "資料格式不正確");
        return;
      }
      if (confirmBeforeSubmit && !confirmedRef.current) {
        dialogRef.current?.showModal();
        return;
      }
      await submitCompressed(event.currentTarget);
    }}>
      <label>身分證字號<input name="identityNumber" autoCapitalize="characters" autoComplete="off" inputMode="text" maxLength={10} pattern="[A-Za-z][12][0-9]{8}" required /></label>
      <div className="identity-upload-requirements">
        <strong>圖片上傳限制</strong>
        <ul>
          <li>僅接受 JPG、PNG，每張原始圖片最多 5MB。</li>
          <li>長邊至少 960px、短邊至少 600px。</li>
          <li>請分別上傳正面與反面，並確認文字、照片及四角完整清晰。</li>
        </ul>
      </div>
      <div className="identity-upload-field">
        <label>身分證明文件正面<input name="identityFront" type="file" accept="image/jpeg,image/png" disabled={compressing} required onChange={(event) => void handleImageChange(event, "front")} /></label>
        {frontPreview && <IdentityImagePreview side="正面" preview={frontPreview} />}
      </div>
      <div className="identity-upload-field">
        <label>身分證明文件反面<input name="identityBack" type="file" accept="image/jpeg,image/png" disabled={compressing} required onChange={(event) => void handleImageChange(event, "back")} /></label>
        {backPreview && <IdentityImagePreview side="反面" preview={backPreview} />}
      </div>
      <div className="policy-checklist identity-notice-checklist">
        <button type="button" onClick={() => noticeDialogRef.current?.showModal()}>
          <span>{identityDataUseNotice.title}<small>版本 {identityDataUseNotice.version}</small></span>
          <strong>{noticeAccepted ? "✓ 已了解並同意" : "查看說明"}</strong>
        </button>
      </div>
      {noticeAccepted && <input name="consent" type="hidden" value={identityDataUseNotice.version} />}
      {compressing && <div className="image-compression-progress" role="status"><span style={{ width: `${progress}%` }} /><strong>正在壓縮圖片 {progress}%</strong></div>}
      <div className="member-account-actions">
        <button className="button button-primary" type="submit" disabled={compressing}>{compressing ? "處理圖片中" : submitLabel}</button>
        {onCancel && <button className="button button-secondary" type="button" disabled={compressing} onClick={onCancel}>取消</button>}
      </div>
      <p className="form-note">完整字號會加密保存；審核通過後，同一身分證字號不得再驗證其他帳號。</p>
      <dialog className="admin-success-dialog admin-error-dialog" ref={errorDialogRef}>
        <div className="admin-success-dialog-panel">
          <div><strong>{errorTitle}</strong><p>{errorMessage}</p></div>
          <button className="button button-secondary" type="button" onClick={() => errorDialogRef.current?.close()}>返回填寫</button>
        </div>
      </dialog>
      <dialog className="policy-reading-dialog identity-notice-dialog" ref={noticeDialogRef}>
        <header className="policy-reading-header">
          <div><small>版本 {identityDataUseNotice.version}</small><h2>{identityDataUseNotice.title}</h2></div>
          <button type="button" aria-label="關閉" onClick={() => noticeDialogRef.current?.close()}>×</button>
        </header>
        <div className="policy-reading-body"><PolicyContent markdown={identityDataUseNotice.markdown} /></div>
        <footer className="policy-reading-footer identity-notice-footer">
          <button className="button button-secondary" type="button" onClick={() => noticeDialogRef.current?.close()}>取消</button>
          <button className="button button-primary" type="button" onClick={() => {
            setNoticeAccepted(true);
            noticeDialogRef.current?.close();
          }}>我已了解並同意</button>
        </footer>
      </dialog>
      {confirmBeforeSubmit && <dialog className="admin-success-dialog" ref={dialogRef}>
        <div className="admin-success-dialog-panel">
          <div><strong>確認更新送審資料</strong><p>送出成功後，目前審核中的資料將撤回，並以新版本重新排隊審核。</p></div>
          <div className="identity-update-dialog-actions">
            <button className="button button-secondary" type="button" onClick={() => dialogRef.current?.close()}>返回檢查</button>
            <button className="button button-primary" type="button" onClick={() => {
              confirmedRef.current = true;
              dialogRef.current?.close();
              formRef.current?.requestSubmit();
            }}>確認送出</button>
          </div>
        </div>
      </dialog>}
    </form>
  );
}
