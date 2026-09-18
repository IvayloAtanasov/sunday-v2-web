/**
 * Landing page copy and figures, kept apart from layout so wording changes don't touch markup.
 * Decisions behind this text: `LANDING_BRIEF_V2.md` at the workspace root.
 */

export const hero = {
  headline: "The financial layer for renewable energy",
  sub: "Fund real energy installations. Earn from what they measurably produce.",
};

export const services: { name: string; detail: string; live: boolean }[] = [
  { name: "Project loans", detail: "Lend stablecoins to a specific installation and earn from its output.", live: true },
  { name: "Asset-backed credit", detail: "Credit lines secured by an installation's value and future income.", live: false },
  { name: "Accounts", detail: "IBAN, onchain stablecoin wallet and debit card in one account.", live: false },
  { name: "Energy settlement", detail: "Get paid in stablecoins for energy sold on the market.", live: false },
  { name: "Fiat ramp", detail: "Move between stablecoins and euros.", live: false },
];

/**
 * PLACEHOLDER FIGURES - hardcoded until a production contract view exists to read them from.
 * Replace or hide before launch.
 */
export const totals = {
  ongoing: [
    { label: "Countries", value: "1" },
    { label: "Projects", value: "3" },
    { label: "Total principal", value: "€240,000" },
  ],
  finished: [
    { label: "Total principal", value: "€0" },
    { label: "Produced", value: "0 MWh" },
    { label: "Interest paid", value: "€0" },
  ],
};

export const integrity = [
  {
    title: "The formula is fixed",
    body: "Each vault's yield formula is pinned on chain when it launches, for the life of the vault. Nobody can change it, Sunday included.",
  },
  {
    title: "No one can set the yield",
    body: "Sunday holds no key that can state a yield. Yield is computed from production data by the pinned formula.",
  },
  {
    title: "Principal is never touched",
    body: "If data delivery stops, principal and accrued premium stay as they are. Accrual simply pauses until data resumes.",
  },
  {
    title: "Data as the source reports it",
    body: "Production figures come from the inverter vendor's API and are passed on unmodified. This is not trustless data. It is the same reading the owner sees.",
  },
];

export const revenue =
  "Sunday takes a share of project returns, set per project and visible on chain. No active loans means no revenue for Sunday.";

export const notList = [
  "No platform token. The only token is the loan itself, bought from us for one specific project.",
  "Not a DAO. Sunday is a company, accountable as one.",
  "Not a fund. You choose the project you lend to.",
];

export const risks = [
  {
    title: "A loan, not ownership",
    body: "The token is a claim on a loan, not on the physical asset. When the token is issued, the installation may not exist yet.",
  },
  {
    title: "Production risk",
    body: "If an installation breaks or stops producing, its loan token is worth close to nothing. So is the asset's income.",
  },
  {
    title: "Counterparty risk",
    body: "Your claim depends on Sunday as the issuer. Read the terms before you lend.",
  },
  {
    title: "Data risk",
    body: "Production data comes from the device vendor. We pass it on unmodified, but cannot independently verify it.",
  },
  {
    title: "Variable yield",
    body: "Returns move with supply and demand, like any onchain lending market. Nothing is guaranteed.",
  },
];

// Testnet deployment (Arc testnet, chain 5042002). Swap for the production address at launch.
const SUN_TOKEN = "0x60e258f8d290ac3aec5a095f552589dce43a03d2";

export const footer = {
  entity: "ACME LTD",
  links: {
    product: [
      { label: "Go to app", href: "/app" },
      { label: "How it works", href: "/how-it-works" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "mailto:hello@example.com" },
    ],
    code: [
      { label: "Web", href: "https://github.com/IvayloAtanasov/sunday-v2-web" },
      { label: "Contracts", href: "https://github.com/IvayloAtanasov/sunday-v2-blockchain" },
      { label: "Backend", href: "https://github.com/IvayloAtanasov/sunday-v2-backend" },
      { label: "Oracle workflows", href: "https://github.com/IvayloAtanasov/sunday-v2-cre" },
      { label: "SunToken (ERC-1155)", href: `https://testnet.arcscan.app/address/${SUN_TOKEN}` },
    ],
    social: [
      { label: "X", href: "#" },
      { label: "LinkedIn", href: "#" },
      { label: "Telegram", href: "#" },
    ],
  },
  disclaimer:
    "Lending to energy projects carries risk, including loss of principal. Yields are variable and not guaranteed. Nothing on this site is investment advice. Services marked as coming soon are not yet available.",
};
