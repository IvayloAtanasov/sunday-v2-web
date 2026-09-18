import Link from "next/link";
import Logo from "./landing/Logo";
import s from "./landing/landing.module.css";
import {
  hero,
  services,
  notList,
  totals,
  integrity,
  revenue,
  risks,
  footer,
} from "./landing/content";

/**
 * Landing page.
 *
 * A server component with no wallet providers above it, which is the point of keeping
 * those in the `/app` layout: nothing here loads wagmi or RainbowKit.
 */
export default function Landing() {
  return (
    <div className={s.page}>
      <header className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <Link href="/" className={s.logoLink} aria-label="Sunday home">
            <Logo />
          </Link>
          <Link href="/app" className={s.btnPrimary}>
            Go to app →
          </Link>
        </div>
      </header>

      <main>
        <section className={s.hero}>
          <div className={s.wrap}>
            <p className={s.eyebrow}>Onchain finance for energy assets</p>
            <h1 className={s.h1}>{hero.headline}</h1>
            <p className={s.heroSub}>{hero.sub}</p>
            <div className={s.actions}>
              <Link href="/app" className={s.btnPrimary}>
                Go to app →
              </Link>
              <Link href="/how-it-works" className={s.btnGhost}>
                How it works
              </Link>
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={s.wrap}>
            <p className={s.eyebrow}>What Sunday is</p>
            <h2 className={s.h2}>Banking for the people who own the grid&apos;s future.</h2>
            <p className={s.lead}>
              Sunday offers financial services to people and organisations that own, or want to
              own, a renewable energy asset: solar, wind, storage, or anything else along the
              supply chain. We start with project loans funded by lenders. Accounts, settlement
              and credit backed by the asset&apos;s future income come next.{" "}
              <Link href="/how-it-works" className={s.textLink}>
                How it works
              </Link>
            </p>

            <div className={s.serviceGrid}>
              {services.map((svc) => (
                <div key={svc.name} className={s.service}>
                  <span className={svc.live ? s.badgeLive : s.badge}>
                    {svc.live ? "Live" : "Coming"}
                  </span>
                  <h3>{svc.name}</h3>
                  <p>{svc.detail}</p>
                </div>
              ))}
            </div>

            <ul className={s.notList}>
              {notList.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={s.section}>
          <div className={s.wrap}>
            <p className={s.eyebrow}>Where the yield comes from</p>
            <h2 className={s.h2}>Energy in, money out, every step visible.</h2>
            {/* Placeholder: animated flow schema, specced separately (brief §4.3). */}
            <div className={s.schema} role="img" aria-label="Flow schema placeholder">
              <span className={s.schemaNode}>Investor pool</span>
              <span className={s.schemaNode}>Energy installation</span>
              <span className={s.schemaNode}>Owner&apos;s Sunday account</span>
              <span className={s.schemaNode}>Electricity trader</span>
              <span className={s.schemaNote}>Animated flow schema, in design</span>
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={s.wrap}>
            <p className={s.eyebrow}>Projects</p>
            <h2 className={s.h2}>Real installations, real output.</h2>
            <div className={s.totalsGrid}>
              <TotalsGroup title="Ongoing" live stats={totals.ongoing} />
              <TotalsGroup title="Finished" stats={totals.finished} />
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={s.wrap}>
            <p className={s.eyebrow}>Why the number holds</p>
            <h2 className={s.h2}>The rules are set before you lend, and nobody can change them.</h2>
            <p className={s.lead}>
              Yield follows measured production through a formula locked on chain.{" "}
              <Link href="/how-it-works" className={s.textLink}>
                See the mechanism
              </Link>
            </p>
            <div className={s.cards}>
              {integrity.map((item, i) => (
                <div key={item.title} className={s.card}>
                  <div className={s.cardIndex}>{String(i + 1).padStart(2, "0")}</div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <div className={s.callout}>
              <h3>How Sunday earns</h3>
              <p>{revenue}</p>
            </div>
          </div>
        </section>

        <section className={s.section}>
          <div className={s.wrap}>
            <p className={s.eyebrow}>Risks</p>
            <h2 className={s.h2}>What can go wrong, stated plainly.</h2>
            <div className={s.cardsTight}>
              {risks.map((r) => (
                <div key={r.title} className={s.card}>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <div className={s.footerGrid}>
            <div className={s.footerBrand}>
              <Logo />
              <p className={s.footerTag}>{hero.headline}.</p>
            </div>
            <FooterCol title="Sunday" links={footer.links.product} />
            <FooterCol title="Code" links={footer.links.code} />
            <FooterCol title="Social" links={footer.links.social} />
          </div>
          <div className={s.legal}>
            <p>{footer.disclaimer}</p>
            <p>
              © {new Date().getFullYear()} {footer.entity}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TotalsGroup({
  title,
  live,
  stats,
}: {
  title: string;
  live?: boolean;
  stats: { label: string; value: string }[];
}) {
  return (
    <div className={s.totalsGroup}>
      <p className={s.totalsHead}>
        <span className={live ? s.dot : s.dotMuted} />
        {title}
      </p>
      <dl className={s.stats}>
        {stats.map((st) => (
          <div key={st.label} className={s.stat}>
            <dt>{st.label}</dt>
            <dd>{st.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className={s.footerCol}>
      <h4>{title}</h4>
      <ul>
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
