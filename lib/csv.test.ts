import { describe, expect, it } from "vitest";
import { csvFilename, CSV_HEADERS, formatTransactionDate, transactionsToCsv } from "./csv";
import { Transaction } from "@/type";

const tx = (over: Partial<Transaction> & { id: string }): Transaction => ({
    amount: 0,
    emoji: null,
    description: "",
    category: "Autres",
    createdAt: new Date("2026-09-10T10:30:00"),
    ...over,
});

describe("transactionsToCsv", () => {
    it("génère uniquement les en-têtes sans transaction", () => {
        const csv = transactionsToCsv([]);
        expect(csv.charCodeAt(0)).toBe(0xfeff);
        expect(csv.slice(1)).toBe("date;description;montant;categorie;budget;type");
        expect(CSV_HEADERS).toHaveLength(6);
    });

    it("exporte une transaction avec ses colonnes", () => {
        const lines = transactionsToCsv([
            tx({ id: "a", description: "Courses", amount: 12000, category: "Alimentation", budgetName: "Sakafo" }),
        ]).split("\r\n");
        expect(lines).toHaveLength(2);
        expect(lines[1]).toContain("Courses");
        expect(lines[1]).toContain("12000");
        expect(lines[1]).toContain("Alimentation");
        expect(lines[1]).toContain("Sakafo");
    });

    it("échappe points-virgules, guillemets et retours", () => {
        const csv = transactionsToCsv([
            tx({ id: "a", description: "Taxi; ville", amount: 1, category: "Transport" }),
            tx({ id: "b", description: 'Forfait "illimité"', amount: 1, category: "Abonnements" }),
            tx({ id: "c", description: "Ligne1\nLigne2", amount: 1, category: "Santé" }),
        ]);
        expect(csv).toContain('"Taxi; ville"');
        expect(csv).toContain('"Forfait ""illimité"""');
        expect(csv).toContain('"Ligne1\nLigne2"');
    });
});

describe("formatTransactionDate", () => {
    it("formate en jj/mm/aaaa hh:mm", () => {
        expect(formatTransactionDate(new Date("2026-09-10T10:30:00"))).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });
});

describe("csvFilename", () => {
    it("génère un nom horodaté", () => {
        expect(csvFilename(new Date("2026-09-28T08:05:00"))).toBe("transactions-20260928-0805.csv");
    });
});
