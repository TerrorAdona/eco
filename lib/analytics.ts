/**
 * Analyses financières simples, déterministes et explicables.
 *
 * - Comparaison de périodes : totaux de la période sélectionnée contre la
 *   période précédente de même durée (aucun modèle, simple arithmétique).
 * - Dépense inhabituelle : une transaction est signalée si son montant
 *   dépasse 2 fois la moyenne des AUTRES transactions de la même catégorie
 *   sur la même période, avec au moins 2 autres transactions pour que la
 *   moyenne soit significative. Pas d'IA/ML, règle fixe et vérifiable.
 *
 * Note revenus : le modèle n'enregistre que des dépenses (montants > 0
 * imposés à la création). Aucune évolution des revenus n'est donc affichée :
 * il n'y a pas de données de revenus à analyser.
 */

export interface PeriodComparison {
    currentTotal: number;
    previousTotal: number;
    currentCount: number;
    previousCount: number;
    deltaPercent: number | null;
}

export function comparePeriods(currentTotal: number, previousTotal: number, currentCount: number, previousCount: number): PeriodComparison {
    let deltaPercent: number | null = null;
    if (previousTotal > 0) {
        deltaPercent = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
    } else if (currentTotal > 0) {
        deltaPercent = 100;
    }
    return { currentTotal, previousTotal, currentCount, previousCount, deltaPercent };
}

export interface UnusualSpending {
    id: string;
    description: string;
    amount: number;
    category: string;
    ratio: number;
    categoryAverage: number;
}

const UNUSUAL_RATIO = 2;
const UNUSUAL_MIN_SAMPLE = 2;

export function detectUnusualSpending<T extends { id: string; description: string; amount: number; category: string }>(
    transactions: T[],
    maxResults = 5
): UnusualSpending[] {
    const byCategory = new Map<string, T[]>();
    for (const t of transactions) {
        const list = byCategory.get(t.category) ?? [];
        list.push(t);
        byCategory.set(t.category, list);
    }
    const flagged: UnusualSpending[] = [];
    for (const [category, list] of byCategory) {
        if (list.length <= UNUSUAL_MIN_SAMPLE) continue;
        const total = list.reduce((acc, t) => acc + t.amount, 0);
        for (const t of list) {
            const othersTotal = total - t.amount;
            const othersCount = list.length - 1;
            const average = othersTotal / othersCount;
            if (average > 0 && t.amount > UNUSUAL_RATIO * average) {
                flagged.push({
                    id: t.id,
                    description: t.description,
                    amount: t.amount,
                    category,
                    ratio: Math.round((t.amount / average) * 10) / 10,
                    categoryAverage: Math.round(average),
                });
            }
        }
    }
    return flagged.sort((a, b) => b.ratio - a.ratio).slice(0, maxResults);
}
