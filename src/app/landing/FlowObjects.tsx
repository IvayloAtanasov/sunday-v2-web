/**
 * Illustrations standing behind the flow schema's cards: one small isometric diorama per actor,
 * each on its own slab. Drawn in 3D units and projected, so all four share one perspective.
 *
 * Mostly static. The only state they show is what the cards already say: pool balance as the
 * reservoir level, build progress as panels appearing, production as a tint on the panels.
 */

type V3 = [number, number, number];

const C = {
  top: "#272c34",
  left: "#191c21",
  right: "#1f2329",
  edge: "#3a414c",
  metal: "#6b7380",
  panel: "#223750",
  cell: "#3d5f86",
  glass: "rgba(200, 204, 212, 0.05)",
  money: "#5ee0a0",
  energy: "#f5a524",
};

// Slab footprint in 3D units; every object is built on top of it
const SW = 84;
const SD = 56;
const ST = 5;
/** Screen-space centre and bottom of the slab, used to anchor it to its card */
const ANCHOR_X = ((SW - SD) * 0.866) / 2;
const ANCHOR_Y = (SW + SD) * 0.5 + ST;

const iso = ([x, y, z]: V3): [number, number] => [(x - y) * 0.866, (x + y) * 0.5 - z];
const pts = (...v: V3[]) => v.map((p) => iso(p).map((n) => n.toFixed(1)).join(",")).join(" ");

function Box({
  x, y, z, w, d, h, top = C.top, left = C.left, right = C.right,
}: {
  x: number; y: number; z: number; w: number; d: number; h: number; top?: string; left?: string; right?: string;
}) {
  return (
    <g stroke={C.edge} strokeWidth={0.8} strokeLinejoin="round">
      <polygon points={pts([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} fill={left} />
      <polygon points={pts([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} fill={right} />
      <polygon points={pts([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} fill={top} />
    </g>
  );
}

function Line({ a, b, w = 1.1, color = C.metal }: { a: V3; b: V3; w?: number; color?: string }) {
  const [x1, y1] = iso(a);
  const [x2, y2] = iso(b);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" />;
}

/** Upright cylinder centred at (x, y); r in 3D units */
function Cylinder({ x, y, z, r, h, fill, stroke = C.edge, topFill }: {
  x: number; y: number; z: number; r: number; h: number; fill: string; stroke?: string; topFill?: string;
}) {
  const [cx, by] = iso([x, y, z]);
  const rx = r * 1.2247;
  const ry = r * 0.7071;
  const ty = by - h;
  return (
    <g stroke={stroke} strokeWidth={0.8}>
      <path d={`M${cx - rx} ${by} L${cx - rx} ${ty} L${cx + rx} ${ty} L${cx + rx} ${by} A${rx} ${ry} 0 0 1 ${cx - rx} ${by} Z`} fill={fill} />
      <ellipse cx={cx} cy={ty} rx={rx} ry={ry} fill={topFill ?? fill} />
    </g>
  );
}

function Slab() {
  return <Box x={0} y={0} z={-ST} w={SW} d={SD} h={ST} />;
}

/** Places a diorama so its slab's front corner tucks `overlap` px behind the card's top edge */
export function Diorama({ x, cardTop, scale, overlap = 20, children }: {
  x: number; cardTop: number; scale: number; overlap?: number; children: React.ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${cardTop + overlap}) scale(${scale}) translate(${-ANCHOR_X} ${-ANCHOR_Y})`}>
      <Slab />
      {children}
    </g>
  );
}

// ---------------------------------------------------------------- the four objects

/** Lender pool: an open glass reservoir, filled to `level` (0..1) with EURC */
export function Reservoir({ level }: { level: number }) {
  const [cx, by] = iso([42, 26, 0]);
  const r = 21;
  const rx = r * 1.2247;
  const ry = r * 0.7071;
  const h = 46;
  const ly = by - 2 - (h - 6) * level;
  const silhouette = (top: number) =>
    `M${cx - rx} ${by} L${cx - rx} ${top} A${rx} ${ry} 0 0 0 ${cx + rx} ${top} L${cx + rx} ${by} A${rx} ${ry} 0 0 1 ${cx - rx} ${by} Z`;
  return (
    <g>
      <ellipse cx={cx} cy={by - h} rx={rx} ry={ry} fill="#101318" stroke={C.edge} strokeWidth={0.8} />
      {level > 0.01 && (
        <>
          <path d={silhouette(ly)} fill={C.money} opacity={0.28} />
          <ellipse cx={cx} cy={ly} rx={rx} ry={ry} fill={C.money} opacity={0.5} />
        </>
      )}
      <path d={silhouette(by - h)} fill={C.glass} stroke={C.metal} strokeWidth={1} />
      {[0.35, 0.7].map((f) => (
        <path key={f} d={`M${cx - rx} ${by - h * f} A${rx} ${ry} 0 0 0 ${cx + rx} ${by - h * f}`} fill="none" stroke={C.edge} strokeWidth={0.8} />
      ))}
      <ellipse cx={cx} cy={by - h} rx={rx} ry={ry} fill="none" stroke={C.metal} strokeWidth={1.2} />
      {/* coin stack */}
      {[0, 1, 2].map((i) => (
        <Cylinder key={i} x={74} y={48} z={i * 3.5} r={7} h={3.5} fill="#1d3a2e" topFill="#2d6b50" stroke="#2f5a47" />
      ))}
    </g>
  );
}

/** Energy installation: four panels on legs plus an inverter. `built` 0..1, `glow` 0..1 */
export function SolarArray({ built, glow }: { built: number; glow: number }) {
  const panels: [number, number][] = [[6, 6], [44, 6], [6, 30], [44, 30]];
  return (
    <g>
      {panels.map(([x, y], i) => {
        const L = 34;
        const D = 16;
        const back = 20;
        const front = 9;
        const corners: V3[] = [[x, y, back], [x + L, y, back], [x + L, y + D, front], [x, y + D, front]];
        const shown = built >= (i + 1) / panels.length - 0.05;
        if (!shown) {
          return (
            <polygon key={i} points={pts(...corners)} fill="none" stroke={C.edge} strokeWidth={0.8} strokeDasharray="2 3" />
          );
        }
        const at = (u: number, v: number): V3 => [x + L * u, y + D * v, back + (front - back) * v];
        return (
          <g key={i}>
            <Line a={[x + 3, y + 2, 0]} b={[x + 3, y + 2, back - 1]} w={1} />
            <Line a={[x + L - 3, y + 2, 0]} b={[x + L - 3, y + 2, back - 1]} w={1} />
            <Line a={[x + 3, y + D - 2, 0]} b={[x + 3, y + D - 2, front + 1]} w={1} />
            <Line a={[x + L - 3, y + D - 2, 0]} b={[x + L - 3, y + D - 2, front + 1]} w={1} />
            <polygon points={pts(...corners)} fill={C.panel} stroke={C.cell} strokeWidth={0.9} strokeLinejoin="round" />
            {[1 / 3, 2 / 3].map((u) => <Line key={u} a={at(u, 0)} b={at(u, 1)} w={0.6} color={C.cell} />)}
            <Line a={at(0, 0.5)} b={at(1, 0.5)} w={0.6} color={C.cell} />
            <polygon points={pts(...corners)} fill={C.energy} opacity={0.22 * glow} />
          </g>
        );
      })}
      <Box x={72} y={48} z={0} w={8} d={6} h={11} />
      <circle cx={iso([76, 54, 7])[0]} cy={iso([76, 54, 7])[1]} r={1.3} fill={glow > 0 ? C.energy : C.edge} />
    </g>
  );
}

/** Owner's Sunday account: a card standing on a base, with a coin stack */
export function AccountCard() {
  const x = 14;
  const y = 28;
  const w = 56;
  const d = 3;
  const h = 36;
  const face = (u: number, v: number): V3 => [x + u, y + d, 4 + v];
  const wave = Array.from({ length: 13 }, (_, i) => {
    const u = 36 + i * 1.3;
    return face(u, 26 + 4 * Math.sin((i / 12) * Math.PI * 2));
  });
  return (
    <g>
      <Box x={10} y={24} z={0} w={64} d={11} h={4} />
      <Box x={x} y={y} z={4} w={w} d={d} h={h} left="#1c2129" right="#22272f" top="#2a3038" />
      <polygon points={pts(face(6, 18), face(15, 18), face(15, 26), face(6, 26))} fill="#b07d22" stroke="#d49a33" strokeWidth={0.5} />
      <polyline points={pts(...wave)} fill="none" stroke={C.energy} strokeWidth={1.4} strokeLinecap="round" />
      <Line a={face(6, 9)} b={face(40, 9)} w={1.2} color="#3a414d" />
      <Line a={face(6, 5)} b={face(22, 5)} w={1.2} color="#2c323b" />
      {[0, 1].map((i) => (
        <Cylinder key={i} x={10} y={48} z={i * 3.5} r={6.5} h={3.5} fill="#1d3a2e" topFill="#2d6b50" stroke="#2f5a47" />
      ))}
    </g>
  );
}

/** Electricity trader: a transmission pylon and a small market screen */
export function Pylon() {
  const base: V3[] = [[32, 16, 0], [52, 16, 0], [52, 36, 0], [32, 36, 0]];
  const top: V3[] = [[39, 23, 60], [45, 23, 60], [45, 29, 60], [39, 29, 60]];
  const lerp = (a: V3, b: V3, f: number): V3 => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const levels = [0, 0.25, 0.5, 0.75, 1];
  // bracing on the two faces the viewer sees: y = max (legs 3→2) and x = max (legs 1→2)
  const faces: [number, number][] = [[3, 2], [1, 2]];
  const arm = (z: number, half: number) => ({ a: [42 - half, 26, z] as V3, b: [42 + half, 26, z] as V3 });
  const arms = [arm(48, 22), arm(60, 14)];
  const screen = { x: 60, y: 42, w: 20, d: 4, h: 16 };
  const sf = (u: number, v: number): V3 => [screen.x + u, screen.y + screen.d, v];
  const candles: [number, number, number, string][] = [[4, 5, 10, C.money], [9, 7, 13, C.energy], [14, 8, 14, C.money]];
  return (
    <g>
      {base.map((b, i) => <Line key={`leg${i}`} a={b} b={top[i]} w={1.3} />)}
      {faces.map(([i, j]) =>
        levels.slice(0, -1).map((f, k) => (
          <Line key={`br${i}${j}${k}`} a={lerp(base[i], top[i], f)} b={lerp(base[j], top[j], levels[k + 1])} w={0.7} />
        )),
      )}
      {levels.map((f) => <Line key={`h${f}`} a={lerp(base[3], top[3], f)} b={lerp(base[2], top[2], f)} w={0.7} />)}
      <Line a={[42, 26, 60]} b={[42, 26, 70]} w={1.2} />
      {arms.map(({ a, b }, i) => (
        <g key={`arm${i}`}>
          <Line a={a} b={b} w={1.3} />
          {[a, b].map((p, k) => (
            <g key={k}>
              <Line a={p} b={[p[0], p[1], p[2] - 5]} w={1} color="#6b7380" />
              <circle cx={iso([p[0], p[1], p[2] - 5])[0]} cy={iso([p[0], p[1], p[2] - 5])[1]} r={1.2} fill={C.energy} opacity={0.7} />
            </g>
          ))}
        </g>
      ))}
      <Box x={screen.x} y={screen.y} z={0} w={screen.w} d={screen.d} h={screen.h} left="#111418" />
      {candles.map(([u, v0, v1, col]) => (
        <polygon key={u} points={pts(sf(u, v0), sf(u + 2.5, v0), sf(u + 2.5, v1), sf(u, v1))} fill={col} opacity={0.85} />
      ))}
    </g>
  );
}
