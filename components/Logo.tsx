import Image from "next/image";

// Shared brand mark — the real logo.svg (teal "D" with a river to a rising sun).
// `size` controls the square icon; `withText` appends the wordmark.
export function Logo({
  size = 36,
  withText = true,
  textClass = "text-xl",
}: {
  size?: number;
  withText?: boolean;
  textClass?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.svg"
        alt="Decode It"
        width={size}
        height={size}
        priority
        style={{ width: size, height: size }}
        className="object-contain"
      />
      {withText && (
        <span
          className={`font-display font-semibold tracking-tight text-ink ${textClass}`}
        >
          Decode It
        </span>
      )}
    </div>
  );
}
