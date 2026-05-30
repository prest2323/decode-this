// OWNER: Antigravity/Gemini #1 (Input & Voice).
// Job: let the user take a photo (phone) or upload a file, convert to a
// base64 data URL, and call onImage(dataUrl). Keep the props.
// `capture="environment"` opens the rear camera on phones.
"use client";
import { useRef } from "react";

export default function Uploader({
  onImage,
  loading,
}: {
  onImage: (dataUrl: string) => void;
  loading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => onImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <button
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="rounded-2xl bg-black px-8 py-5 text-lg font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Decoding…" : "📷 Take a photo of your document"}
      </button>
      <p className="text-sm text-gray-500">or upload an image</p>
    </div>
  );
}
