import Image from "next/image";

/**
 * Brand lockup: the wave mark (`public/logo.svg`) plus the wordmark set as live text, so it
 * renders in the page font rather than whatever an <img>-embedded SVG falls back to.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Image src="/logo.svg" alt="" width={26} height={26} priority />
      <span style={{ fontWeight: 600, fontSize: 19, letterSpacing: "-0.03em" }}>sunday</span>
    </span>
  );
}
