"use client";

export function ConfirmSubmitButton({ className, message, name, value, children }: { className?: string; message: string; name: string; value: string; children: React.ReactNode }) {
  return (
    <button
      className={className}
      name={name}
      value={value}
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
