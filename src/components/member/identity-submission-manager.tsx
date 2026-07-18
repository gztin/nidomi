"use client";

/* eslint-disable @next/next/no-img-element -- Protected document URLs require the member session and cannot use the image optimizer. */

import { useRef, useState } from "react";
import { IdentityVerificationForm } from "@/components/member/identity-verification-form-demo";

type IdentitySubmissionManagerProps = {
  submissionId: string;
  maskedIdentityNumber: string;
  submittedAt: string;
  statusLabel: string;
  mayUpload: boolean;
  hasFront: boolean;
  hasBack: boolean;
  frontMimeType: string | null;
  backMimeType: string | null;
};

function DocumentWatermark() {
  return <span className="identity-document-watermark" aria-hidden="true">
    {Array.from({ length: 8 }, (_, index) => <span key={index}>僅供 nidomi 平台做身分檢核</span>)}
  </span>;
}

function DocumentPreview({ url, title, mimeType }: { url: string; title: string; mimeType: string | null }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (mimeType?.startsWith("image/")) {
    return <>
      <button className="identity-document-preview" type="button" aria-haspopup="dialog" aria-label={`放大${title}`} onClick={() => dialogRef.current?.showModal()}>
        <img src={url} alt={title} loading="lazy" />
        <DocumentWatermark />
      </button>
      <dialog className="identity-document-dialog" ref={dialogRef} onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}>
        <div className="identity-document-dialog-panel">
          <header><strong>{title}</strong><button type="button" aria-label="關閉放大圖片" onClick={() => dialogRef.current?.close()}>×</button></header>
          <div className="identity-document-dialog-preview">
            <img src={url} alt={title} />
            <DocumentWatermark />
          </div>
        </div>
      </dialog>
    </>;
  }

  return <div className="identity-document-pdf"><iframe src={url} title={title} loading="lazy" /><a href={url} target="_blank" rel="noreferrer">開啟完整文件</a></div>;
}

export function IdentitySubmissionManager(props: IdentitySubmissionManagerProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <IdentityVerificationForm submitLabel="送出更新" confirmBeforeSubmit onCancel={() => setEditing(false)} />;
  }

  return (
    <section className="identity-submission-panel">
      <div className="identity-submission-heading">
        <div>
          <span>目前送審資料</span>
          <strong>{props.statusLabel}</strong>
        </div>
        <small>送出時間：{props.submittedAt}</small>
      </div>
      <dl className="identity-submission-meta">
        <div><dt>身分證字號</dt><dd>{props.maskedIdentityNumber || "已加密保存"}</dd></div>
      </dl>
      <div className="identity-document-grid">
        <article>
          <h2>身分證明文件正面</h2>
          {props.hasFront
            ? <DocumentPreview url={`/api/account/verification/${props.submissionId}/documents/front`} title="目前送審的身分證明文件正面" mimeType={props.frontMimeType} />
            : <p>目前沒有正面文件。</p>}
        </article>
        <article>
          <h2>身分證明文件反面</h2>
          {props.hasBack
            ? <DocumentPreview url={`/api/account/verification/${props.submissionId}/documents/back`} title="目前送審的身分證明文件反面" mimeType={props.backMimeType} />
            : <p>目前沒有反面文件。</p>}
        </article>
      </div>
      {props.mayUpload && <div className="identity-submission-actions"><button className="button button-primary" type="button" onClick={() => setEditing(true)}>更新資料</button></div>}
    </section>
  );
}
