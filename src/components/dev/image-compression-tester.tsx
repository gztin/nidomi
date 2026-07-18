"use client";

/* eslint-disable @next/next/no-img-element -- Local object URLs cannot be handled by the Next image optimizer. */

import { useEffect, useRef, useState } from "react";
import { compressImageFile } from "@/features/images/client-compression";
import { formatImageBytes, imageCompressionPolicies, validateImageFile, type ImagePurpose } from "@/features/images/policy";

type ImageFacts = {
  url: string;
  name: string;
  size: number;
  width: number;
  height: number;
};

type CompressionResult = {
  original: ImageFacts;
  compressed: ImageFacts;
  elapsedMs: number;
};

async function getImageDimensions(file: File) {
  const bitmap = await createImageBitmap(file);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensions;
}

export function ImageCompressionTester() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [purpose, setPurpose] = useState<ImagePurpose>("property");
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const policy = imageCompressionPolicies[purpose];

  useEffect(() => () => {
    if (result) {
      URL.revokeObjectURL(result.original.url);
      URL.revokeObjectURL(result.compressed.url);
    }
  }, [result]);

  async function runCompression(file: File) {
    setError(null);
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setProgress(0);
    let originalUrl: string | null = null;
    let compressedUrl: string | null = null;
    try {
      const originalDimensions = await getImageDimensions(file);
      originalUrl = URL.createObjectURL(file);
      const startedAt = performance.now();
      const compressed = await compressImageFile(file, purpose, setProgress);
      const elapsedMs = performance.now() - startedAt;
      const compressedDimensions = await getImageDimensions(compressed);
      compressedUrl = URL.createObjectURL(compressed);
      setResult({
        original: { url: originalUrl, name: file.name, size: file.size, ...originalDimensions },
        compressed: { url: compressedUrl, name: compressed.name, size: compressed.size, ...compressedDimensions },
        elapsedMs,
      });
      originalUrl = null;
      compressedUrl = null;
      setProgress(100);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "圖片壓縮失敗，請更換圖片後再試。" );
    } finally {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const savedBytes = result ? result.original.size - result.compressed.size : 0;
  const reduction = result && result.original.size > 0 ? (savedBytes / result.original.size) * 100 : 0;

  return (
    <section className="admin-panel compression-tester">
      <div className="compression-tester-toolbar">
        <fieldset className="compression-purpose-switch" disabled={busy}>
          <legend>壓縮用途</legend>
          <label className={purpose === "property" ? "is-selected" : ""}><input type="radio" name="purpose" value="property" checked={purpose === "property"} onChange={() => setPurpose("property")} />房源照片</label>
          <label className={purpose === "identity" ? "is-selected" : ""}><input type="radio" name="purpose" value="identity" checked={purpose === "identity"} onChange={() => setPurpose("identity")} />身分證件</label>
        </fieldset>
        <label className={`button button-primary compression-file-button${busy ? " is-disabled" : ""}`}>
          選擇圖片
          <input ref={inputRef} type="file" accept="image/jpeg,image/png" disabled={busy} onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void runCompression(file);
          }} />
        </label>
      </div>

      <dl className="compression-policy-summary">
        <div><dt>目標容量</dt><dd>{policy.maxSizeMB} MB</dd></div>
        <div><dt>最長邊</dt><dd>{policy.maxWidthOrHeight.toLocaleString()} px</dd></div>
        <div><dt>起始品質</dt><dd>{Math.round(policy.initialQuality * 100)}%</dd></div>
      </dl>

      {busy && <div className="image-compression-progress" role="status"><span style={{ width: `${progress}%` }} /><strong>正在壓縮圖片 {progress}%</strong></div>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {result ? <>
        <div className="compression-preview-grid">
          <figure><div><img src={result.original.url} alt="原始圖片預覽" /></div><figcaption><strong>原始圖片</strong><span>{result.original.name}</span></figcaption></figure>
          <figure><div><img src={result.compressed.url} alt="壓縮後圖片預覽" /></div><figcaption><strong>壓縮結果</strong><span>{result.compressed.name}</span></figcaption></figure>
        </div>
        <dl className="compression-result-grid">
          <div><dt>原始容量</dt><dd>{formatImageBytes(result.original.size)}</dd></div>
          <div><dt>壓縮後容量</dt><dd>{formatImageBytes(result.compressed.size)}</dd></div>
          <div><dt>減少容量</dt><dd>{savedBytes > 0 ? formatImageBytes(savedBytes) : "0 B"}</dd></div>
          <div><dt>壓縮率</dt><dd>{Math.max(0, reduction).toFixed(1)}%</dd></div>
          <div><dt>原始尺寸</dt><dd>{result.original.width} × {result.original.height}</dd></div>
          <div><dt>壓縮後尺寸</dt><dd>{result.compressed.width} × {result.compressed.height}</dd></div>
          <div><dt>處理時間</dt><dd>{(result.elapsedMs / 1000).toFixed(2)} 秒</dd></div>
        </dl>
        <div className="compression-download-row"><a className="button button-secondary" href={result.compressed.url} download={result.compressed.name}>下載壓縮檔</a></div>
      </> : <div className="compression-tester-empty">尚未選擇測試圖片。</div>}
    </section>
  );
}
