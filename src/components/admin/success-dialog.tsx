"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SuccessDialogProps = {
  title: string;
  body: string;
  tone?: "success" | "error";
};

export function SuccessDialog({ title, body, tone = "success" }: SuccessDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function clearStatus() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.delete("reason");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <dialog className={`admin-success-dialog ${tone === "error" ? "admin-error-dialog" : ""}`} ref={dialogRef} onClose={clearStatus}>
      <div className="admin-success-dialog-panel">
        <div>
          <strong>{title}</strong>
          <p>{body}</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => dialogRef.current?.close()}>確認</button>
      </div>
    </dialog>
  );
}
