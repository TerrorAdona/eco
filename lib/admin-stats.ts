/**
 * Agrégation mensuelle pour le dashboard administrateur.
 *
 * Fonction pure et déterministe : regroupe des dates de création par mois
 * calendaire sur les `months` derniers mois (mois en cours inclus).
 * Les requêtes Prisma associées ne sélectionnent que `createdAt`
 * (aucune donnée personnelle ou financière).
 */

export interface MonthlyBucket {
    key: string;
    label: string;
    count: number;
}

export function bucketByMonth(dates: (Date | string)[], months: number, now: Date = new Date()): MonthlyBucket[] {
    const safeMonths = Math.max(1, Math.floor(months));
    const buckets: MonthlyBucket[] = [];
    for (let i = safeMonths - 1; i >= 0; i--) {
        const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({
            key: `${ref.getFullYear()}-${ref.getMonth()}`,
            label: ref.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
            count: 0,
        });
    }
    const first = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);
    for (const value of dates) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime()) || date < first || date > now) continue;
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const bucket = buckets.find((b) => b.key === key);
        if (bucket) bucket.count++;
    }
    return buckets;
}
