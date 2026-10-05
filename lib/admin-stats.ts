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

export const ADMIN_PERIODS = {
    last7: { label: "7 derniers jours", days: 7, bucketDays: 1 },
    last30: { label: "30 derniers jours", days: 30, bucketDays: 1 },
    last90: { label: "3 derniers mois", days: 90, bucketDays: 7 },
    last180: { label: "6 derniers mois", days: 180, bucketDays: 30 },
    last365: { label: "12 derniers mois", days: 365, bucketDays: 30 },
} as const;

export type AdminPeriod = keyof typeof ADMIN_PERIODS;

export interface DatedKind {
    date: Date | string;
    kind: string;
}

export interface KindBucket {
    key: string;
    label: string;
    counts: Record<string, number>;
    total: number;
}

/**
 * Regroupe des éléments datés en `bucketCount` intervalles de `bucketDays`
 * jours se terminant aujourd'hui. Pur et déterministe : les éléments futurs,
 * invalides ou hors fenêtre sont ignorés, le nombre d'itérations est borné
 * par la taille de l'entrée.
 */
export function bucketByTime(items: DatedKind[], days: number, bucketDays: number, now: Date = new Date()): KindBucket[] {
    const safeDays = Math.max(1, Math.floor(days));
    const safeBucket = Math.max(1, Math.floor(bucketDays));
    const bucketCount = Math.ceil(safeDays / safeBucket);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const buckets: KindBucket[] = Array.from({ length: bucketCount }, (_, i) => {
        const start = new Date(today);
        start.setDate(today.getDate() - safeDays + i * safeBucket);
        return {
            key: start.toISOString(),
            label: start.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
            counts: {},
            total: 0,
        };
    });
    for (const item of items) {
        const date = new Date(item.date);
        if (Number.isNaN(date.getTime())) continue;
        const day = new Date(date);
        day.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today.getTime() - day.getTime()) / 86400000);
        if (diffDays < 0 || diffDays >= safeDays) continue;
        const index = bucketCount - 1 - Math.floor(diffDays / safeBucket);
        const bucket = buckets[index];
        if (!bucket) continue;
        bucket.counts[item.kind] = (bucket.counts[item.kind] ?? 0) + 1;
        bucket.total++;
    }
    return buckets;
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
