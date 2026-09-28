import { describe, expect, it } from "vitest";
import { advanceRecurrence, nextOccurrences } from "./recurrence";

const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

describe("advanceRecurrence", () => {
    it("avance de 7 jours en hebdomadaire", () => {
        expect(fmt(advanceRecurrence(new Date("2026-09-01"), "WEEKLY"))).toBe("2026-09-08");
    });

    it("avance d'un mois en mensuel", () => {
        expect(fmt(advanceRecurrence(new Date("2026-09-15"), "MONTHLY"))).toBe("2026-10-15");
    });
});

describe("nextOccurrences", () => {
    it("clamp fin de mois en conservant l'ancre (31 jan -> 28 fév -> 31 mars)", () => {
        const dates = nextOccurrences("2026-01-31", "MONTHLY", null, new Date("2026-01-01"), 3).map(fmt);
        expect(dates).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
    });

    it("gère le 29 février en annuel", () => {
        const dates = nextOccurrences("2024-02-29", "YEARLY", null, new Date("2024-01-01"), 2).map(fmt);
        expect(dates).toEqual(["2024-02-29", "2025-02-28"]);
    });

    it("ne retourne rien après la date de fin", () => {
        expect(nextOccurrences("2026-01-05", "WEEKLY", "2026-01-10", new Date("2026-06-01"), 5)).toEqual([]);
    });

    it("reprend aux prochaines dates quand le début est passé", () => {
        const from = new Date("2026-09-28");
        const dates = nextOccurrences("2020-01-01", "MONTHLY", null, from, 2);
        expect(dates).toHaveLength(2);
        expect(dates[0].getTime()).toBeGreaterThanOrEqual(new Date("2026-09-28").getTime());
    });

    it("limite le nombre d'occurrences", () => {
        expect(nextOccurrences("2026-01-01", "WEEKLY", null, new Date("2026-01-01"), 5)).toHaveLength(5);
    });
});
