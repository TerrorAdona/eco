/**
 * Monnaie et change (FX).
 *
 * - `formatMoney` centralise l'affichage "12 000 MGA" (devise connue)
 *   avec repli "MGA" pour les montants sans contexte de compte.
 * - Aucune API externe de taux n'est connectée pour l'instant.
 *   Point d'extension prévu : fournir un `ExchangeRate` (stocké en base
 *   ou issu d'une API) à `convertAmount`, qui reste une fonction pure
 *   sans taux inventé ni appel réseau.
 */

export const DEFAULT_CURRENCY = "MGA";

export function formatMoney(amount: number, currency?: string | null): string {
    return `${amount.toLocaleString("fr-FR")} ${currency || DEFAULT_CURRENCY}`;
}

export interface ExchangeRate {
    from: string;
    to: string;
    /** Montant en `to` pour 1 unité de `from`. Doit provenir d'une source explicite. */
    rate: number;
    date: Date;
}

export function convertAmount(amount: number, rate: number): number {
    if (!Number.isFinite(amount) || !Number.isFinite(rate) || rate <= 0) {
        throw new Error("Taux de change invalide");
    }
    return Math.round(amount * rate * 100) / 100;
}
