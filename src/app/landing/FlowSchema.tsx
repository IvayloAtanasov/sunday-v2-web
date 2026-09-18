"use client";

import { useEffect, useRef, useState } from "react";
import s from "./landing.module.css";
import { AccountCard, Diorama, Pylon, Reservoir, SolarArray } from "./FlowObjects";

/**
 * Animated flow schema: one sample vault's life, compressed into a 40-second loop.
 *
 * Mirrors LendingVault's phases: lenders subscribe → the owner draws the principal down and
 * builds → the installation sells energy to a trader while the oracle reports measured output
 * and premium accrues → the owner repays principal + premium in one payment → lenders redeem.
 *
 * Everything is a pure function of loop time `t`, so a frame can be rendered for any moment
 * (server render and reduced motion both use a fixed `t`).
 */

// ---------------------------------------------------------------- sample figures

const PRINCIPAL = 240_000;
const TERM_DAYS = 5 * 365;
const TERM_MWH = 1_500;
const PREMIUM = 42_000;
const AVG_PRICE = 90; // €/MWh

// ---------------------------------------------------------------- timeline

const LOOP = 40;
const PHASES = [
  { id: "funding", label: "Funding", start: 0, end: 5 },
  { id: "build", label: "Build", start: 5, end: 9 },
  { id: "accruing", label: "Accruing", start: 9, end: 31 },
  { id: "repay", label: "Repayment", start: 31, end: 35 },
  { id: "redeem", label: "Redemption", start: 35, end: 40 },
] as const;
type PhaseId = (typeof PHASES)[number]["id"];

const TERM_START = 9;
const TERM_END = 31;
const STATIC_T = 20; // frame shown on the server and under reduced motion

// ---------------------------------------------------------------- geometry

type Pt = { x: number; y: number };
type NodeId = "pool" | "plant" | "account" | "trader";
type EdgeId = "drawdown" | "build" | "energy" | "settle" | "data" | "lenders";

type Layout = {
  w: number;
  h: number;
  card: { w: number; h: number };
  art: number; // illustration scale
  nodes: Record<NodeId, Pt>;
  lenders: Pt[];
  ctrl: Partial<Record<EdgeId, Pt>>;
};

// Each card has room above it for its illustration
const WIDE: Layout = {
  w: 1000,
  h: 680,
  card: { w: 200, h: 104 },
  art: 1.3,
  nodes: {
    pool: { x: 210, y: 400 },
    plant: { x: 500, y: 210 },
    account: { x: 500, y: 610 },
    trader: { x: 820, y: 400 },
  },
  lenders: [320, 360, 400, 440, 480].map((y) => ({ x: 42, y })),
  ctrl: {
    drawdown: { x: 250, y: 620 },
    energy: { x: 790, y: 210 },
    settle: { x: 790, y: 620 },
    data: { x: 250, y: 210 },
  },
};

const TALL: Layout = {
  w: 400,
  h: 700,
  card: { w: 186, h: 104 },
  art: 0.8,
  nodes: {
    pool: { x: 111, y: 187 },
    plant: { x: 289, y: 330 },
    account: { x: 111, y: 480 },
    trader: { x: 289, y: 630 },
  },
  lenders: [51, 81, 111, 141, 171].map((x) => ({ x, y: 30 })),
  ctrl: {
    build: { x: 289, y: 480 },
    data: { x: 289, y: 187 },
    settle: { x: 111, y: 630 },
  },
};

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function quad(a: Pt, c: Pt, b: Pt, u: number): Pt {
  const v = 1 - u;
  return { x: v * v * a.x + 2 * v * u * c.x + u * u * b.x, y: v * v * a.y + 2 * v * u * c.y + u * u * b.y };
}

// ---------------------------------------------------------------- helpers

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const frac = (v: number) => v - Math.floor(v);
const smooth = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
/** Trapezoid 0→1→0 over [a, b] with soft edges */
const win = (a: number, b: number, t: number, fade = 0.5) =>
  Math.min(smooth(a, a + fade, t), 1 - smooth(b - fade, b, t));
/** Deterministic noise in [0, 1) */
const hash = (...n: number[]) => frac(Math.sin(n.reduce((acc, v, i) => acc + v * (12.9898 + i * 78.233), 0)) * 43758.5453);

const idSeed = (id: string) => id.split("").reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 9973;

const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-US");
const num = (n: number) => Math.round(n).toLocaleString("en-US");

/** Share of term output produced by progress p: 5 seasonal cycles, g(0)=0, g(1)=1 */
const seasonal = (p: number) => p + (0.3 * Math.sin(10 * Math.PI * p)) / (10 * Math.PI);

const phaseAt = (t: number): PhaseId => PHASES.find((p) => t < p.end)?.id ?? "redeem";

// ---------------------------------------------------------------- flows

type Kind = "money" | "energy";
type Flow = {
  id: string;
  kind: Kind;
  from: Pt;
  to: Pt;
  ctrl?: Pt;
  dur: number; // seconds per traversal
  n: number; // particles in flight at full intensity
  on: (t: number) => number; // intensity at emission time
};

function flows(L: Layout): Flow[] {
  const { pool, plant, account, trader } = L.nodes;
  const lenderCtrl = (p: Pt) => L.ctrl.lenders ?? mid(p, pool);
  const output = (t: number) => 0.7 + 0.3 * Math.cos(10 * Math.PI * clamp((t - TERM_START) / (TERM_END - TERM_START)));
  return [
    ...L.lenders.map((p, i) => ({
      id: `fund${i}`, kind: "money" as Kind, from: p, to: pool, ctrl: lenderCtrl(p),
      dur: 1.2, n: 2, on: (t: number) => win(0.2 + i * 0.25, 4.6, t),
    })),
    { id: "build", kind: "money", from: account, to: plant, ctrl: L.ctrl.build, dur: 1.5, n: 6, on: (t) => win(DRAWDOWN_AT + DRAWDOWN_DUR + 0.2, 8.8, t) },
    { id: "energy", kind: "energy", from: plant, to: trader, ctrl: L.ctrl.energy, dur: 1.8, n: 11, on: (t) => win(TERM_START, LOOP + 1, t) * output(t) },
    { id: "settle", kind: "money", from: trader, to: account, ctrl: L.ctrl.settle, dur: 1.8, n: 8, on: (t) => win(TERM_START + 0.8, LOOP + 1, t) * output(t) },
    { id: "repay", kind: "money", from: account, to: pool, ctrl: L.ctrl.drawdown, dur: 1.4, n: 12, on: (t) => win(31.2, 34.4, t) },
    ...L.lenders.map((p, i) => ({
      id: `redeem${i}`, kind: "money" as Kind, from: pool, to: p, ctrl: lenderCtrl(p),
      dur: 1.2, n: 2, on: (t: number) => win(35.2 + i * 0.2, 38.8, t),
    })),
  ];
}

/** drawdown() moves the whole principal in one transaction: one transfer, not a stream */
const DRAWDOWN_AT = 5.1;
const DRAWDOWN_DUR = 1.9;
/** How long the "+€ loan" tag lingers by the account after the transfer lands */
const LOAN_TAG_DUR = 1.6;

const PULSE_EVERY = 1.0;
const PULSE_DUR = 0.9;

// ---------------------------------------------------------------- state at t

function metrics(t: number) {
  const p = clamp((t - TERM_START) / (TERM_END - TERM_START));
  const pLife = Math.max(0, (t - TERM_START) / (TERM_END - TERM_START)); // plant keeps going after maturity
  const produced = t < TERM_START ? 0 : TERM_MWH * seasonal(pLife);
  const premium = PREMIUM * seasonal(p);
  const owed = PRINCIPAL + premium;
  const jitter = 0.94 + 0.06 * hash(Math.floor(t * 4));
  return {
    phase: phaseAt(t),
    day: Math.floor(p * TERM_DAYS),
    subscribed: PRINCIPAL * smooth(0.3, 4.6, t),
    drawn: t >= DRAWDOWN_AT ? PRINCIPAL : 0, // left the pool
    received: t >= DRAWDOWN_AT + DRAWDOWN_DUR ? PRINCIPAL : 0, // landed in the account
    built: smooth(DRAWDOWN_AT + DRAWDOWN_DUR + 0.3, 8.9, t),
    outputKw: t < TERM_START ? 0 : 190 * (0.7 + 0.3 * Math.cos(10 * Math.PI * pLife)) * jitter,
    produced,
    settled: produced * AVG_PRICE,
    price: 88 + 7 * Math.sin(t * 0.9) + 3 * Math.sin(t * 2.3 + 1),
    premium,
    owed,
    repaid: owed * smooth(31.2, 34.6, t),
    redeemed: owed * smooth(35.3, 39, t),
    /** EURC sitting in the vault right now, as a share of the most it ever holds */
    poolLevel:
      (t < DRAWDOWN_AT
        ? PRINCIPAL * smooth(0.3, 4.6, t)
        : t < 31
          ? 0
          : owed * smooth(31.2, 34.6, t) * (1 - smooth(35.3, 39, t))) /
      (PRINCIPAL + PREMIUM),
  };
}

// ---------------------------------------------------------------- component

export default function FlowSchema() {
  const [t, setT] = useState(STATIC_T);
  const [tall, setTall] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setTall(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Read inside the frame loop, which is set up once; the state copy drives the button
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  useEffect(() => {
    let clock = 0;
    // Dev only: `?flowT=20` opens paused at that second, for reviewing single frames
    const frozen = process.env.NODE_ENV !== "production" && new URLSearchParams(location.search).get("flowT");
    // Reduced motion opens paused on a representative frame; the viewer can still press play
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (frozen || still) {
      clock = frozen ? Number(frozen) % LOOP : STATIC_T;
      pausedRef.current = true;
      setPaused(true);
      setT(clock);
    }
    let visible = true;
    let raf = 0;
    let last = performance.now();
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    if (box.current) io.observe(box.current);
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (visible && !pausedRef.current) {
        clock = (clock + dt) % LOOP;
        setT(clock);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const L = tall ? TALL : WIDE;
  const m = metrics(t);
  const fs = flows(L);
  const { pool, plant, account, trader } = L.nodes;
  const dataCtrl = L.ctrl.data ?? mid(plant, pool);
  const dataOn = win(TERM_START, TERM_END, t, 0.3);
  // Dip at the loop seam so the reset to "unbuilt" isn't a jump cut
  const sceneOpacity = 0.2 + 0.8 * Math.min(smooth(0, 0.8, t), 1 - smooth(LOOP - 1, LOOP, t));

  const phaseLabel = PHASES.find((p) => p.id === m.phase)!.label;
  const term =
    m.phase === "accruing"
      ? `${phaseLabel} · Year ${Math.floor(m.day / 365) + 1} · Day ${(m.day % 365) + 1}`
      : phaseLabel;

  return (
    <div ref={box} className={s.flow}>
      <div className={s.flowHead}>
        <span>Sample vault · {eur(PRINCIPAL)} · 5-year term · illustrative figures</span>
        <span className={s.flowControls}>
          <span className={s.flowClock}>{term}</span>
          <button
            type="button"
            className={s.flowToggle}
            onClick={togglePause}
            aria-label={paused ? "Play animation" : "Pause animation"}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              {paused ? (
                <path d="M2 1 L9 5 L2 9 Z" fill="currentColor" />
              ) : (
                <>
                  <rect x="1.5" y="1" width="2.5" height="8" rx="0.5" fill="currentColor" />
                  <rect x="6" y="1" width="2.5" height="8" rx="0.5" fill="currentColor" />
                </>
              )}
            </svg>
            {paused ? "Play" : "Pause"}
          </button>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${L.w} ${L.h}`}
        className={tall ? `${s.flowSvg} ${s.flowTall}` : s.flowSvg}
        role="img"
        aria-label="Lenders fund a vault; the owner builds an energy installation, sells its output to an electricity trader and repays the vault with premium; lenders redeem."
      >
        <g style={{ opacity: sceneOpacity }}>
          {/* illustrations, behind everything */}
          <Diorama x={pool.x} cardTop={pool.y - L.card.h / 2} scale={L.art}>
            <Reservoir level={m.poolLevel} />
          </Diorama>
          <Diorama x={plant.x} cardTop={plant.y - L.card.h / 2} scale={L.art}>
            <SolarArray built={m.built} glow={m.outputKw / 250} />
          </Diorama>
          <Diorama x={account.x} cardTop={account.y - L.card.h / 2} scale={L.art}>
            <AccountCard />
          </Diorama>
          <Diorama x={trader.x} cardTop={trader.y - L.card.h / 2} scale={L.art}>
            <Pylon />
          </Diorama>

          {/* rails */}
          {fs.filter((f) => !f.id.startsWith("redeem")).map((f) => (
            <path key={`rail-${f.id}`} d={railPath(f)} className={s.rail} />
          ))}
          <path
            d={`M${plant.x} ${plant.y} Q${dataCtrl.x} ${dataCtrl.y} ${pool.x} ${pool.y}`}
            className={s.dataRail}
            style={{ opacity: 0.35 + 0.65 * dataOn, strokeDashoffset: -t * 18 }}
          />

          {/* particles */}
          {fs.flatMap((f) => particles(f, t))}
          {pulses(plant, dataCtrl, pool, t)}
          {drawdown(pool, L.ctrl.drawdown ?? mid(pool, account), account, t)}

          {/* lenders */}
          {L.lenders.map((p, i) => {
            const lit = Math.max(win(0.2 + i * 0.25, 5, t), win(36 + i * 0.2, 39.5, t));
            return (
              <g key={`l${i}`}>
                <circle cx={p.x} cy={p.y} r={9} className={s.lender} />
                <circle cx={p.x} cy={p.y} r={3.5} fill="var(--money)" opacity={0.25 + 0.75 * lit} />
              </g>
            );
          })}
          <text
            x={tall ? L.lenders[L.lenders.length - 1].x + 20 : L.lenders[0].x}
            y={tall ? L.lenders[0].y + 4 : L.lenders[0].y - 22}
            className={s.nodeSub}
            textAnchor={tall ? "start" : "middle"}
          >
            Lenders
          </text>

          {/* nodes */}
          <Card L={L} at={pool} title="Lender pool" sub="LendingVault · EURC" live
            rows={poolRows(m)} />
          <Card L={L} at={plant} title="Energy installation" sub="250 kWp · solar" live={m.phase !== "funding"}
            dashed={m.built < 1}
            rows={
              m.phase === "funding"
                ? [["Status", "Awaiting funds"], ["Produced", "—"]]
                : m.built < 1
                  ? [["Building", `${Math.round(m.built * 100)}%`], ["Produced", "—"]]
                  : [["Output", `${num(m.outputKw)} kW`], ["Produced", `${num(m.produced)} MWh`]]
            } />
          <Card L={L} at={account} title="Owner's Sunday account" sub="IBAN · wallet · card" live={m.phase !== "funding"}
            rows={[
              m.phase === "repay" || m.phase === "redeem" ? ["Repaid to pool", eur(m.repaid)] : ["Loan received", eur(m.received)],
              ["Energy sales", eur(m.settled)],
            ]} />
          <Card L={L} at={trader} title="Electricity trader" sub="day-ahead market" live={t >= TERM_START}
            rows={[["Price", `€${m.price.toFixed(1)}/MWh`], ["Bought", `${num(m.produced)} MWh`]]} />

          {premiumTicks(pool, L, t)}
          {loanTag(account, L, t)}
        </g>
      </svg>

      <div className={s.flowFoot}>
        <ol className={s.timeline}>
          {PHASES.map((p) => {
            const fill = clamp((t - p.start) / (p.end - p.start));
            return (
              <li key={p.id} style={{ flexGrow: p.end - p.start }} className={p.id === m.phase ? s.tlActive : undefined}>
                <span className={s.tlBar}><span style={{ width: `${fill * 100}%` }} /></span>
                <span className={s.tlLabel}>{p.label}</span>
              </li>
            );
          })}
        </ol>
        <ul className={s.legend}>
          <li><i style={{ background: "var(--energy)" }} />Energy</li>
          <li><i style={{ background: "var(--money)" }} />Money (EURC / EUR)</li>
          <li><i className={s.legendData} />Measured output → oracle → vault</li>
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- pieces

function railPath(f: Flow) {
  const c = f.ctrl ?? mid(f.from, f.to);
  return `M${f.from.x} ${f.from.y} Q${c.x} ${c.y} ${f.to.x} ${f.to.y}`;
}

function particles(f: Flow, t: number) {
  const c = f.ctrl ?? mid(f.from, f.to);
  const seed = idSeed(f.id);
  const offset = hash(seed); // so parallel flows don't move in lockstep
  const out = [];
  for (let k = 0; k < f.n; k++) {
    const ph = t / f.dur + k / f.n + offset;
    const u = frac(ph);
    const born = t - u * f.dur;
    if (hash(seed, k, Math.floor(ph)) >= f.on(born)) continue;
    const pt = quad(f.from, c, f.to, u);
    const a = Math.min(1, u / 0.1, (1 - u) / 0.1);
    out.push(
      <circle
        key={`${f.id}-${k}`}
        cx={pt.x}
        cy={pt.y}
        r={f.kind === "energy" ? 3 : 3.4}
        fill={f.kind === "energy" ? "var(--energy)" : "var(--money)"}
        opacity={a}
      />,
    );
  }
  return out;
}

/** Oracle reports: plant → pool, one per PULSE_EVERY during the term */
function pulses(from: Pt, c: Pt, to: Pt, t: number) {
  if (t < TERM_START || t > TERM_END + PULSE_DUR) return null;
  const j = Math.floor((t - TERM_START) / PULSE_EVERY);
  const u = (t - TERM_START - j * PULSE_EVERY) / PULSE_DUR;
  if (u > 1 || TERM_START + j * PULSE_EVERY > TERM_END - 0.2) return null;
  const pt = quad(from, c, to, u);
  return <rect x={pt.x - 4} y={pt.y - 4} width={8} height={8} rx={1.5} className={s.pulse} transform={`rotate(45 ${pt.x} ${pt.y})`} />;
}

/** The principal as a single transfer, pool → owner's account */
function drawdown(from: Pt, c: Pt, to: Pt, t: number) {
  const u = (t - DRAWDOWN_AT) / DRAWDOWN_DUR;
  if (u < 0 || u > 1) return null;
  const e = u * u * (3 - 2 * u); // ease in and out: one deliberate move
  const pt = quad(from, c, to, e);
  const a = Math.min(1, u / 0.08, (1 - u) / 0.08);
  return (
    <circle cx={pt.x} cy={pt.y} r={6.5} className={s.transfer} opacity={a} />
  );
}

/** "+€n loan" rising beside the account once the drawdown lands, like the premium tags */
function loanTag(account: Pt, L: Layout, t: number) {
  const age = t - (DRAWDOWN_AT + DRAWDOWN_DUR);
  if (age < 0 || age > LOAN_TAG_DUR) return null;
  return (
    <text
      x={account.x + L.card.w / 2 + 10}
      y={account.y - L.card.h / 2 + 12 - age * 14}
      className={s.tick}
      opacity={Math.min(smooth(0, 0.15, age), 1 - smooth(LOAN_TAG_DUR - 0.5, LOAN_TAG_DUR, age))}
    >
      +{eur(PRINCIPAL)} loan
    </text>
  );
}

/** "+€n premium" floating up from the pool as each report lands */
function premiumTicks(pool: Pt, L: Layout, t: number) {
  if (t < TERM_START + PULSE_DUR || t > TERM_END + 2) return null;
  const j = Math.floor((t - TERM_START - PULSE_DUR) / PULSE_EVERY);
  const landed = TERM_START + j * PULSE_EVERY + PULSE_DUR;
  const age = t - landed;
  if (age > 0.9 || landed - PULSE_DUR > TERM_END - 0.2) return null;
  const span = TERM_END - TERM_START;
  const p0 = (j * PULSE_EVERY) / span;
  const p1 = ((j + 1) * PULSE_EVERY) / span;
  const delta = PREMIUM * (seasonal(clamp(p1)) - seasonal(clamp(p0)));
  return (
    <text
      x={pool.x + L.card.w / 2 + 10}
      y={pool.y - L.card.h / 2 + 12 - age * 22}
      className={s.tick}
      opacity={1 - smooth(0.4, 0.9, age)}
    >
      +{eur(delta)} premium
    </text>
  );
}

function poolRows(m: ReturnType<typeof metrics>): [string, string][] {
  switch (m.phase) {
    case "funding":
      return [["Subscribed", eur(m.subscribed)], ["Target", eur(PRINCIPAL)]];
    case "build":
      return [["Drawn down", eur(m.drawn)], ["Claims issued", num(PRINCIPAL)]];
    case "accruing":
      return [["Owed", eur(m.owed)], ["Premium", "+" + eur(m.premium)]];
    case "repay":
      return [["Repaid", eur(m.repaid)], ["Owed", eur(m.owed)]];
    case "redeem":
      return [["Redeemed", eur(m.redeemed)], ["Claims burned", num((m.redeemed / m.owed) * PRINCIPAL)]];
  }
}

function Card({
  L, at, title, sub, rows, live, dashed,
}: {
  L: Layout; at: Pt; title: string; sub: string; rows: [string, string][]; live: boolean; dashed?: boolean;
}) {
  const { w, h } = L.card;
  const x = at.x - w / 2;
  const y = at.y - h / 2;
  const pad = 14;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} className={dashed ? s.cardDashed : s.cardRect} />
      <circle cx={x + w - pad} cy={y + 20} r={3.5} className={live ? s.liveDot : s.idleDot} />
      <text x={x + pad} y={y + 24} className={s.nodeTitle}>{title}</text>
      <text x={x + pad} y={y + 40} className={s.nodeSub}>{sub}</text>
      <line x1={x + pad} x2={x + w - pad} y1={y + 51} y2={y + 51} className={s.cardRule} />
      {rows.map(([k, v], i) => (
        <g key={k}>
          <text x={x + pad} y={y + 71 + i * 20} className={s.rowKey}>{k}</text>
          <text x={x + w - pad} y={y + 71 + i * 20} className={s.rowVal} textAnchor="end">{v}</text>
        </g>
      ))}
    </g>
  );
}
