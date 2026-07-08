"use client";

import { useRef, useState, useCallback } from "react";
import { uploadPhoto, uploadIdDoc } from "@/actions/upload.actions";

interface UploadFormProps {
  action: "photo" | "id";
  label: string;
  icon: React.ReactNode;
}

export function UploadForm({ action, label, icon }: UploadFormProps) {
  const ref = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);

  const handleFile = useCallback(async () => {
    const files = inputRef.current?.files;
    if (!files?.length || uploading) return;
    setUploading(true);
    setError(false);

    const fd = new FormData();
    fd.set("file", files[0]);
    const fn = action === "photo" ? uploadPhoto : uploadIdDoc;
    const result = await fn(fd);
    if (result.error) {
      setError(true);
    }
    setUploading(false);
    ref.current?.reset();
  }, [action, uploading]);

  return (
    <form ref={ref}>
      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm cursor-pointer hover:bg-accent transition-colors">
        {icon}
        <span>{uploading ? "Uploading..." : label}</span>
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFile}
        />
      </label>
      {error && (
        <p className="text-xs text-destructive mt-1" role="alert">Upload failed. Use JPEG/PNG/WebP under 5MB.</p>
      )}
    </form>
  );
}
