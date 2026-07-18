"use client";

/* eslint-disable @next/next/no-img-element -- These images are served by an authenticated same-origin R2 route. */

import { useRef, useState } from "react";
import { compressImageFile } from "@/features/images/client-compression";
import { formatImageBytes, PROPERTY_IMAGE_LIMIT, validateImageFile } from "@/features/images/policy";

export type ManagedPropertyImage = {
  id: string;
  url: string;
  byteSize: number;
  isCover: boolean;
};

export function PropertyImageManager({ propertyId, initialImages }: { propertyId: string; initialImages: ManagedPropertyImage[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const remaining = PROPERTY_IMAGE_LIMIT - images.length;

  async function uploadFiles(files: File[]) {
    setMessage(null);
    if (!files.length) return;
    if (files.length > remaining) {
      setMessage(`目前最多還能上傳 ${remaining} 張照片。`);
      return;
    }
    const validationError = files.map(validateImageFile).find(Boolean);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setBusy(true);
    setProgress(0);
    try {
      const formData = new FormData();
      for (let index = 0; index < files.length; index += 1) {
        const compressed = await compressImageFile(files[index], "property", (value) => {
          setProgress(Math.round(((index + value / 100) / files.length) * 100));
        });
        formData.append("images", compressed);
      }
      const response = await fetch(`/api/properties/${propertyId}/images`, { method: "POST", body: formData });
      const result = await response.json() as { images?: ManagedPropertyImage[]; error?: string };
      if (!response.ok || !result.images) throw new Error(result.error ?? "照片上傳失敗。");
      setImages((current) => [...current, ...result.images!]);
      setProgress(100);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "照片上傳失敗。");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeImage(image: ManagedPropertyImage) {
    if (!window.confirm("確定要移除這張房源照片嗎？")) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/properties/${propertyId}/images/${image.id}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "照片移除失敗。");
      setImages((current) => {
        const next = current.filter((item) => item.id !== image.id);
        return image.isCover && next.length ? next.map((item, index) => ({ ...item, isCover: index === 0 })) : next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "照片移除失敗。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-panel property-image-manager">
      <div className="property-image-heading">
        <div><h2>房源照片</h2><p>已上傳 {images.length}／{PROPERTY_IMAGE_LIMIT} 張</p></div>
        <label className={`button button-secondary${remaining === 0 || busy ? " is-disabled" : ""}`}>
          新增照片
          <input ref={inputRef} type="file" accept="image/jpeg,image/png" multiple disabled={remaining === 0 || busy} onChange={(event) => void uploadFiles(Array.from(event.target.files ?? []))} />
        </label>
      </div>
      <p className="form-note">僅接受 JPG、PNG，每張原始圖片最多 5MB；系統會在上傳前自動壓縮。每間房源最多 10 張。</p>
      {busy && <div className="image-compression-progress" role="status"><span style={{ width: `${progress}%` }} /><strong>正在處理照片 {progress}%</strong></div>}
      {message && <p className="form-error" role="alert">{message}</p>}
      {images.length ? <div className="property-image-grid">
        {images.map((image) => <article key={image.id}>
          <div className="property-image-preview"><img src={image.url} alt={image.isCover ? "房源封面照片" : "房源照片"} /></div>
          <div><span>{image.isCover ? "封面" : formatImageBytes(image.byteSize)}</span><button type="button" disabled={busy} onClick={() => void removeImage(image)}>移除</button></div>
        </article>)}
      </div> : <div className="property-image-empty">尚未上傳房源照片。</div>}
    </section>
  );
}
