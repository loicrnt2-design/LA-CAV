/** Moteur tarifaire — montants en centimes entiers. Taux DEMO : aucun paiement réel autorisé. */
export const PRICING_IS_DEMO = true;

export interface FeeRule {
  percentBp: number; // points de base (500 = 5 %)
  fixedCents: number;
  minCents: number;
  capCents: number | null;
}

export const DEMO_FEE_RULE: FeeRule = { percentBp: 500, fixedCents: 70, minCents: 100, capCents: 3000 };

export function serviceFee(priceCents: number, rule: FeeRule = DEMO_FEE_RULE): number {
  if (!Number.isInteger(priceCents) || priceCents < 0) throw new Error("Montant invalide");
  let fee = Math.round((priceCents * rule.percentBp) / 10000) + rule.fixedCents;
  fee = Math.max(fee, rule.minCents);
  if (rule.capCents !== null) fee = Math.min(fee, rule.capCents);
  return fee;
}

export interface Breakdown {
  priceCents: number;
  feeCents: number;
  shippingCents: number | null; // null = à calculer
  totalCents: number | null;
}

export function breakdown(priceCents: number, shippingCents: number | null, rule?: FeeRule): Breakdown {
  const feeCents = serviceFee(priceCents, rule);
  return {
    priceCents,
    feeCents,
    shippingCents,
    totalCents: shippingCents === null ? null : priceCents + feeCents + shippingCents,
  };
}

export function parseEuroToCents(input: string): number | null {
  const m = input.trim().replace(/\s/g, "").replace(",", ".").match(/^(\d{1,7})(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  const cents = parseInt(m[1], 10) * 100 + (m[2] ? parseInt(m[2].padEnd(2, "0"), 10) : 0);
  return cents > 0 ? cents : null;
}
