
export interface Budget {
    id: string;
    createdAt: Date;
    name: string;
    amount: number;
    category: string;
    emoji: string | null;
    transactions?: Transaction[];
}

export const TRANSACTION_CATEGORIES = [
    "Alimentation",
    "Transport",
    "Logement",
    "Santé",
    "Études",
    "Loisirs",
    "Shopping",
    "Abonnements",
    "Salaire",
    "Autres",
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number];

export const DEFAULT_TRANSACTION_CATEGORY: TransactionCategory = "Autres";

export function normalizeTransactionCategory(value: string | null | undefined): TransactionCategory {
    return (TRANSACTION_CATEGORIES as readonly string[]).includes(value ?? "")
        ? (value as TransactionCategory)
        : DEFAULT_TRANSACTION_CATEGORY;
}

export interface Transaction {
    id: string;
    amount: number;
    emoji: string | null;
    description: string
    category: string;
    createdAt: Date;
    budgetName?: string;
    budgetId?: string | null;
}

export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: Date;
    emoji: string | null;
    createdAt: Date;
}