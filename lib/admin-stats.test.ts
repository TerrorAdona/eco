import { describe, expect, it } from "vitest";
import { ADMIN_PERIODS, bucketByMonth, bucketByTime } from "./admin-stats";

describe("bucketByMonth", () => {
    it("répartit les dates sur les derniers mois", () => {
        const now = new Date("2026-09-28T12:00:00");
        const buckets = bucketByMonth(
            [new Date("2026-09-05"), new Date("2026-09-20"), new Date("2026-07-15")],
            3,
            now
        );
        expect(buckets).toHaveLength(3);
        expect(buckets[2].count).toBe(2);
        expect(buckets[0].count).toBe(1);
        expect(buckets[1].count).toBe(0);
    });

    it("ignore les dates futures et trop anciennes", () => {
        const now = new Date("2026-09-28T12:00:00");
        const buckets = bucketByMonth(
            [new Date("2026-12-01"), new Date("2020-01-01"), "invalide"],
            2,
            now
        );
        expect(buckets.every((b) => b.count === 0)).toBe(true);
    });

    it("génère des libellés français", () => {
        const buckets = bucketByMonth([], 1, new Date("2026-09-28T12:00:00"));
        expect(buckets).toHaveLength(1);
        expect(buckets[0].label).toContain("2026");
    });
});

describe("ADMIN_PERIODS", () => {
    it("expose les 5 périodes demandées", () => {
        expect(Object.keys(ADMIN_PERIODS).sort()).toEqual(["last180", "last30", "last365", "last7", "last90"]);
        expect(ADMIN_PERIODS.last7.days).toBe(7);
        expect(ADMIN_PERIODS.last365.days).toBe(365);
    });
});

describe("bucketByTime", () => {
    it("répartit par jour avec tri par kind", () => {
        const now = new Date("2026-09-28T12:00:00");
        const buckets = bucketByTime(
            [
                { date: new Date("2026-09-28T08:00:00"), kind: "expense" },
                { date: new Date("2026-09-28T09:00:00"), kind: "income" },
                { date: new Date("2026-09-27T10:00:00"), kind: "transfer" },
            ],
            7,
            1,
            now
        );
        expect(buckets).toHaveLength(7);
        expect(buckets[6].total).toBe(2);
        expect(buckets[6].counts).toEqual({ expense: 1, income: 1 });
        expect(buckets[5].counts).toEqual({ transfer: 1 });
    });

    it("groupe par semaines et ignore hors fenêtre", () => {
        const now = new Date("2026-09-28T12:00:00");
        const buckets = bucketByTime(
            [
                { date: new Date("2026-09-28T08:00:00"), kind: "a" },
                { date: new Date("2026-06-01T08:00:00"), kind: "a" },
                { date: "invalide", kind: "a" },
                { date: new Date("2026-10-05T08:00:00"), kind: "a" },
            ],
            90,
            7,
            now
        );
        expect(buckets).toHaveLength(13);
        expect(buckets.reduce((acc, b) => acc + b.total, 0)).toBe(1);
    });
});
