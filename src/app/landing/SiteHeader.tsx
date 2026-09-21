import Link from "next/link";
import Logo from "./Logo";
import s from "./landing.module.css";

/**
 * Top bar shared by the landing and the app: logo on the left, a context-specific action on the
 * right ("Go to app" on the landing, the wallet button in the app).
 *
 * Carries the colour tokens itself, so it renders the same inside the app's Tailwind shell.
 */
export default function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className={`${s.tokens} ${s.nav}`}>
      <div className={`${s.wrap} ${s.navInner}`}>
        <Link href="/" className={s.logoLink} aria-label="Sunday home">
          <Logo />
        </Link>
        {children}
      </div>
    </header>
  );
}
