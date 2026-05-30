import Image from "next/image";

// Brand lockup: the logo mark + the "Decode This" wordmark in Deep Forest Teal.
export function Wordmark({
  size = 36,
  textClass = "text-xl",
  withMark = true,
}: {
  size?: number;
  textClass?: string;
  withMark?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {withMark && (
        <Image
          src="/logo.svg"
          alt="Decode This"
          width={size}
          height={size}
          priority
          style={{ width: size, height: size }}
          className="object-contain"
        />
      )}
      <span
        className={`font-display font-semibold tracking-tight text-calm ${textClass}`}
      >
        Decode This
      </span>
    </div>
  );
}
