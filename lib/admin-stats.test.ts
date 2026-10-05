import { describe, expect, it } from "vitest";
import { bucketByMonth } from "./admin-stats";

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
