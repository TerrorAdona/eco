import { normalizeTransactionCategory, Transaction } from "@/type";
import { DEFAULT_CURRENCY } from "./money";

export const CSV_HEADERS = ["date", "description", "montant", "devise", "categorie", "budget", "type"] as const;

const CSV_BOM = String.fromCharCode(0xfeff);

function escapeCsvField(value: string): string {
    const needsQuotes = value.includes(";") || value.includes('"') || value.includes("\n") || value.includes("\r");
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
}

export function formatTransactionDate(value: Date | string): string {
    const date = new Date(value);
    const day = date.toLocaleDateString("fr-FR");
    const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return `${day} ${time}`;
}

export function transactionsToCsv(transactions: Transaction[]): string {
    const lines = [CSV_HEADERS.join(";")];
    for (const t of transactions) {
        lines.push(
            [
                formatTransactionDate(t.createdAt),
                t.description,
                String(t.amount),
                t.accountCurrency || t.account?.currency || DEFAULT_CURRENCY,
                normalizeTransactionCategory(t.category),
                t.budgetName ?? "",
                "",
            ].map(escapeCsvField).join(";")
        );
    }
    return CSV_BOM + lines.join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function csvFilename(now: Date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `transactions-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
}
